import { describe, it, expect, beforeEach } from "vitest";
import { prismaMock } from "./helpers/prismaMock.js";
import request from "supertest";
import app from "../app.js";

describe("Blocked Days API", () => {
  beforeEach(() => {
    Object.values(prismaMock).forEach((model) => {
      Object.values(model).forEach((fn) => (fn as ReturnType<typeof import("vitest").vi.fn>).mockReset());
    });
  });

  const sampleRentableItem = {
    id: "ri-1",
    itemId: "item-1",
    item: { id: "item-1", ownerId: "user-1" },
    dailyRate: 10,
  };

  const sampleBlockedDay = {
    id: "bd-1",
    rentableItemId: "ri-1",
    startDate: new Date("2026-04-01"),
    endDate: new Date("2026-04-05"),
    reason: "Maintenance",
    rentableItem: { item: { ownerId: "user-1" } },
  };

  describe("GET /api/blocked-days/:rentableItemId", () => {
    it("returns blocked days for a rentable item", async () => {
      prismaMock.blockedDay.findMany.mockResolvedValue([sampleBlockedDay]);

      const res = await request(app).get("/api/blocked-days/ri-1");

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
    });
  });

  describe("POST /api/blocked-days/:rentableItemId", () => {
    it("creates a blocked day when owner", async () => {
      prismaMock.rentableItem.findUnique.mockResolvedValue(sampleRentableItem);
      prismaMock.blockedDay.create.mockResolvedValue(sampleBlockedDay);

      const res = await request(app)
        .post("/api/blocked-days/ri-1")
        .set("x-user-id", "user-1")
        .send({ startDate: "2026-04-01", endDate: "2026-04-05", reason: "Maintenance" });

      expect(res.status).toBe(201);
      expect(res.body.data.id).toBe("bd-1");
    });

    it("returns 403 for non-owner", async () => {
      prismaMock.rentableItem.findUnique.mockResolvedValue(sampleRentableItem);

      const res = await request(app)
        .post("/api/blocked-days/ri-1")
        .set("x-user-id", "user-999")
        .send({ startDate: "2026-04-01", endDate: "2026-04-05" });

      expect(res.status).toBe(403);
    });

    it("returns 404 for missing rentable item", async () => {
      prismaMock.rentableItem.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .post("/api/blocked-days/nonexistent")
        .set("x-user-id", "user-1")
        .send({ startDate: "2026-04-01", endDate: "2026-04-05" });

      expect(res.status).toBe(404);
    });

    it("returns 400 for missing dates", async () => {
      prismaMock.rentableItem.findUnique.mockResolvedValue(sampleRentableItem);

      const res = await request(app)
        .post("/api/blocked-days/ri-1")
        .set("x-user-id", "user-1")
        .send({});

      expect(res.status).toBe(400);
    });
  });

  describe("DELETE /api/blocked-days/:id", () => {
    it("deletes a blocked day when owner", async () => {
      prismaMock.blockedDay.findUnique.mockResolvedValue(sampleBlockedDay);
      prismaMock.blockedDay.delete.mockResolvedValue(sampleBlockedDay);

      const res = await request(app)
        .delete("/api/blocked-days/bd-1")
        .set("x-user-id", "user-1");

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Blocked day deleted");
    });

    it("returns 403 for non-owner", async () => {
      prismaMock.blockedDay.findUnique.mockResolvedValue(sampleBlockedDay);

      const res = await request(app)
        .delete("/api/blocked-days/bd-1")
        .set("x-user-id", "user-999");

      expect(res.status).toBe(403);
    });

    it("returns 404 for missing blocked day", async () => {
      prismaMock.blockedDay.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .delete("/api/blocked-days/nonexistent")
        .set("x-user-id", "user-1");

      expect(res.status).toBe(404);
    });
  });
});
