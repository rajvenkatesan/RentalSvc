import { Router } from "express";
import multer from "multer";
import { getStorage } from "../lib/storage/index.js";

const upload = multer({ storage: multer.memoryStorage() });

const router: Router = Router();

// POST /api/images — upload an image
router.post("/", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ data: null, error: "No file uploaded", message: null });
    }

    const storage = getStorage();
    const id = await storage.save(req.file);
    const url = `/api/images/${id}`;
    req.log.info({
      imageId: id,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
    }, "Image uploaded");
    res.status(201).json({ data: { url }, error: null, message: "Image uploaded" });
  } catch (err) {
    req.log.error({ err }, "Failed to upload image");
    res.status(500).json({ data: null, error: "Internal server error", message: null });
  }
});

// GET /api/images/:id — serve an image
router.get("/:id", async (req, res) => {
  try {
    const storage = getStorage();
    const result = await storage.get(req.params.id);

    if (!result) {
      return res.status(404).json({ data: null, error: "Image not found", message: null });
    }

    res.set("Content-Type", result.mimetype);
    res.send(result.buffer);
  } catch (err) {
    req.log.error({ err }, "Failed to get image");
    res.status(500).json({ data: null, error: "Internal server error", message: null });
  }
});

// DELETE /api/images/:id — delete an image
router.delete("/:id", async (req, res) => {
  try {
    const storage = getStorage();
    await storage.delete(req.params.id);
    req.log.info({ imageId: req.params.id }, "Image deleted");
    res.json({ data: null, error: null, message: "Image deleted" });
  } catch (err) {
    req.log.error({ err }, "Failed to delete image");
    res.status(500).json({ data: null, error: "Internal server error", message: null });
  }
});

export default router;
