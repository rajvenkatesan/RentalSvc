import express from "express";
import cors from "cors";
import itemsRouter from "./routes/items.js";
import rentableItemsRouter from "./routes/rentableItems.js";
import cartRouter from "./routes/cart.js";
import usersRouter from "./routes/users.js";

import type { Express } from "express";

const app: Express = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/items", itemsRouter);
app.use("/api/rentable-items", rentableItemsRouter);
app.use("/api/cart", cartRouter);
app.use("/api/users", usersRouter);

export default app;
