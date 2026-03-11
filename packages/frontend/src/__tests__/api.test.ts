import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  fetchItems,
  fetchRentableItems,
  fetchCart,
  addToCart,
  removeFromCart,
  HARDCODED_USER_ID,
} from "../lib/api";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

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

beforeEach(() => {
  mockFetch.mockReset();
});

describe("API client", () => {
  it("fetchItems calls the correct URL", async () => {
    mockFetch.mockResolvedValue(apiResponse([]));
    const result = await fetchItems();
    expect(mockFetch).toHaveBeenCalledWith("/api/items", expect.objectContaining({
      headers: { "Content-Type": "application/json" },
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
    expect(mockFetch.mock.calls[0][0]).toBe(`/api/cart/${HARDCODED_USER_ID}`);
    expect(cart.id).toBe("c1");
  });

  it("addToCart sends POST with body", async () => {
    mockFetch.mockResolvedValue(apiResponse({ id: "ci1" }));
    await addToCart("r1", "2025-06-01", "2025-06-05");
    const [url, opts] = mockFetch.mock.calls[0];
    expect(url).toBe(`/api/cart/${HARDCODED_USER_ID}/items`);
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
    expect(url).toBe(`/api/cart/${HARDCODED_USER_ID}/items/ci1`);
    expect(opts.method).toBe("DELETE");
  });

  it("throws on API error response", async () => {
    mockFetch.mockResolvedValue(apiError("Not found"));
    await expect(fetchItems()).rejects.toThrow("Not found");
  });
});
