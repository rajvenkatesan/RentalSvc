import { describe, it, expect, beforeEach } from "vitest";
import { prismaMock } from "./helpers/prismaMock.js";
import request from "supertest";
import app from "../app.js";

describe("Rentable Items API", () => {
  beforeEach(() => {
    Object.values(prismaMock).forEach((model) => {
      Object.values(model).forEach((fn) => (fn as ReturnType<typeof import("vitest").vi.fn>).mockReset());
    });
  });

  const sampleRentableItem = {
    id: "ri-1",
    itemId: "item-1",
    dailyRate: 25.0,
    weeklyRate: 150.0,
    securityDeposit: 100.0,
    minRentalDays: 1,
    maxRentalDays: 30,
    deliveryOptions: ["pickup"],
    shippingCost: null,
    isAvailable: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    item: {
      id: "item-1",
      title: "Power Drill",
      category: "Tools",
      owner: { id: "user-1", displayName: "Test User" },
    },
  };

  describe("GET /api/rentable-items", () => {
    it("returns a list of rentable items", async () => {
      prismaMock.rentableItem.findMany.mockResolvedValue([sampleRentableItem]);

      const res = await request(app).get("/api/rentable-items");

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.error).toBeNull();
    });

    it("filters by category", async () => {
      prismaMock.rentableItem.findMany.mockResolvedValue([sampleRentableItem]);

      const res = await request(app).get("/api/rentable-items?category=Tools");

      expect(res.status).toBe(200);
      expect(prismaMock.rentableItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            item: { category: "Tools" },
          }),
        }),
      );
    });

    it("filters by price range", async () => {
      prismaMock.rentableItem.findMany.mockResolvedValue([]);

      const res = await request(app).get("/api/rentable-items?minPrice=10&maxPrice=50");

      expect(res.status).toBe(200);
      expect(prismaMock.rentableItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            dailyRate: { gte: 10, lte: 50 },
          }),
        }),
      );
    });

    it("filters by availability", async () => {
      prismaMock.rentableItem.findMany.mockResolvedValue([]);

      const res = await request(app).get("/api/rentable-items?isAvailable=true");

      expect(res.status).toBe(200);
      expect(prismaMock.rentableItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isAvailable: true,
          }),
        }),
      );
    });

    it("sorts by price", async () => {
      prismaMock.rentableItem.findMany.mockResolvedValue([]);

      const res = await request(app).get("/api/rentable-items?sort=price");

      expect(res.status).toBe(200);
      expect(prismaMock.rentableItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { dailyRate: "asc" },
        }),
      );
    });
  });

  describe("GET /api/rentable-items/:id", () => {
    it("returns rentable item by id", async () => {
      prismaMock.rentableItem.findUnique.mockResolvedValue(sampleRentableItem);

      const res = await request(app).get("/api/rentable-items/ri-1");

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe("ri-1");
    });

    it("falls back to itemId lookup when id not found", async () => {
      prismaMock.rentableItem.findUnique
        .mockResolvedValueOnce(null) // first call: by id — not found
        .mockResolvedValueOnce(sampleRentableItem); // second call: by itemId — found

      const res = await request(app).get("/api/rentable-items/item-1");

      expect(res.status).toBe(200);
      expect(res.body.data.itemId).toBe("item-1");
      expect(prismaMock.rentableItem.findUnique).toHaveBeenCalledTimes(2);
      expect(prismaMock.rentableItem.findUnique).toHaveBeenNthCalledWith(2,
        expect.objectContaining({ where: { itemId: "item-1" } }),
      );
    });

    it("returns 404 for missing rentable item", async () => {
      prismaMock.rentableItem.findUnique.mockResolvedValue(null);

      const res = await request(app).get("/api/rentable-items/nonexistent");

      expect(res.status).toBe(404);
    });
  });

  describe("POST /api/rentable-items", () => {
    it("creates a new rentable item", async () => {
      prismaMock.rentableItem.create.mockResolvedValue(sampleRentableItem);

      const res = await request(app)
        .post("/api/rentable-items")
        .send({ itemId: "item-1", dailyRate: 25.0 });

      expect(res.status).toBe(201);
      expect(res.body.message).toBe("Rentable item created");
    });

    it("returns 400 for missing required fields", async () => {
      const res = await request(app).post("/api/rentable-items").send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("Missing required fields");
    });
  });

  describe("PUT /api/rentable-items/:id", () => {
    it("updates an existing rentable item", async () => {
      prismaMock.rentableItem.findUnique.mockResolvedValue(sampleRentableItem);
      prismaMock.rentableItem.update.mockResolvedValue({ ...sampleRentableItem, dailyRate: 30 });

      const res = await request(app)
        .put("/api/rentable-items/ri-1")
        .send({ dailyRate: 30 });

      expect(res.status).toBe(200);
      expect(res.body.data.dailyRate).toBe(30);
    });

    it("returns 404 for missing rentable item", async () => {
      prismaMock.rentableItem.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .put("/api/rentable-items/nonexistent")
        .send({ dailyRate: 30 });

      expect(res.status).toBe(404);
    });
  });

  describe("DELETE /api/rentable-items/:id", () => {
    it("deletes an existing rentable item", async () => {
      prismaMock.rentableItem.findUnique.mockResolvedValue(sampleRentableItem);
      prismaMock.rentableItem.delete.mockResolvedValue(sampleRentableItem);

      const res = await request(app).delete("/api/rentable-items/ri-1");

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Rentable item deleted");
    });

    it("returns 404 for missing rentable item", async () => {
      prismaMock.rentableItem.findUnique.mockResolvedValue(null);

      const res = await request(app).delete("/api/rentable-items/nonexistent");

      expect(res.status).toBe(404);
    });
  });
});
