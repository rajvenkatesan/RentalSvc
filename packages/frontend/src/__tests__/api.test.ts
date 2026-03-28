import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  fetchItems,
  fetchRentableItems,
  fetchCart,
  addToCart,
  removeFromCart,
  fetchUsers,
  registerUser,
  uploadImage,
  fetchBlockedDays,
  setApiUserId,
} from "../lib/api";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

const MOCK_REQUEST_ID = "test-request-id-0001";
vi.stubGlobal("crypto", { randomUUID: () => MOCK_REQUEST_ID });

function apiResponse<T>(data: T) {
  return {
    ok: true,
    json: () => Promise.resolve({ data, error: null, message: null }),
  };
}

function apiError(error: string) {
  return {
    ok: false,
    status: 400,
    json: () => Promise.resolve({ data: null, error, message: null }),
  };
}

const TEST_USER_ID = "test-user-001";

beforeEach(() => {
  mockFetch.mockReset();
  setApiUserId(TEST_USER_ID);
});

afterEach(() => {
  setApiUserId(null);
});

describe("API client", () => {
  it("fetchItems calls the correct URL", async () => {
    mockFetch.mockResolvedValue(apiResponse([]));
    const result = await fetchItems();
    expect(mockFetch).toHaveBeenCalledWith("/api/items", expect.objectContaining({
      headers: expect.objectContaining({
        "Content-Type": "application/json",
        "x-request-id": MOCK_REQUEST_ID,
      }),
    }));
    expect(result).toEqual([]);
  });

  it("fetchRentableItems appends query params", async () => {
    mockFetch.mockResolvedValue(apiResponse([]));
    await fetchRentableItems({ category: "Tools", minPrice: "10" });
    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain("category=Tools");
    expect(url).toContain("minPrice=10");
  });

  it("fetchCart calls correct user endpoint", async () => {
    mockFetch.mockResolvedValue(apiResponse({ id: "c1", items: [] }));
    const cart = await fetchCart();
    expect(mockFetch.mock.calls[0][0]).toBe(`/api/cart/${TEST_USER_ID}`);
    expect(cart.id).toBe("c1");
  });

  it("fetchCart returns empty cart when no user is set", async () => {
    setApiUserId(null);
    const cart = await fetchCart();
    expect(mockFetch).not.toHaveBeenCalled();
    expect(cart.items).toEqual([]);
  });

  it("addToCart sends POST with body", async () => {
    mockFetch.mockResolvedValue(apiResponse({ id: "ci1" }));
    await addToCart("r1", "2025-06-01", "2025-06-05");
    const [url, opts] = mockFetch.mock.calls[0];
    expect(url).toBe(`/api/cart/${TEST_USER_ID}/items`);
    expect(opts.method).toBe("POST");
    expect(JSON.parse(opts.body)).toEqual({
      rentableItemId: "r1",
      startDate: "2025-06-01",
      endDate: "2025-06-05",
    });
  });

  it("removeFromCart sends DELETE", async () => {
    mockFetch.mockResolvedValue(apiResponse(null));
    await removeFromCart("ci1");
    const [url, opts] = mockFetch.mock.calls[0];
    expect(url).toBe(`/api/cart/${TEST_USER_ID}/items/ci1`);
    expect(opts.method).toBe("DELETE");
  });

  it("throws on API error response", async () => {
    mockFetch.mockResolvedValue(apiError("Not found"));
    await expect(fetchItems()).rejects.toThrow(`[req-id: ${MOCK_REQUEST_ID}] Not found`);
  });

  it("fetchUsers calls the correct endpoint", async () => {
    mockFetch.mockResolvedValue(apiResponse([{ id: "u1", username: "alice" }]));
    const result = await fetchUsers();
    expect(mockFetch.mock.calls[0][0]).toBe("/api/users");
    expect(result).toEqual([{ id: "u1", username: "alice" }]);
  });

  it("registerUser sends POST with correct payload", async () => {
    mockFetch.mockResolvedValue(apiResponse({ id: "u2", username: "bob", displayName: "Bob" }));
    const result = await registerUser("bob", "Bob");
    const [url, opts] = mockFetch.mock.calls[0];
    expect(url).toBe("/api/users");
    expect(opts.method).toBe("POST");
    expect(JSON.parse(opts.body)).toEqual({ username: "bob", displayName: "Bob" });
    expect(result.username).toBe("bob");
  });

  it("uploadImage sends FormData to /api/images", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: { url: "/uploads/img.png" }, error: null, message: null }),
    });
    const file = new File(["content"], "photo.png", { type: "image/png" });
    const url = await uploadImage(file);
    const [callUrl, opts] = mockFetch.mock.calls[0];
    expect(callUrl).toBe("/api/images");
    expect(opts.method).toBe("POST");
    expect(opts.body).toBeInstanceOf(FormData);
    expect(url).toBe("/uploads/img.png");
  });

  it("fetchBlockedDays calls correct endpoint", async () => {
    mockFetch.mockResolvedValue(apiResponse([{ id: "bd1", startDate: "2025-06-01" }]));
    const result = await fetchBlockedDays("ri1");
    expect(mockFetch.mock.calls[0][0]).toBe("/api/blocked-days/ri1");
    expect(result).toEqual([{ id: "bd1", startDate: "2025-06-01" }]);
  });

  it("addToCart handles 409 gracefully without throwing", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 409,
      json: () => Promise.resolve({ data: null, error: "Date conflict", message: null }),
    });
    const result = await addToCart("r1", "2025-06-01", "2025-06-05");
    expect(result.error).toBe("Date conflict");
    expect(result.data).toBeUndefined();
  });
});
