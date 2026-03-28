import { describe, it, expect, beforeEach } from "vitest";
import { prismaMock } from "./helpers/prismaMock.js";
import request from "supertest";
import app from "../app.js";

describe("Items API", () => {
  beforeEach(() => {
    Object.values(prismaMock).forEach((model) => {
      if (typeof model === "function") {
        (model as ReturnType<typeof import("vitest").vi.fn>).mockReset();
        return;
      }
      Object.values(model).forEach((fn) => (fn as ReturnType<typeof import("vitest").vi.fn>).mockReset());
    });
    prismaMock.$transaction.mockImplementation((promises: unknown[]) => Promise.all(promises));
  });

  const sampleItem = {
    id: "item-1",
    ownerId: "user-1",
    title: "Power Drill",
    description: "A powerful drill",
    category: "Tools",
    condition: "good",
    images: [],
    location: { city: "Austin", state: "TX", zip: "78701" },
    createdAt: new Date(),
    updatedAt: new Date(),
    owner: { id: "user-1", email: "test@test.com", displayName: "Test User" },
  };

  describe("GET /api/items", () => {
    it("returns a list of items", async () => {
      prismaMock.item.findMany.mockResolvedValue([sampleItem]);

      const res = await request(app).get("/api/items");

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].title).toBe("Power Drill");
      expect(res.body.error).toBeNull();
    });

    it("returns 500 on database error", async () => {
      prismaMock.item.findMany.mockRejectedValue(new Error("DB error"));

      const res = await request(app).get("/api/items");

      expect(res.status).toBe(500);
      expect(res.body.error).toBe("Internal server error");
    });
  });

  describe("GET /api/items/:id", () => {
    it("returns item by id", async () => {
      prismaMock.item.findUnique.mockResolvedValue(sampleItem);

      const res = await request(app).get("/api/items/item-1");

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe("item-1");
    });

    it("returns 404 for missing item", async () => {
      prismaMock.item.findUnique.mockResolvedValue(null);

      const res = await request(app).get("/api/items/nonexistent");

      expect(res.status).toBe(404);
      expect(res.body.error).toBe("Item not found");
    });
  });

  describe("POST /api/items", () => {
    it("creates a new item", async () => {
      const newItem = { ...sampleItem };
      prismaMock.item.create.mockResolvedValue(newItem);

      const res = await request(app)
        .post("/api/items")
        .send({
          ownerId: "user-1",
          title: "Power Drill",
          description: "A powerful drill",
          category: "Tools",
          condition: "good",
        });

      expect(res.status).toBe(201);
      expect(res.body.data.title).toBe("Power Drill");
      expect(res.body.message).toBe("Item created");
    });

    it("returns 400 for missing required fields", async () => {
      const res = await request(app).post("/api/items").send({ title: "No owner" });

      expect(res.status).toBe(400);
      expect(res.body.error).toBeTruthy();
    });
  });

  describe("PUT /api/items/:id", () => {
    it("updates an existing item when owner", async () => {
      prismaMock.item.findUnique.mockResolvedValue(sampleItem);
      prismaMock.item.update.mockResolvedValue({ ...sampleItem, title: "Updated Drill" });

      const res = await request(app)
        .put("/api/items/item-1")
        .set("x-user-id", "user-1")
        .send({ title: "Updated Drill" });

      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe("Updated Drill");
    });

    it("returns 403 for non-owner", async () => {
      prismaMock.item.findUnique.mockResolvedValue(sampleItem);

      const res = await request(app)
        .put("/api/items/item-1")
        .set("x-user-id", "user-999")
        .send({ title: "Updated Drill" });

      expect(res.status).toBe(403);
      expect(res.body.error).toContain("Forbidden");
    });

    it("returns 403 when no x-user-id header", async () => {
      prismaMock.item.findUnique.mockResolvedValue(sampleItem);

      const res = await request(app)
        .put("/api/items/item-1")
        .send({ title: "Updated Drill" });

      expect(res.status).toBe(403);
    });

    it("returns 404 for missing item", async () => {
      prismaMock.item.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .put("/api/items/nonexistent")
        .set("x-user-id", "user-1")
        .send({ title: "Updated" });

      expect(res.status).toBe(404);
    });
  });

  describe("DELETE /api/items/:id", () => {
    it("deletes an item with no rentable (owner)", async () => {
      prismaMock.item.findUnique.mockResolvedValue(sampleItem);
      prismaMock.rentableItem.findUnique.mockResolvedValue(null);
      prismaMock.item.delete.mockResolvedValue(sampleItem);

      const res = await request(app)
        .delete("/api/items/item-1")
        .set("x-user-id", "user-1");

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Item deleted");
      expect(prismaMock.item.delete).toHaveBeenCalledWith({ where: { id: "item-1" } });
    });

    it("cascade deletes item with rentable and related records when no active rentals or cart items", async () => {
      const rentable = { id: "rentable-1", itemId: "item-1" };
      prismaMock.item.findUnique.mockResolvedValue(sampleItem);
      prismaMock.rentableItem.findUnique.mockResolvedValue(rentable);
      prismaMock.rental.count.mockResolvedValue(0);
      prismaMock.cartItem.count.mockResolvedValue(0);
      prismaMock.$transaction.mockResolvedValue([]);

      const res = await request(app)
        .delete("/api/items/item-1")
        .set("x-user-id", "user-1");

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Item deleted");
      expect(prismaMock.$transaction).toHaveBeenCalled();
    });

    it("returns 409 when item has active rentals", async () => {
      const rentable = { id: "rentable-1", itemId: "item-1" };
      prismaMock.item.findUnique.mockResolvedValue(sampleItem);
      prismaMock.rentableItem.findUnique.mockResolvedValue(rentable);
      prismaMock.rental.count.mockResolvedValue(1);

      const res = await request(app)
        .delete("/api/items/item-1")
        .set("x-user-id", "user-1");

      expect(res.status).toBe(409);
      expect(res.body.error).toBe("Cannot delete: item has active rentals");
      expect(prismaMock.$transaction).not.toHaveBeenCalled();
    });

    it("returns 409 when item is in users' carts", async () => {
      const rentable = { id: "rentable-1", itemId: "item-1" };
      prismaMock.item.findUnique.mockResolvedValue(sampleItem);
      prismaMock.rentableItem.findUnique.mockResolvedValue(rentable);
      prismaMock.rental.count.mockResolvedValue(0);
      prismaMock.cartItem.count.mockResolvedValue(2);

      const res = await request(app)
        .delete("/api/items/item-1")
        .set("x-user-id", "user-1");

      expect(res.status).toBe(409);
      expect(res.body.error).toBe("Cannot delete: item is in users' carts");
      expect(prismaMock.$transaction).not.toHaveBeenCalled();
    });

    it("returns 403 for non-owner", async () => {
      prismaMock.item.findUnique.mockResolvedValue(sampleItem);

      const res = await request(app)
        .delete("/api/items/item-1")
        .set("x-user-id", "user-999");

      expect(res.status).toBe(403);
      expect(res.body.error).toContain("Forbidden");
    });

    it("returns 403 when no x-user-id header", async () => {
      prismaMock.item.findUnique.mockResolvedValue(sampleItem);

      const res = await request(app).delete("/api/items/item-1");

      expect(res.status).toBe(403);
    });

    it("returns 404 for missing item", async () => {
      prismaMock.item.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .delete("/api/items/nonexistent")
        .set("x-user-id", "user-1");

      expect(res.status).toBe(404);
    });
  });
});
