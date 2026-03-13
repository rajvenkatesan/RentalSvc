import { Router } from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadsDir = path.resolve(__dirname, "../../uploads");

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

const upload = multer({ storage });

const router: Router = Router();

// POST /api/images — upload an image
router.post("/", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ data: null, error: "No file uploaded", message: null });
  }
  const url = `/uploads/${req.file.filename}`;
  res.status(201).json({ data: { url }, error: null, message: "Image uploaded" });
});

export default router;
