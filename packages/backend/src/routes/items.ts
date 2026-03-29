import { Router } from "express";
import { z } from "zod";
import prisma from "../lib/prisma.js";

const router: Router = Router();

const createItemSchema = z.object({
  ownerId: z.string().min(1),
  title: z.string().min(1).max(200),
  category: z.string().min(1),
  description: z.string().optional(),
  condition: z.enum(["new", "like_new", "good", "fair"]).optional(),
  images: z.array(z.string()).optional(),
  location: z.any().optional(),
});

// GET /api/items — list items with optional filters
router.get("/", async (req, res) => {
  try {
    const { ownerId, limit } = req.query;
    const where: Record<string, unknown> = {};
    if (ownerId) where.ownerId = ownerId as string;

    const items = await prisma.item.findMany({
      where,
      include: { owner: true },
      orderBy: { createdAt: "desc" },
      ...(limit ? { take: Number(limit) } : {}),
    });
    res.json({ data: items, error: null, message: "Items retrieved" });
  } catch (err) {
    req.log.error({ err }, "Failed to list items");
    res.status(500).json({ data: null, error: "Internal server error", message: null });
  }
});

// GET /api/items/:id — get item by id
router.get("/:id", async (req, res) => {
  try {
    const item = await prisma.item.findUnique({
      where: { id: req.params.id },
      include: { owner: true },
    });
    if (!item) {
      return res.status(404).json({ data: null, error: "Item not found", message: null });
    }
    res.json({ data: item, error: null, message: "Item retrieved" });
  } catch (err) {
    req.log.error({ err }, "Failed to get item");
    res.status(500).json({ data: null, error: "Internal server error", message: null });
  }
});

// POST /api/items — create item
router.post("/", async (req, res) => {
  try {
    const parsed = createItemSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        data: null,
        error: parsed.error.issues.map(i => i.message).join(", "),
        message: null,
      });
    }
    const { ownerId, title, description, category, condition, images, location } = parsed.data;
    const item = await prisma.item.create({
      data: { ownerId, title, description, category, condition, images, location },
    });
    req.log.info({ itemId: item.id, itemTitle: title, category, ownerUserId: ownerId }, "Item created");
    res.status(201).json({ data: item, error: null, message: "Item created" });
  } catch (err) {
    req.log.error({ err }, "Failed to create item");
    res.status(500).json({ data: null, error: "Internal server error", message: null });
  }
});

// PUT /api/items/:id — update item (owner only)
router.put("/:id", async (req, res) => {
  try {
    const existing = await prisma.item.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ data: null, error: "Item not found", message: null });
    }
    const userId = req.headers["x-user-id"] as string;
    if (!userId || userId !== existing.ownerId) {
      return res.status(403).json({ data: null, error: "Forbidden: only the owner can edit this item", message: null });
    }
    const { title, description, category, condition, images, location } = req.body;
    const updateData: Record<string, unknown> = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (category !== undefined) updateData.category = category;
    if (condition !== undefined) updateData.condition = condition;
    if (images !== undefined) updateData.images = images;
    if (location !== undefined) updateData.location = location;
    const item = await prisma.item.update({
      where: { id: req.params.id },
      data: updateData,
    });
    req.log.info({ itemId: req.params.id, itemTitle: item.title, changes: Object.keys(updateData) }, "Item updated");
    res.json({ data: item, error: null, message: "Item updated" });
  } catch (err) {
    req.log.error({ err }, "Failed to update item");
    res.status(500).json({ data: null, error: "Internal server error", message: null });
  }
});

// DELETE /api/items/:id — delete item (owner only)
router.delete("/:id", async (req, res) => {
  try {
    const existing = await prisma.item.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ data: null, error: "Item not found", message: null });
    }
    const userId = req.headers["x-user-id"] as string;
    if (!userId || userId !== existing.ownerId) {
      return res.status(403).json({ data: null, error: "Forbidden: only the owner can delete this item", message: null });
    }
    // Check for active/pending rentals and cart items before deleting
    const rentable = await prisma.rentableItem.findUnique({ where: { itemId: req.params.id } });
    if (rentable) {
      const activeRentals = await prisma.rental.count({
        where: { rentableItemId: rentable.id, status: { in: ["pending", "active"] } },
      });
      if (activeRentals > 0) {
        return res.status(409).json({ data: null, error: "Cannot delete: item has active rentals", message: null });
      }
      const cartItems = await prisma.cartItem.count({ where: { rentableItemId: rentable.id } });
      if (cartItems > 0) {
        return res.status(409).json({ data: null, error: "Cannot delete: item is in users' carts", message: null });
      }
      // Safe to delete — only completed/cancelled rentals and blocked days remain
      await prisma.$transaction([
        prisma.blockedDay.deleteMany({ where: { rentableItemId: rentable.id } }),
        prisma.rental.deleteMany({ where: { rentableItemId: rentable.id } }),
        prisma.rentableItem.delete({ where: { id: rentable.id } }),
        prisma.item.delete({ where: { id: req.params.id } }),
      ]);
    } else {
      await prisma.item.delete({ where: { id: req.params.id } });
    }
    req.log.info({ itemId: req.params.id, itemTitle: existing.title, ownerUserId: existing.ownerId }, "Item deleted");
    res.json({ data: null, error: null, message: "Item deleted" });
  } catch (err) {
    req.log.error({ err }, "Failed to delete item");
    res.status(500).json({ data: null, error: "Internal server error", message: null });
  }
});

export default router;
