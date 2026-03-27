import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import itemsRouter from "./routes/items.js";
import rentableItemsRouter from "./routes/rentableItems.js";
import cartRouter from "./routes/cart.js";
import usersRouter from "./routes/users.js";
import imagesRouter from "./routes/images.js";
import blockedDaysRouter from "./routes/blockedDays.js";
import rentalsRouter from "./routes/rentals.js";

import type { Express } from "express";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app: Express = express();

app.use(cors());
app.use(express.json());

// Serve uploaded files
app.use("/uploads", express.static(path.resolve(__dirname, "../uploads")));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/items", itemsRouter);
app.use("/api/rentable-items", rentableItemsRouter);
app.use("/api/cart", cartRouter);
app.use("/api/users", usersRouter);
app.use("/api/images", imagesRouter);
app.use("/api/blocked-days", blockedDaysRouter);
app.use("/api/rentals", rentalsRouter);

export default app;
