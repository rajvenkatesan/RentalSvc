import { Router } from "express";
import prisma from "../lib/prisma.js";

const router: Router = Router();

const rentalInclude = {
  rentableItem: {
    include: {
      item: true,
    },
  },
};

// GET /api/rentals?userId=X — list all rentals for a user
router.get("/", async (req, res) => {
  try {
    const userId = req.query.userId as string;
    if (!userId) {
      return res.status(400).json({
        data: null,
        error: "Missing required query parameter: userId",
        message: null,
      });
    }

    const rentals = await prisma.rental.findMany({
      where: { renterId: userId },
      include: rentalInclude,
      orderBy: { startDate: "desc" },
    });

    res.json({ data: rentals, error: null, message: "Rentals retrieved" });
  } catch (err) {
    res.status(500).json({ data: null, error: "Internal server error", message: null });
  }
});

// GET /api/rentals/:id — get single rental with full item details
router.get("/:id", async (req, res) => {
  try {
    const rental = await prisma.rental.findUnique({
      where: { id: req.params.id },
      include: rentalInclude,
    });

    if (!rental) {
      return res.status(404).json({ data: null, error: "Rental not found", message: null });
    }

    res.json({ data: rental, error: null, message: "Rental retrieved" });
  } catch (err) {
    res.status(500).json({ data: null, error: "Internal server error", message: null });
  }
});

// PUT /api/rentals/:id/status — update rental status (renter only)
router.put("/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({
        data: null,
        error: "Missing required field: status",
        message: null,
      });
    }

    const rental = await prisma.rental.findUnique({
      where: { id: req.params.id },
    });

    if (!rental) {
      return res.status(404).json({ data: null, error: "Rental not found", message: null });
    }

    const userId = req.headers["x-user-id"] as string;
    if (!userId || userId !== rental.renterId) {
      return res.status(403).json({
        data: null,
        error: "Forbidden: only the renter can update this rental",
        message: null,
      });
    }

    const updated = await prisma.rental.update({
      where: { id: req.params.id },
      data: { status },
      include: rentalInclude,
    });

    res.json({ data: updated, error: null, message: "Rental status updated" });
  } catch (err) {
    res.status(500).json({ data: null, error: "Internal server error", message: null });
  }
});

export default router;
