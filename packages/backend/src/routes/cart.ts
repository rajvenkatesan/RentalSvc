import { Router } from "express";
import { z } from "zod";
import prisma from "../lib/prisma.js";

const router: Router = Router();

function fmtDate(d: Date): string {
  return `${d.getUTCMonth() + 1}/${d.getUTCDate()}/${d.getUTCFullYear()}`;
}

const cartItemInclude = {
  items: {
    include: {
      rentableItem: {
        include: { item: true },
      },
    },
  },
};

async function getOrCreateCart(userId: string, include?: object) {
  let cart = await prisma.cart.findFirst({ where: { userId }, include });
  if (!cart) {
    cart = await prisma.cart.create({ data: { userId }, include });
  }
  return cart;
}

const addToCartSchema = z.object({
  rentableItemId: z.string().min(1),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
});

// GET /api/cart/:userId — get cart for user
router.get("/:userId", async (req, res) => {
  try {
    const cart = await getOrCreateCart(req.params.userId, cartItemInclude);
    res.json({ data: cart, error: null, message: "Cart retrieved" });
  } catch (err) {
    req.log.error({ err }, "Failed to get cart");
    res.status(500).json({ data: null, error: "Internal server error", message: null });
  }
});

// POST /api/cart/:userId/items — add item to cart
router.post("/:userId/items", async (req, res) => {
  try {
    const parsed = addToCartSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        data: null,
        error: parsed.error.issues.map(i => i.message).join(", "),
        message: null,
      });
    }

    const { rentableItemId, startDate, endDate } = parsed.data;

    // Find or create cart for user
    const cart = await getOrCreateCart(req.params.userId);

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
    const overlappingRentals = await prisma.rental.findMany({
      where: {
        rentableItemId,
        status: { in: ["pending", "active"] },
        startDate: { lt: end },
        endDate: { gt: start },
      },
    });
    if (overlappingRentals.length > 0) {
      const ranges = overlappingRentals.map((r) => `${fmtDate(r.startDate)} to ${fmtDate(r.endDate)}`).join(", ");
      return res.status(409).json({ data: null, error: `This item is already rented from ${ranges}`, message: null });
    }

    // Check for overlapping blocked days
    const overlappingBlocked = await prisma.blockedDay.findMany({
      where: {
        rentableItemId,
        startDate: { lt: end },
        endDate: { gt: start },
      },
    });
    if (overlappingBlocked.length > 0) {
      const ranges = overlappingBlocked.map((b) => `${fmtDate(b.startDate)} to ${fmtDate(b.endDate)}`).join(", ");
      return res.status(409).json({ data: null, error: `This item is blocked from ${ranges}`, message: null });
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

    req.log.info({
      itemTitle: cartItem.rentableItem.item.title,
      rentableItemId,
      startDate,
      endDate,
      estimatedCost,
      days,
    }, "Item added to cart");
    res.status(201).json({ data: cartItem, error: null, message: "Item added to cart" });
  } catch (err) {
    req.log.error({ err }, "Failed to add item to cart");
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

    req.log.info({
      cartItemId: req.params.itemId,
      itemTitle: cartItem.rentableItem.item.title,
      oldDates: { startDate: existing.startDate, endDate: existing.endDate },
      newDates: { startDate, endDate },
      newCost: estimatedCost,
    }, "Cart item updated");
    res.json({ data: cartItem, error: null, message: "Cart item updated" });
  } catch (err) {
    req.log.error({ err }, "Failed to update cart item");
    res.status(500).json({ data: null, error: "Internal server error", message: null });
  }
});

