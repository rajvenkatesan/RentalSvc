import { Router } from "express";
import prisma from "../lib/prisma.js";

const router: Router = Router();

// GET /api/items — list all items
router.get("/", async (_req, res) => {
  try {
    const items = await prisma.item.findMany({
      include: { owner: true },
      orderBy: { createdAt: "desc" },
    });
    res.json({ data: items, error: null, message: "Items retrieved" });
  } catch (err) {
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
    res.status(500).json({ data: null, error: "Internal server error", message: null });
  }
});

// POST /api/items — create item
router.post("/", async (req, res) => {
  try {
    const { ownerId, title, description, category, condition, images, location } = req.body;
    if (!ownerId || !title || !category) {
      return res.status(400).json({
        data: null,
        error: "Missing required fields: ownerId, title, category",
        message: null,
      });
    }
    const item = await prisma.item.create({
      data: { ownerId, title, description, category, condition, images, location },
    });
    res.status(201).json({ data: item, error: null, message: "Item created" });
  } catch (err) {
    res.status(500).json({ data: null, error: "Internal server error", message: null });
  }
});

// PUT /api/items/:id — update item
router.put("/:id", async (req, res) => {
  try {
    const existing = await prisma.item.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ data: null, error: "Item not found", message: null });
    }
    const item = await prisma.item.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json({ data: item, error: null, message: "Item updated" });
  } catch (err) {
    res.status(500).json({ data: null, error: "Internal server error", message: null });
  }
});

// DELETE /api/items/:id — delete item
router.delete("/:id", async (req, res) => {
  try {
    const existing = await prisma.item.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ data: null, error: "Item not found", message: null });
    }
    await prisma.item.delete({ where: { id: req.params.id } });
    res.json({ data: null, error: null, message: "Item deleted" });
  } catch (err) {
    res.status(500).json({ data: null, error: "Internal server error", message: null });
  }
});

export default router;
