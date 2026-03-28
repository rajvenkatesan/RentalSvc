import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";

// Mock the storage module
const mockStorage = {
  save: vi.fn(),
  get: vi.fn(),
  delete: vi.fn(),
};

vi.mock("../lib/storage/index.js", () => ({
  getStorage: () => mockStorage,
}));

// Mock multer to use memory-style behavior (buffer on req.file)
vi.mock("multer", () => {
  const multerMock = () => ({
    single: () => (req: any, _res: any, next: any) => {
      if (req.headers["x-mock-no-file"]) {
        next();
      } else {
        req.file = {
          buffer: Buffer.from("fake image data"),
          originalname: "photo.png",
          mimetype: "image/png",
          size: 1024,
        };
        next();
      }
    },
  });
  multerMock.memoryStorage = vi.fn();
  multerMock.diskStorage = vi.fn();
  return { default: multerMock };
});

// Import app after mocking
const { default: app } = await import("../app.js");

describe("Images API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST /api/images", () => {
    it("uploads image and returns /api/images/{id} URL", async () => {
      mockStorage.save.mockResolvedValue("abc-123");

      const res = await request(app)
        .post("/api/images")
        .attach("file", Buffer.from("fake image data"), "photo.png");

      expect(res.status).toBe(201);
      expect(res.body.data.url).toBe("/api/images/abc-123");
      expect(res.body.message).toBe("Image uploaded");
      expect(mockStorage.save).toHaveBeenCalledWith(
        expect.objectContaining({
          buffer: expect.any(Buffer),
          mimetype: "image/png",
          originalname: "photo.png",
        }),
      );
    });

    it("returns 400 when no file is provided", async () => {
      const res = await request(app)
        .post("/api/images")
        .set("x-mock-no-file", "true")
        .send();

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("No file uploaded");
      expect(mockStorage.save).not.toHaveBeenCalled();
    });
  });

  describe("GET /api/images/:id", () => {
    it("serves the image with correct Content-Type", async () => {
      const imageData = Buffer.from("fake png data");
      mockStorage.get.mockResolvedValue({
        buffer: imageData,
        mimetype: "image/png",
      });

      const res = await request(app).get("/api/images/abc-123");

      expect(res.status).toBe(200);
      expect(res.headers["content-type"]).toMatch(/image\/png/);
      expect(Buffer.from(res.body).toString()).toBe("fake png data");
      expect(mockStorage.get).toHaveBeenCalledWith("abc-123");
    });

    it("returns 404 for non-existent image", async () => {
      mockStorage.get.mockResolvedValue(null);

      const res = await request(app).get("/api/images/not-found");

      expect(res.status).toBe(404);
      expect(res.body.error).toBeTruthy();
      expect(mockStorage.get).toHaveBeenCalledWith("not-found");
    });
  });

  describe("DELETE /api/images/:id", () => {
    it("removes the image", async () => {
      mockStorage.delete.mockResolvedValue(undefined);

      const res = await request(app).delete("/api/images/abc-123");

      expect(res.status).toBe(200);
      expect(mockStorage.delete).toHaveBeenCalledWith("abc-123");
    });
  });
});
