import { Router } from "express";
import prisma from "../lib/prisma.js";

const router: Router = Router();

// GET /api/cart/:userId — get cart for user
router.get("/:userId", async (req, res) => {
  try {
    let cart = await prisma.cart.findFirst({
      where: { userId: req.params.userId },
      include: {
        items: {
          include: {
            rentableItem: {
              include: { item: true },
            },
          },
        },
      },
    });

    if (!cart) {
      // Create an empty cart for this user
      cart = await prisma.cart.create({
        data: { userId: req.params.userId },
        include: {
          items: {
            include: {
              rentableItem: {
                include: { item: true },
              },
            },
          },
        },
      });
    }

    res.json({ data: cart, error: null, message: "Cart retrieved" });
  } catch (err) {
    res.status(500).json({ data: null, error: "Internal server error", message: null });
  }
});

// POST /api/cart/:userId/items — add item to cart
router.post("/:userId/items", async (req, res) => {
  try {
    const { rentableItemId, startDate, endDate } = req.body;
    if (!rentableItemId || !startDate || !endDate) {
      return res.status(400).json({
        data: null,
        error: "Missing required fields: rentableItemId, startDate, endDate",
        message: null,
      });
    }

    // Find or create cart for user
    let cart = await prisma.cart.findFirst({
      where: { userId: req.params.userId },
    });
    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId: req.params.userId },
      });
    }

    // Look up the rentable item to compute estimated cost
    const rentableItem = await prisma.rentableItem.findUnique({
      where: { id: rentableItemId },
    });
    if (!rentableItem) {
      return res.status(404).json({ data: null, error: "Rentable item not found", message: null });
    }

    // Check if item is available
    if (!rentableItem.isAvailable) {
      return res.status(409).json({ data: null, error: "This item is not currently available for rent", message: null });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Check for overlapping rentals (pending or active)
    const overlappingRental = await prisma.rental.findFirst({
      where: {
        rentableItemId,
        status: { in: ["pending", "active"] },
        startDate: { lt: end },
        endDate: { gt: start },
      },
    });
    if (overlappingRental) {
      return res.status(409).json({ data: null, error: "This item is already rented for the requested dates", message: null });
    }

    // Check for overlapping blocked days
    const overlappingBlocked = await prisma.blockedDay.findFirst({
      where: {
        rentableItemId,
        startDate: { lt: end },
        endDate: { gt: start },
      },
    });
    if (overlappingBlocked) {
      return res.status(409).json({ data: null, error: "This item is not available for the requested dates", message: null });
    }

    const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));

    if (days < rentableItem.minRentalDays) {
      return res.status(400).json({
        data: null,
        error: `Minimum rental duration is ${rentableItem.minRentalDays} day(s)`,
        message: null,
      });
    }

    const estimatedCost = Number(rentableItem.dailyRate) * days;

    const cartItem = await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        rentableItemId,
        startDate: start,
        endDate: end,
        estimatedCost,
      },
      include: {
        rentableItem: {
          include: { item: true },
        },
      },
    });

    res.status(201).json({ data: cartItem, error: null, message: "Item added to cart" });
  } catch (err) {
    res.status(500).json({ data: null, error: "Internal server error", message: null });
  }
});

// PUT /api/cart/:userId/items/:itemId — update cart item dates
router.put("/:userId/items/:itemId", async (req, res) => {
  try {
    const { startDate, endDate } = req.body;
    if (!startDate || !endDate) {
      return res.status(400).json({
        data: null,
        error: "Missing required fields: startDate, endDate",
        message: null,
      });
    }

    const existing = await prisma.cartItem.findUnique({
      where: { id: req.params.itemId },
      include: { rentableItem: true },
    });
    if (!existing) {
      return res.status(404).json({ data: null, error: "Cart item not found", message: null });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
    const estimatedCost = Number(existing.rentableItem.dailyRate) * days;

    const cartItem = await prisma.cartItem.update({
      where: { id: req.params.itemId },
      data: { startDate: start, endDate: end, estimatedCost },
      include: {
        rentableItem: {
          include: { item: true },
        },
      },
    });

    res.json({ data: cartItem, error: null, message: "Cart item updated" });
  } catch (err) {
    res.status(500).json({ data: null, error: "Internal server error", message: null });
  }
});

// DELETE /api/cart/:userId/items/:itemId — remove item from cart
router.delete("/:userId/items/:itemId", async (req, res) => {
  try {
    const existing = await prisma.cartItem.findUnique({
      where: { id: req.params.itemId },
    });
    if (!existing) {
      return res.status(404).json({ data: null, error: "Cart item not found", message: null });
    }

    await prisma.cartItem.delete({ where: { id: req.params.itemId } });
    res.json({ data: null, error: null, message: "Item removed from cart" });
  } catch (err) {
    res.status(500).json({ data: null, error: "Internal server error", message: null });
  }
});

export default router;
