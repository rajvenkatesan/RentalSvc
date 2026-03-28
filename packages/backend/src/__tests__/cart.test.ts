import { describe, it, expect, beforeEach } from "vitest";
import { prismaMock } from "./helpers/prismaMock.js";
import request from "supertest";
import app from "../app.js";

describe("Cart API", () => {
  beforeEach(() => {
    Object.values(prismaMock).forEach((model) => {
      if (typeof model === "function") { (model as ReturnType<typeof import("vitest").vi.fn>).mockReset(); return; }
      Object.values(model).forEach((fn) => (fn as ReturnType<typeof import("vitest").vi.fn>).mockReset());
    });
  });

  const sampleCart = {
    id: "cart-1",
    userId: "user-1",
    createdAt: new Date(),
    updatedAt: new Date(),
    items: [],
  };

  const sampleCartItem = {
    id: "ci-1",
    cartId: "cart-1",
    rentableItemId: "ri-1",
    startDate: new Date("2025-01-01"),
    endDate: new Date("2025-01-05"),
    estimatedCost: 100,
    rentableItem: {
      id: "ri-1",
      dailyRate: 25,
      item: { id: "item-1", title: "Power Drill" },
    },
  };

  describe("GET /api/cart/:userId", () => {
    it("returns existing cart for user", async () => {
      prismaMock.cart.findFirst.mockResolvedValue(sampleCart);

      const res = await request(app).get("/api/cart/user-1");

      expect(res.status).toBe(200);
      expect(res.body.data.userId).toBe("user-1");
      expect(res.body.error).toBeNull();
    });

    it("creates a new cart if none exists", async () => {
      prismaMock.cart.findFirst.mockResolvedValue(null);
      prismaMock.cart.create.mockResolvedValue(sampleCart);

      const res = await request(app).get("/api/cart/user-1");

      expect(res.status).toBe(200);
      expect(prismaMock.cart.create).toHaveBeenCalled();
    });
  });

  describe("POST /api/cart/:userId/items", () => {
    it("adds item to cart", async () => {
      prismaMock.cart.findFirst.mockResolvedValue(sampleCart);
      prismaMock.rentableItem.findUnique.mockResolvedValue({
        id: "ri-1",
        dailyRate: 25,
        isAvailable: true,
      });
      prismaMock.rental.findMany.mockResolvedValue([]);
      prismaMock.blockedDay.findMany.mockResolvedValue([]);
      prismaMock.cartItem.create.mockResolvedValue(sampleCartItem);

      const res = await request(app)
        .post("/api/cart/user-1/items")
        .send({
          rentableItemId: "ri-1",
          startDate: "2025-01-01",
          endDate: "2025-01-05",
        });

      expect(res.status).toBe(201);
      expect(res.body.message).toBe("Item added to cart");
    });

    it("creates cart if it does not exist", async () => {
      prismaMock.cart.findFirst.mockResolvedValue(null);
      prismaMock.cart.create.mockResolvedValue(sampleCart);
      prismaMock.rentableItem.findUnique.mockResolvedValue({
        id: "ri-1",
        dailyRate: 25,
        isAvailable: true,
      });
      prismaMock.rental.findMany.mockResolvedValue([]);
      prismaMock.blockedDay.findMany.mockResolvedValue([]);
      prismaMock.cartItem.create.mockResolvedValue(sampleCartItem);

      const res = await request(app)
        .post("/api/cart/user-1/items")
        .send({
          rentableItemId: "ri-1",
          startDate: "2025-01-01",
          endDate: "2025-01-05",
        });

      expect(res.status).toBe(201);
      expect(prismaMock.cart.create).toHaveBeenCalled();
    });

    it("returns 409 when item isAvailable is false", async () => {
      prismaMock.cart.findFirst.mockResolvedValue(sampleCart);
      prismaMock.rentableItem.findUnique.mockResolvedValue({
        id: "ri-1",
        dailyRate: 25,
        isAvailable: false,
      });

      const res = await request(app)
        .post("/api/cart/user-1/items")
        .send({
          rentableItemId: "ri-1",
          startDate: "2025-01-01",
          endDate: "2025-01-05",
        });

      expect(res.status).toBe(409);
      expect(res.body.error).toBe("This item is not currently available for rent");
    });

    it("returns 409 when dates overlap with existing rental", async () => {
      prismaMock.cart.findFirst.mockResolvedValue(sampleCart);
      prismaMock.rentableItem.findUnique.mockResolvedValue({
        id: "ri-1",
        dailyRate: 25,
        isAvailable: true,
      });
      prismaMock.rental.findMany.mockResolvedValue([{
        id: "rental-1",
        rentableItemId: "ri-1",
        status: "active",
        startDate: new Date("2025-01-03"),
        endDate: new Date("2025-01-10"),
      }]);

      const res = await request(app)
        .post("/api/cart/user-1/items")
        .send({
          rentableItemId: "ri-1",
          startDate: "2025-01-01",
          endDate: "2025-01-05",
        });

      expect(res.status).toBe(409);
      expect(res.body.error).toBe("This item is already rented from 1/3/2025 to 1/10/2025");
    });

    it("returns 409 when dates overlap with blocked days", async () => {
      prismaMock.cart.findFirst.mockResolvedValue(sampleCart);
      prismaMock.rentableItem.findUnique.mockResolvedValue({
        id: "ri-1",
        dailyRate: 25,
        isAvailable: true,
      });
      prismaMock.rental.findMany.mockResolvedValue([]);
      prismaMock.blockedDay.findMany.mockResolvedValue([{
        id: "bd-1",
        rentableItemId: "ri-1",
        startDate: new Date("2025-01-02"),
        endDate: new Date("2025-01-04"),
        reason: "Maintenance",
      }]);

      const res = await request(app)
        .post("/api/cart/user-1/items")
        .send({
          rentableItemId: "ri-1",
          startDate: "2025-01-01",
          endDate: "2025-01-05",
        });

      expect(res.status).toBe(409);
      expect(res.body.error).toBe("This item is blocked from 1/2/2025 to 1/4/2025");
    });

    it("returns 400 for missing required fields", async () => {
      const res = await request(app).post("/api/cart/user-1/items").send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("Missing required fields");
    });

    it("returns 404 for nonexistent rentable item", async () => {
      prismaMock.cart.findFirst.mockResolvedValue(sampleCart);
      prismaMock.rentableItem.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .post("/api/cart/user-1/items")
        .send({
          rentableItemId: "nonexistent",
          startDate: "2025-01-01",
          endDate: "2025-01-05",
        });

      expect(res.status).toBe(404);
    });
  });

  describe("PUT /api/cart/:userId/items/:itemId", () => {
    it("updates cart item dates", async () => {
      prismaMock.cartItem.findUnique.mockResolvedValue({
        ...sampleCartItem,
        rentableItem: { dailyRate: 25 },
      });
      prismaMock.cartItem.update.mockResolvedValue({
        ...sampleCartItem,
        startDate: new Date("2025-02-01"),
        endDate: new Date("2025-02-05"),
        estimatedCost: 100,
      });

      const res = await request(app)
        .put("/api/cart/user-1/items/ci-1")
        .send({ startDate: "2025-02-01", endDate: "2025-02-05" });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Cart item updated");
    });

    it("returns 400 for missing dates", async () => {
      const res = await request(app)
        .put("/api/cart/user-1/items/ci-1")
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("Missing required fields");
    });

    it("returns 404 for missing cart item", async () => {
      prismaMock.cartItem.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .put("/api/cart/user-1/items/nonexistent")
        .send({ startDate: "2025-02-01", endDate: "2025-02-05" });

      expect(res.status).toBe(404);
    });
  });

  describe("DELETE /api/cart/:userId/items/:itemId", () => {
    it("removes item from cart", async () => {
      prismaMock.cartItem.findUnique.mockResolvedValue(sampleCartItem);
      prismaMock.cartItem.delete.mockResolvedValue(sampleCartItem);

      const res = await request(app).delete("/api/cart/user-1/items/ci-1");

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Item removed from cart");
    });

    it("returns 404 for missing cart item", async () => {
      prismaMock.cartItem.findUnique.mockResolvedValue(null);

      const res = await request(app).delete("/api/cart/user-1/items/nonexistent");

      expect(res.status).toBe(404);
    });
  });

  describe("POST /api/cart/:userId/checkout", () => {
    const cartWithItems = {
      ...sampleCart,
      items: [
        {
          id: "ci-1",
          cartId: "cart-1",
          rentableItemId: "ri-1",
          startDate: new Date("2025-01-01"),
          endDate: new Date("2025-01-05"),
          estimatedCost: 100,
          rentableItem: { id: "ri-1", dailyRate: 25, isAvailable: true },
        },
      ],
    };

    it("converts cart items to rentals on successful checkout", async () => {
      prismaMock.cart.findFirst.mockResolvedValue(cartWithItems);
      prismaMock.rentableItem.findUnique.mockResolvedValue({ id: "ri-1", dailyRate: 25, isAvailable: true });
      prismaMock.rental.findMany.mockResolvedValue([]);
      prismaMock.blockedDay.findMany.mockResolvedValue([]);
      prismaMock.rental.create.mockResolvedValue({
        id: "rental-1",
        rentableItemId: "ri-1",
        renterId: "user-1",
        startDate: new Date("2025-01-01"),
        endDate: new Date("2025-01-05"),
        totalCost: 100,
        status: "pending",
        rentableItem: { id: "ri-1", dailyRate: 25, item: { id: "item-1", title: "Power Drill" } },
      });
      prismaMock.cartItem.delete.mockResolvedValue({});

      const res = await request(app).post("/api/cart/user-1/checkout");

      expect(res.status).toBe(201);
      expect(res.body.message).toBe("Checkout successful");
      expect(res.body.data.rentals).toHaveLength(1);
      expect(res.body.data.rentals[0].status).toBe("pending");
      expect(prismaMock.rental.create).toHaveBeenCalled();
      expect(prismaMock.cartItem.delete).toHaveBeenCalledWith({ where: { id: "ci-1" } });
    });

    it("returns 400 when cart is empty", async () => {
      prismaMock.cart.findFirst.mockResolvedValue({ ...sampleCart, items: [] });

      const res = await request(app).post("/api/cart/user-1/checkout");

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Cart is empty");
    });

    it("returns 400 when cart does not exist", async () => {
      prismaMock.cart.findFirst.mockResolvedValue(null);

      const res = await request(app).post("/api/cart/user-1/checkout");

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Cart is empty");
    });

    it("returns 409 and removes unavailable items from cart", async () => {
      prismaMock.cart.findFirst.mockResolvedValue(cartWithItems);
      prismaMock.rentableItem.findUnique.mockResolvedValue(null); // item deleted
      prismaMock.cartItem.delete.mockResolvedValue({});

      const res = await request(app).post("/api/cart/user-1/checkout");

      expect(res.status).toBe(409);
      expect(res.body.error).toContain("no longer available");
      expect(res.body.data.invalidItems).toHaveLength(1);
      expect(prismaMock.cartItem.delete).toHaveBeenCalledWith({ where: { id: "ci-1" } });
    });

    it("returns 409 when item has overlapping rental", async () => {
      prismaMock.cart.findFirst.mockResolvedValue(cartWithItems);
      prismaMock.rentableItem.findUnique.mockResolvedValue({ id: "ri-1", dailyRate: 25, isAvailable: true });
      prismaMock.rental.findMany.mockResolvedValue([{
        id: "rental-existing",
        rentableItemId: "ri-1",
        status: "active",
        startDate: new Date("2025-01-03"),
        endDate: new Date("2025-01-10"),
      }]);
      prismaMock.cartItem.delete.mockResolvedValue({});

      const res = await request(app).post("/api/cart/user-1/checkout");

      expect(res.status).toBe(409);
      expect(res.body.data.invalidItems[0].reason).toBe("Item is already rented from 1/3/2025 to 1/10/2025");
    });

    it("returns 409 when item has overlapping blocked days", async () => {
      prismaMock.cart.findFirst.mockResolvedValue(cartWithItems);
      prismaMock.rentableItem.findUnique.mockResolvedValue({ id: "ri-1", dailyRate: 25, isAvailable: true });
      prismaMock.rental.findMany.mockResolvedValue([]);
      prismaMock.blockedDay.findMany.mockResolvedValue([{
        id: "bd-1",
        rentableItemId: "ri-1",
        startDate: new Date("2025-01-02"),
        endDate: new Date("2025-01-04"),
      }]);
      prismaMock.cartItem.delete.mockResolvedValue({});

      const res = await request(app).post("/api/cart/user-1/checkout");

      expect(res.status).toBe(409);
      expect(res.body.data.invalidItems[0].reason).toBe("Item is blocked from 1/2/2025 to 1/4/2025");
    });

    it("returns 500 on database error", async () => {
      prismaMock.cart.findFirst.mockRejectedValue(new Error("DB error"));

      const res = await request(app).post("/api/cart/user-1/checkout");

      expect(res.status).toBe(500);
      expect(res.body.error).toBe("Internal server error");
    });
  });
});
