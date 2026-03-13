import { Router } from "express";
import { randomUUID } from "crypto";
import prisma from "../lib/prisma.js";

const router: Router = Router();

// POST /api/users — register a new user
router.post("/", async (req, res) => {
  try {
    const { username, displayName } = req.body;

    if (!username || typeof username !== "string" || !username.trim()) {
      return res.status(400).json({ data: null, error: "Missing required field: username", message: null });
    }

    const existing = await prisma.user.findUnique({ where: { username: username.trim() } });
    if (existing) {
      return res.status(409).json({ data: null, error: "Username already taken", message: null });
    }

    const user = await prisma.user.create({
      data: {
        id: randomUUID(),
        username: username.trim(),
        displayName: displayName || username.trim(),
        email: `${username.trim()}@rentalsvc.local`,
      },
    });

    res.status(201).json({ data: user, error: null, message: "User created" });
  } catch (err) {
    res.status(500).json({ data: null, error: "Internal server error", message: null });
  }
});

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

// GET /api/users/by-username/:username — look up user by username
router.get("/by-username/:username", async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { username: req.params.username },
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

// PUT /api/users/:id — update user fields
router.put("/:id", async (req, res) => {
  try {
    const { username, displayName } = req.body;

    const existing = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ data: null, error: "User not found", message: null });
    }

    // Check username uniqueness if changing username
    if (username && username.trim() !== existing.username) {
      const taken = await prisma.user.findUnique({ where: { username: username.trim() } });
      if (taken) {
        return res.status(409).json({ data: null, error: "Username already taken", message: null });
      }
    }

    const updateData: Record<string, string> = {};
    if (username) updateData.username = username.trim();
    if (displayName) updateData.displayName = displayName.trim();

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: updateData,
    });

    res.json({ data: user, error: null, message: "User updated" });
  } catch (err) {
    res.status(500).json({ data: null, error: "Internal server error", message: null });
  }
});

// DELETE /api/users/:id — delete user
router.delete("/:id", async (req, res) => {
  try {
    const existing = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ data: null, error: "User not found", message: null });
    }

    await prisma.user.delete({ where: { id: req.params.id } });
    res.json({ data: null, error: null, message: "User deleted" });
  } catch (err) {
    res.status(500).json({ data: null, error: "Internal server error", message: null });
  }
});

export default router;
