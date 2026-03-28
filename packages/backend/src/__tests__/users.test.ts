import { describe, it, expect, beforeEach } from "vitest";
import { prismaMock } from "./helpers/prismaMock.js";
import request from "supertest";
import app from "../app.js";

describe("Users API", () => {
  beforeEach(() => {
    Object.values(prismaMock).forEach((model) => {
      if (typeof model === "function") { (model as ReturnType<typeof import("vitest").vi.fn>).mockReset(); return; }
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
      expect(res.body.error).toBeTruthy();
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

  describe("GET /api/users/by-username/:username", () => {
    it("returns user by username", async () => {
      const userWithItems = { ...sampleUser, items: [] };
      prismaMock.user.findUnique.mockResolvedValue(userWithItems);

      const res = await request(app).get("/api/users/by-username/alice");

      expect(res.status).toBe(200);
      expect(res.body.data.username).toBe("alice");
    });

    it("returns 404 for unknown username", async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      const res = await request(app).get("/api/users/by-username/unknown");

      expect(res.status).toBe(404);
      expect(res.body.error).toBe("User not found");
    });
  });

  describe("PUT /api/users/:id", () => {
    it("updates user fields", async () => {
      const updatedUser = { ...sampleUser, displayName: "Alice W" };
      prismaMock.user.findUnique.mockResolvedValue(sampleUser);
      prismaMock.user.update.mockResolvedValue(updatedUser);

      const res = await request(app)
        .put("/api/users/user-1")
        .send({ displayName: "Alice W" });

      expect(res.status).toBe(200);
      expect(res.body.data.displayName).toBe("Alice W");
      expect(res.body.message).toBe("User updated");
    });

    it("returns 404 for missing user", async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .put("/api/users/nonexistent")
        .send({ displayName: "Bob" });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe("User not found");
    });

    it("returns 409 if new username is taken", async () => {
      const otherUser = { ...sampleUser, id: "user-2", username: "bob" };
      prismaMock.user.findUnique
        .mockResolvedValueOnce(sampleUser) // existing user lookup
        .mockResolvedValueOnce(otherUser); // username uniqueness check

      const res = await request(app)
        .put("/api/users/user-1")
        .send({ username: "bob" });

      expect(res.status).toBe(409);
      expect(res.body.error).toBe("Username already taken");
    });
  });

  describe("DELETE /api/users/:id", () => {
    it("deletes user successfully", async () => {
      prismaMock.user.findUnique.mockResolvedValue(sampleUser);
      prismaMock.user.delete.mockResolvedValue(sampleUser);

      const res = await request(app).delete("/api/users/user-1");

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("User deleted");
    });

    it("returns 404 for missing user", async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      const res = await request(app).delete("/api/users/nonexistent");

      expect(res.status).toBe(404);
      expect(res.body.error).toBe("User not found");
    });
  });
});
