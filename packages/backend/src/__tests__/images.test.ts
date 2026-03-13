import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Mock multer to avoid actual file system writes during tests
vi.mock("multer", () => {
  const multerMock = () => ({
    single: () => (req: any, _res: any, next: any) => {
      if (req.headers["x-mock-no-file"]) {
        // Simulate no file uploaded
        next();
      } else {
        req.file = {
          filename: "test-image.png",
          originalname: "photo.png",
          mimetype: "image/png",
          size: 1024,
        };
        next();
      }
    },
  });
  multerMock.diskStorage = vi.fn();
  return { default: multerMock };
});

// Import app after mocking
const { default: app } = await import("../app.js");

describe("Images API", () => {
  describe("POST /api/images", () => {
    it("returns uploaded image URL", async () => {
      const res = await request(app)
        .post("/api/images")
        .attach("file", Buffer.from("fake image data"), "photo.png");

      expect(res.status).toBe(201);
      expect(res.body.data.url).toBe("/uploads/test-image.png");
      expect(res.body.message).toBe("Image uploaded");
    });

    it("returns 400 when no file is provided", async () => {
      const res = await request(app)
        .post("/api/images")
        .set("x-mock-no-file", "true")
        .send();

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("No file uploaded");
    });
  });
});
