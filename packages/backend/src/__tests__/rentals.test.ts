import { describe, it, expect, beforeEach } from "vitest";
import { prismaMock } from "./helpers/prismaMock.js";
import request from "supertest";
import app from "../app.js";

describe("Rentals API", () => {
  beforeEach(() => {
    Object.values(prismaMock).forEach((model) => {
      if (typeof model === "function") { (model as ReturnType<typeof import("vitest").vi.fn>).mockReset(); return; }
      Object.values(model).forEach((fn) => (fn as ReturnType<typeof import("vitest").vi.fn>).mockReset());
    });
  });

  const sampleRental = {
    id: "rental-1",
    renterId: "user-1",
    rentableItemId: "ri-1",
    startDate: new Date("2025-01-01"),
    endDate: new Date("2025-01-05"),
    totalCost: 100,
    status: "active",
    createdAt: new Date(),
    updatedAt: new Date(),
    rentableItem: {
      id: "ri-1",
      dailyRate: 25,
      item: { id: "item-1", title: "Power Drill" },
    },
  };

  describe("GET /api/rentals", () => {
    it("returns user's rentals with item details", async () => {
      prismaMock.rental.findMany.mockResolvedValue([sampleRental]);

      const res = await request(app).get("/api/rentals?userId=user-1");

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].id).toBe("rental-1");
      expect(res.body.data[0].rentableItem.item.title).toBe("Power Drill");
      expect(res.body.error).toBeNull();
    });

    it("returns 400 when userId query param is missing", async () => {
      const res = await request(app).get("/api/rentals");

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("Missing required query parameter");
    });

    it("returns empty array when user has no rentals", async () => {
      prismaMock.rental.findMany.mockResolvedValue([]);

      const res = await request(app).get("/api/rentals?userId=user-1");

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(0);
    });

    it("returns 500 on database error", async () => {
      prismaMock.rental.findMany.mockRejectedValue(new Error("DB error"));

      const res = await request(app).get("/api/rentals?userId=user-1");

      expect(res.status).toBe(500);
      expect(res.body.error).toBe("Internal server error");
    });
  });

  describe("GET /api/rentals/:id", () => {
    it("returns single rental with item details", async () => {
      prismaMock.rental.findUnique.mockResolvedValue(sampleRental);

      const res = await request(app).get("/api/rentals/rental-1");

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe("rental-1");
      expect(res.body.data.rentableItem.item.title).toBe("Power Drill");
      expect(res.body.error).toBeNull();
    });

    it("returns 404 for non-existent rental", async () => {
      prismaMock.rental.findUnique.mockResolvedValue(null);

      const res = await request(app).get("/api/rentals/nonexistent");

      expect(res.status).toBe(404);
      expect(res.body.error).toBe("Rental not found");
    });

    it("returns 500 on database error", async () => {
      prismaMock.rental.findUnique.mockRejectedValue(new Error("DB error"));

      const res = await request(app).get("/api/rentals/rental-1");

      expect(res.status).toBe(500);
      expect(res.body.error).toBe("Internal server error");
    });
  });

  describe("PUT /api/rentals/:id/status", () => {
    it("updates rental status when renter", async () => {
      prismaMock.rental.findUnique.mockResolvedValue(sampleRental);
      prismaMock.rental.update.mockResolvedValue({ ...sampleRental, status: "completed" });

      const res = await request(app)
        .put("/api/rentals/rental-1/status")
        .set("x-user-id", "user-1")
        .send({ status: "completed" });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe("completed");
      expect(res.body.message).toBe("Rental status updated");
    });

    it("returns 403 for non-renter", async () => {
      prismaMock.rental.findUnique.mockResolvedValue(sampleRental);

      const res = await request(app)
        .put("/api/rentals/rental-1/status")
        .set("x-user-id", "user-999")
        .send({ status: "completed" });

      expect(res.status).toBe(403);
      expect(res.body.error).toContain("Forbidden");
    });

    it("returns 403 when no x-user-id header", async () => {
      prismaMock.rental.findUnique.mockResolvedValue(sampleRental);

      const res = await request(app)
        .put("/api/rentals/rental-1/status")
        .send({ status: "completed" });

      expect(res.status).toBe(403);
      expect(res.body.error).toContain("Forbidden");
    });

    it("returns 400 when status is missing", async () => {
      const res = await request(app)
        .put("/api/rentals/rental-1/status")
        .set("x-user-id", "user-1")
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("Missing required field");
    });

    it("returns 404 for non-existent rental", async () => {
      prismaMock.rental.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .put("/api/rentals/nonexistent/status")
        .set("x-user-id", "user-1")
        .send({ status: "completed" });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe("Rental not found");
    });

    it("returns 500 on database error", async () => {
      prismaMock.rental.findUnique.mockResolvedValue(sampleRental);
      prismaMock.rental.update.mockRejectedValue(new Error("DB error"));

      const res = await request(app)
        .put("/api/rentals/rental-1/status")
        .set("x-user-id", "user-1")
        .send({ status: "completed" });

      expect(res.status).toBe(500);
      expect(res.body.error).toBe("Internal server error");
    });
  });
});
