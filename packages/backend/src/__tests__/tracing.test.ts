import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";

// vi.mock factory is hoisted — cannot reference outer variables.
// Use vi.hoisted to create mocks that are available at hoist time.
const { mockInfo, mockError, mockChild } = vi.hoisted(() => {
  const mockInfo = vi.fn();
  const mockError = vi.fn();
  const mockChild: ReturnType<typeof vi.fn> = vi.fn();
  mockChild.mockReturnValue({
    info: mockInfo,
    error: mockError,
    child: mockChild,
  });
  return { mockInfo, mockError, mockChild };
});

vi.mock("../lib/logger.js", () => ({
  default: {
    info: mockInfo,
    error: mockError,
    child: mockChild,
  },
}));

import app from "../app.js";

describe("Tracing Middleware", () => {
  beforeEach(() => {
    mockInfo.mockReset();
    mockError.mockReset();
    mockChild.mockReset();
    mockChild.mockReturnValue({
      info: mockInfo,
      error: mockError,
      child: mockChild,
    });
  });

  it("generates x-request-id when not provided", async () => {
    const res = await request(app).get("/api/health");

    expect(res.status).toBe(200);
    expect(res.headers["x-request-id"]).toBeDefined();
    expect(res.headers["x-request-id"]).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
  });

  it("passes through existing x-request-id from request header", async () => {
    const customId = "my-custom-request-id";
    const res = await request(app)
      .get("/api/health")
      .set("x-request-id", customId);

    expect(res.headers["x-request-id"]).toBe(customId);
  });

  it("response includes x-request-id header", async () => {
    const res = await request(app).get("/api/health");

    expect(res.headers).toHaveProperty("x-request-id");
    expect(typeof res.headers["x-request-id"]).toBe("string");
    expect(res.headers["x-request-id"].length).toBeGreaterThan(0);
  });

  it("creates child logger with requestId and request metadata", async () => {
    const customId = "trace-123";
    await request(app).get("/api/health").set("x-request-id", customId);

    expect(mockChild).toHaveBeenCalledWith(
      expect.objectContaining({
        requestId: customId,
        method: "GET",
        url: "/api/health",
      }),
    );
  });

  it("includes userId in log context when x-user-id header present", async () => {
    await request(app)
      .get("/api/health")
      .set("x-user-id", "user-42");

    expect(mockChild).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-42",
      }),
    );
  });

  it("logs request started", async () => {
    await request(app).get("/api/health");

    expect(mockInfo).toHaveBeenCalledWith("request started");
  });

  it("logs request completed with duration and status code", async () => {
    await request(app).get("/api/health");

    expect(mockInfo).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 200,
        durationMs: expect.any(Number),
      }),
      "request completed",
    );
  });

  it("logs completion for error responses with status code", async () => {
    await request(app).get("/api/items/nonexistent-id-for-tracing");

    expect(mockInfo).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: expect.any(Number),
        durationMs: expect.any(Number),
      }),
      "request completed",
    );
  });
});
