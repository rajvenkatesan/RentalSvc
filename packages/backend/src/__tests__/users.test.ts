import { describe, it, expect, beforeEach } from "vitest";
import { prismaMock } from "./helpers/prismaMock.js";
import request from "supertest";
import app from "../app.js";

describe("Users API", () => {
  beforeEach(() => {
    Object.values(prismaMock).forEach((model) => {
      Object.values(model).forEach((fn) => (fn as ReturnType<typeof import("vitest").vi.fn>).mockReset());
    });
  });

  const sampleUser = {
    id: "user-1",
    username: "alice",
    email: "alice@rentalsvc.local",
    displayName: "Alice",
    avatarUrl: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe("POST /api/users", () => {
    it("creates a user successfully", async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);
      prismaMock.user.create.mockResolvedValue(sampleUser);

      const res = await request(app)
        .post("/api/users")
        .send({ username: "alice", displayName: "Alice" });

      expect(res.status).toBe(201);
      expect(res.body.data.username).toBe("alice");
      expect(res.body.data.displayName).toBe("Alice");
      expect(res.body.message).toBe("User created");
    });

    it("defaults displayName to username", async () => {
      const userNoDisplay = { ...sampleUser, displayName: "alice" };
      prismaMock.user.findUnique.mockResolvedValue(null);
      prismaMock.user.create.mockResolvedValue(userNoDisplay);

      const res = await request(app)
        .post("/api/users")
        .send({ username: "alice" });

      expect(res.status).toBe(201);
      expect(prismaMock.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ displayName: "alice" }),
        })
      );
    });

    it("returns 409 for duplicate username", async () => {
      prismaMock.user.findUnique.mockResolvedValue(sampleUser);

      const res = await request(app)
        .post("/api/users")
        .send({ username: "alice" });

      expect(res.status).toBe(409);
      expect(res.body.error).toBe("Username already taken");
    });

    it("returns 400 for missing username", async () => {
      const res = await request(app)
        .post("/api/users")
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("Missing required field");
    });
  });

  describe("GET /api/users", () => {
    it("returns all users", async () => {
      prismaMock.user.findMany.mockResolvedValue([sampleUser]);

      const res = await request(app).get("/api/users");

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].username).toBe("alice");
    });
  });

  describe("GET /api/users/:id", () => {
    it("returns user with items", async () => {
      const userWithItems = { ...sampleUser, items: [] };
      prismaMock.user.findUnique.mockResolvedValue(userWithItems);

      const res = await request(app).get("/api/users/user-1");

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe("user-1");
    });

    it("returns 404 for missing user", async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      const res = await request(app).get("/api/users/nonexistent");

      expect(res.status).toBe(404);
      expect(res.body.error).toBe("User not found");
    });
  });
});
