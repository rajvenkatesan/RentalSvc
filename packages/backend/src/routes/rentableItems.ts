import { Router } from "express";
import { z } from "zod";
import { Prisma } from "../generated/prisma/client.js";
import prisma from "../lib/prisma.js";

const router: Router = Router();

const createRentableItemSchema = z.object({
  itemId: z.string().min(1),
  dailyRate: z.number(),
  weeklyRate: z.number().optional(),
  securityDeposit: z.number().optional(),
  minRentalDays: z.number().int().positive().optional(),
  maxRentalDays: z.number().int().positive().optional(),
  deliveryOptions: z.array(z.string()).optional(),
  shippingCost: z.number().optional(),
  isAvailable: z.boolean().optional(),
});

// GET /api/rentable-items — list with filters and sorting
router.get("/", async (req, res) => {
  try {
    const { category, minPrice, maxPrice, isAvailable, sort } = req.query;

    const where: Prisma.RentableItemWhereInput = {};

    if (category) {
      where.item = { category: category as string };
    }
    if (minPrice) {
      where.dailyRate = { ...((where.dailyRate as object) || {}), gte: Number(minPrice) };
    }
    if (maxPrice) {
      where.dailyRate = { ...((where.dailyRate as object) || {}), lte: Number(maxPrice) };
    }
    if (isAvailable !== undefined) {
      where.isAvailable = isAvailable === "true";
    }

    let orderBy: Prisma.RentableItemOrderByWithRelationInput = { createdAt: "desc" };
    if (sort === "price") {
      orderBy = { dailyRate: "asc" };
    } else if (sort === "createdAt") {
      orderBy = { createdAt: "desc" };
    }

    const rentableItems = await prisma.rentableItem.findMany({
      where,
      orderBy,
      include: { item: { include: { owner: true } } },
    });

    res.json({ data: rentableItems, error: null, message: "Rentable items retrieved" });
  } catch (err) {
    req.log.error({ err }, "Failed to list rentable items");
    res.status(500).json({ data: null, error: "Internal server error", message: null });
  }
});

// GET /api/rentable-items/:id — get by id or itemId
router.get("/:id", async (req, res) => {
  try {
    const include = { item: { include: { owner: true } } };
    let rentableItem = await prisma.rentableItem.findUnique({
      where: { id: req.params.id },
      include,
    });
    if (!rentableItem) {
      rentableItem = await prisma.rentableItem.findUnique({
        where: { itemId: req.params.id },
        include,
      });
    }
    if (!rentableItem) {
      return res.status(404).json({ data: null, error: "Rentable item not found", message: null });
    }
    res.json({ data: rentableItem, error: null, message: "Rentable item retrieved" });
  } catch (err) {
    req.log.error({ err }, "Failed to get rentable item");
    res.status(500).json({ data: null, error: "Internal server error", message: null });
  }
});

// POST /api/rentable-items — create
router.post("/", async (req, res) => {
  try {
    const parsed = createRentableItemSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        data: null,
        error: parsed.error.issues.map(i => i.message).join(", "),
        message: null,
      });
    }
    const { itemId, dailyRate, weeklyRate, securityDeposit, minRentalDays, maxRentalDays, deliveryOptions, shippingCost, isAvailable } = parsed.data;
    const rentableItem = await prisma.rentableItem.create({
      data: {
        itemId,
        dailyRate,
        weeklyRate,
        securityDeposit,
        minRentalDays: minRentalDays ?? 1,
        maxRentalDays,
        deliveryOptions,
        shippingCost,
        isAvailable: isAvailable ?? true,
      },
    });
    req.log.info({
      rentableItemId: rentableItem.id,
      itemId,
      dailyRate,
      deposit: securityDeposit,
    }, "Rentable item created");
    res.status(201).json({ data: rentableItem, error: null, message: "Rentable item created" });
  } catch (err) {
    req.log.error({ err }, "Failed to create rentable item");
    res.status(500).json({ data: null, error: "Internal server error", message: null });
  }
});

// PUT /api/rentable-items/:id — update
router.put("/:id", async (req, res) => {
  try {
    const existing = await prisma.rentableItem.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ data: null, error: "Rentable item not found", message: null });
    }
    const { dailyRate, weeklyRate, deposit, minRentalDays, maxRentalDays, isAvailable, deliveryOption } = req.body;
    const updateData: Record<string, unknown> = {};
    if (dailyRate !== undefined) updateData.dailyRate = dailyRate;
    if (weeklyRate !== undefined) updateData.weeklyRate = weeklyRate;
    if (deposit !== undefined) updateData.securityDeposit = deposit;
    if (minRentalDays !== undefined) updateData.minRentalDays = minRentalDays;
    if (maxRentalDays !== undefined) updateData.maxRentalDays = maxRentalDays;
    if (isAvailable !== undefined) updateData.isAvailable = isAvailable;
    if (deliveryOption !== undefined) updateData.deliveryOptions = deliveryOption;
    const rentableItem = await prisma.rentableItem.update({
      where: { id: req.params.id },
      data: updateData,
    });
    res.json({ data: rentableItem, error: null, message: "Rentable item updated" });
  } catch (err) {
    req.log.error({ err }, "Failed to update rentable item");
    res.status(500).json({ data: null, error: "Internal server error", message: null });
  }
});

// DELETE /api/rentable-items/:id — delete
router.delete("/:id", async (req, res) => {
  try {
    const existing = await prisma.rentableItem.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ data: null, error: "Rentable item not found", message: null });
    }
    await prisma.rentableItem.delete({ where: { id: req.params.id } });
    res.json({ data: null, error: null, message: "Rentable item deleted" });
  } catch (err) {
    req.log.error({ err }, "Failed to delete rentable item");
    res.status(500).json({ data: null, error: "Internal server error", message: null });
  }
});

export default router;