// POST /api/cart/:userId/checkout — convert cart items to rentals
router.post("/:userId/checkout", async (req, res) => {
  try {
    const cart = await prisma.cart.findFirst({
      where: { userId: req.params.userId },
      include: {
        items: {
          include: {
            rentableItem: true,
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        data: null,
        error: "Cart is empty",
        message: null,
      });
    }

    // Collect all rentableItemIds for batch queries
    const rentableItemIds = cart.items.map((ci) => ci.rentableItemId);

    // Batch: fetch all overlapping rentals and blocked days in two queries
    const allOverlappingRentals = await prisma.rental.findMany({
      where: {
        rentableItemId: { in: rentableItemIds },
        status: { in: ["pending", "active"] },
      },
    });

    const allOverlappingBlocked = await prisma.blockedDay.findMany({
      where: {
        rentableItemId: { in: rentableItemIds },
      },
    });

    // Validate each cart item against batch results
    const validItems: typeof cart.items = [];
    const invalidItems: { cartItemId: string; reason: string }[] = [];

    for (const cartItem of cart.items) {
      // Check rentable item is available (already loaded via include)
      if (!cartItem.rentableItem || !cartItem.rentableItem.isAvailable) {
        invalidItems.push({
          cartItemId: cartItem.id,
          reason: "Item is no longer available",
        });
        continue;
      }

      // Filter overlapping rentals for this cart item
      const overlappingRentals = allOverlappingRentals.filter(
        (r) =>
          r.rentableItemId === cartItem.rentableItemId &&
          r.startDate < cartItem.endDate &&
          r.endDate > cartItem.startDate,
      );

      if (overlappingRentals.length > 0) {
        const ranges = overlappingRentals.map((r) => `${fmtDate(r.startDate)} to ${fmtDate(r.endDate)}`).join(", ");
        invalidItems.push({
          cartItemId: cartItem.id,
          reason: `Item is already rented from ${ranges}`,
        });
        continue;
      }

      // Filter overlapping blocked days for this cart item
      const overlappingBlockedDays = allOverlappingBlocked.filter(
        (b) =>
          b.rentableItemId === cartItem.rentableItemId &&
          b.startDate < cartItem.endDate &&
          b.endDate > cartItem.startDate,
      );

      if (overlappingBlockedDays.length > 0) {
        const ranges = overlappingBlockedDays.map((b) => `${fmtDate(b.startDate)} to ${fmtDate(b.endDate)}`).join(", ");
        invalidItems.push({
          cartItemId: cartItem.id,
          reason: `Item is blocked from ${ranges}`,
        });
        continue;
      }

      validItems.push(cartItem);
    }

    // Remove invalid items from cart
    for (const invalid of invalidItems) {
      await prisma.cartItem.delete({ where: { id: invalid.cartItemId } });
    }

    // If there are invalid items, return error with details
    if (invalidItems.length > 0) {
      return res.status(409).json({
        data: { invalidItems },
        error: "Some items are no longer available and have been removed from your cart",
        message: null,
      });
    }

    // All items valid — create rentals and remove cart items atomically
    const rentals = await prisma.$transaction(async (tx: typeof prisma) => {
      const createdRentals = [];
      for (const cartItem of validItems) {
        const rental = await tx.rental.create({
          data: {
            rentableItemId: cartItem.rentableItemId,
            renterId: req.params.userId,
            startDate: cartItem.startDate,
            endDate: cartItem.endDate,
            totalCost: cartItem.estimatedCost,
            status: "pending",
          },
          include: {
            rentableItem: {
              include: { item: true },
            },
          },
        });
        createdRentals.push(rental);

        await tx.cartItem.delete({ where: { id: cartItem.id } });
      }
      return createdRentals;
    });

    for (const rental of rentals) {
      req.log.info({
        rentalId: rental.id,
        itemTitle: rental.rentableItem.item.title,
        startDate: rental.startDate,
        endDate: rental.endDate,
        totalCost: Number(rental.totalCost),
      }, "Rental created from checkout");
    }
    const totalCost = rentals.reduce((sum: number, r: { totalCost: unknown }) => sum + Number(r.totalCost), 0);
    req.log.info({ userId: req.params.userId, rentalCount: rentals.length, totalCost }, "Checkout completed");
    res.status(201).json({
      data: { rentals },
      error: null,
      message: "Checkout successful",
    });
  } catch (err) {
    req.log.error({ err }, "Failed to checkout");
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
    req.log.info({ cartItemId: req.params.itemId, userId: req.params.userId }, "Item removed from cart");
    res.json({ data: null, error: null, message: "Item removed from cart" });
  } catch (err) {
    req.log.error({ err }, "Failed to remove item from cart");
    res.status(500).json({ data: null, error: "Internal server error", message: null });
  }
});

export default router;
