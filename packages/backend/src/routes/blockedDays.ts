import { Router } from "express";
import { z } from "zod";
import prisma from "../lib/prisma.js";

const router: Router = Router();

const createBlockedDaySchema = z.object({
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  reason: z.string().optional(),
});

// GET /api/blocked-days/:rentableItemId — list blocked days for a rentable item
router.get("/:rentableItemId", async (req, res) => {
  try {
    const blockedDays = await prisma.blockedDay.findMany({
      where: { rentableItemId: req.params.rentableItemId },
      orderBy: { startDate: "asc" },
    });
    res.json({ data: blockedDays, error: null, message: "Blocked days retrieved" });
  } catch (err) {
    req.log.error({ err }, "Failed to list blocked days");
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

    const parsed = createBlockedDaySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        data: null,
        error: parsed.error.issues.map(i => i.message).join(", "),
        message: null,
      });
    }

    const { startDate, endDate, reason } = parsed.data;
    const blockedDay = await prisma.blockedDay.create({
      data: {
        rentableItemId: req.params.rentableItemId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        reason,
      },
    });
    req.log.info({
      blockedDayId: blockedDay.id,
      rentableItemId: req.params.rentableItemId,
      startDate,
      endDate,
      reason,
    }, "Blocked day created");
    res.status(201).json({ data: blockedDay, error: null, message: "Blocked day created" });
  } catch (err) {
    req.log.error({ err }, "Failed to create blocked day");
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
    req.log.info({ blockedDayId: req.params.id }, "Blocked day deleted");
    res.json({ data: null, error: null, message: "Blocked day deleted" });
  } catch (err) {
    req.log.error({ err }, "Failed to delete blocked day");
    res.status(500).json({ data: null, error: "Internal server error", message: null });
  }
});

export default router;
