import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";
import Cart from "../pages/Cart";
import * as api from "../lib/api";

vi.mock("../lib/api", () => ({
  fetchCart: vi.fn(),
  removeFromCart: vi.fn(),
  updateCartItem: vi.fn(),
  HARDCODED_USER_ID: "00000000-0000-0000-0000-000000000001",
  getApiUserId: vi.fn().mockReturnValue("u1"),
  setApiUserId: vi.fn(),
}));

let mockCurrentUser: { id: string; username: string; displayName: string } | null = null;

vi.mock("../context/UserContext", () => ({
  useUser: () => ({
    currentUser: mockCurrentUser,
    setCurrentUser: vi.fn(),
    clearCurrentUser: vi.fn(),
  }),
  UserProvider: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock("../context/CartContext", () => ({
  useCart: () => ({ cartCount: 0, refreshCart: vi.fn() }),
}));

const mockItem: api.CartItem = {
  id: "ci1",
  cartId: "c1",
  rentableItemId: "r1",
  startDate: "2025-06-01T00:00:00Z",
  endDate: "2025-06-05T00:00:00Z",
  estimatedCost: "100.00",
  rentableItem: {
    id: "r1",
    itemId: "i1",
    dailyRate: "25.00",
    weeklyRate: null,
    securityDeposit: null,
    minRentalDays: 1,
    maxRentalDays: null,
    deliveryOptions: ["pickup"],
    shippingCost: null,
    isAvailable: true,
    createdAt: "2025-01-01",
    updatedAt: "2025-01-01",
    item: {
      id: "i1",
      ownerId: "u1",
      title: "Power Washer",
      description: null,
      category: "Tools",
      condition: "good",
      images: [],
      location: null,
      createdAt: "2025-01-01",
      updatedAt: "2025-01-01",
    },
  },
};

beforeEach(() => {
  vi.clearAllMocks();
  mockCurrentUser = { id: "u1", username: "testuser", displayName: "Test User" };
  vi.mocked(api.removeFromCart).mockResolvedValue(null);
});

describe("Cart page", () => {
  it("shows sign-in message when no user", async () => {
    mockCurrentUser = null;
    render(
      <MemoryRouter>
        <Cart />
      </MemoryRouter>,
    );
    expect(screen.getByText("Please sign in to view your cart.")).toBeInTheDocument();
  });

  it("shows empty cart message when no items", async () => {
    vi.mocked(api.fetchCart).mockResolvedValue({
      id: "c1",
      userId: "u1",
      createdAt: "",
      updatedAt: "",
      items: [],
    });
    render(
      <MemoryRouter>
        <Cart />
      </MemoryRouter>,
    );
    await waitFor(() => {
      expect(screen.getByText("Your cart is empty.")).toBeInTheDocument();
    });
  });

  it("renders cart items with title and cost", async () => {
    vi.mocked(api.fetchCart).mockResolvedValue({
      id: "c1",
      userId: "u1",
      createdAt: "",
      updatedAt: "",
      items: [mockItem],
    });
    render(
      <MemoryRouter>
        <Cart />
      </MemoryRouter>,
    );
    await waitFor(() => {
      expect(screen.getByText("Power Washer")).toBeInTheDocument();
    });
    // $100.00 appears both as item cost and total
    const costElements = screen.getAllByText("$100.00");
    expect(costElements.length).toBeGreaterThanOrEqual(1);
  });

  it("calls removeFromCart when Remove is clicked", async () => {
    vi.mocked(api.fetchCart)
      .mockResolvedValueOnce({
        id: "c1",
        userId: "u1",
        createdAt: "",
        updatedAt: "",
        items: [mockItem],
      })
      .mockResolvedValueOnce({
        id: "c1",
        userId: "u1",
        createdAt: "",
        updatedAt: "",
        items: [],
      });

    render(
      <MemoryRouter>
        <Cart />
      </MemoryRouter>,
    );
    await waitFor(() => {
      expect(screen.getByText("Power Washer")).toBeInTheDocument();
    });
    await userEvent.click(screen.getByText("Remove"));
    expect(api.removeFromCart).toHaveBeenCalledWith("ci1");
  });
});
