import { Router } from "express";
import prisma from "../lib/prisma.js";

const router: Router = Router();

// GET /api/blocked-days/:rentableItemId — list blocked days for a rentable item
router.get("/:rentableItemId", async (req, res) => {
  try {
    const blockedDays = await prisma.blockedDay.findMany({
      where: { rentableItemId: req.params.rentableItemId },
      orderBy: { startDate: "asc" },
    });
    res.json({ data: blockedDays, error: null, message: "Blocked days retrieved" });
  } catch (err) {
    res.status(500).json({ data: null, error: "Internal server error", message: null });
  }
});

// POST /api/blocked-days/:rentableItemId — create blocked day (owner only)
router.post("/:rentableItemId", async (req, res) => {
  try {
    const rentableItem = await prisma.rentableItem.findUnique({
      where: { id: req.params.rentableItemId },
      include: { item: true },
    });
    if (!rentableItem) {
      return res.status(404).json({ data: null, error: "Rentable item not found", message: null });
    }
    const userId = req.headers["x-user-id"] as string;
    if (!userId || userId !== rentableItem.item.ownerId) {
      return res.status(403).json({ data: null, error: "Forbidden: only the owner can manage blocked days", message: null });
    }
    const { startDate, endDate, reason } = req.body;
    if (!startDate || !endDate) {
      return res.status(400).json({ data: null, error: "Missing required fields: startDate, endDate", message: null });
    }
    const blockedDay = await prisma.blockedDay.create({
      data: {
        rentableItemId: req.params.rentableItemId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        reason,
      },
    });
    res.status(201).json({ data: blockedDay, error: null, message: "Blocked day created" });
  } catch (err) {
    res.status(500).json({ data: null, error: "Internal server error", message: null });
  }
});

// DELETE /api/blocked-days/:id — delete a blocked day (owner only)
router.delete("/:id", async (req, res) => {
  try {
    const blockedDay = await prisma.blockedDay.findUnique({
      where: { id: req.params.id },
      include: { rentableItem: { include: { item: true } } },
    });
    if (!blockedDay) {
      return res.status(404).json({ data: null, error: "Blocked day not found", message: null });
    }
    const userId = req.headers["x-user-id"] as string;
    if (!userId || userId !== blockedDay.rentableItem.item.ownerId) {
      return res.status(403).json({ data: null, error: "Forbidden: only the owner can delete blocked days", message: null });
    }
    await prisma.blockedDay.delete({ where: { id: req.params.id } });
    res.json({ data: null, error: null, message: "Blocked day deleted" });
  } catch (err) {
    res.status(500).json({ data: null, error: "Internal server error", message: null });
  }
});

export default router;
