import { Router } from "express";
import prisma from "../lib/prisma.js";

const router: Router = Router();

// GET /api/users — list all users
router.get("/", async (_req, res) => {
  try {
    const users = await prisma.user.findMany({
      include: { items: true },
      orderBy: { createdAt: "desc" },
    });
    res.json({ data: users, error: null, message: "Users retrieved" });
  } catch (err) {
    res.status(500).json({ data: null, error: "Internal server error", message: null });
  }
});

// GET /api/users/:id — get user by id
router.get("/:id", async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      include: { items: true },
    });
    if (!user) {
      return res.status(404).json({ data: null, error: "User not found", message: null });
    }
    res.json({ data: user, error: null, message: "User retrieved" });
  } catch (err) {
    res.status(500).json({ data: null, error: "Internal server error", message: null });
  }
});

export default router;
