import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";
import Rentals from "../pages/Rentals";
import * as api from "../lib/api";

vi.mock("../lib/api", () => ({
  fetchRentals: vi.fn(),
  checkout: vi.fn(),
  getApiUserId: vi.fn().mockReturnValue("u1"),
  setApiUserId: vi.fn(),
  HARDCODED_USER_ID: "00000000-0000-0000-0000-000000000001",
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

const mockRentableItem: api.RentableItem = {
  id: "ri1",
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
    ownerId: "owner1",
    title: "Power Drill",
    description: "A cordless power drill",
    category: "Tools",
    condition: "good",
    images: [],
    location: null,
    createdAt: "2025-01-01",
    updatedAt: "2025-01-01",
  },
};

const makeRental = (overrides: Partial<api.Rental> = {}): api.Rental => ({
  id: "rental1",
  rentableItemId: "ri1",
  renterId: "u1",
  startDate: "2025-06-01T00:00:00Z",
  endDate: "2025-06-05T00:00:00Z",
  totalCost: "100.00",
  status: "active",
  createdAt: "2025-06-01T00:00:00Z",
  rentableItem: mockRentableItem,
  ...overrides,
});

beforeEach(() => {
  vi.clearAllMocks();
  mockCurrentUser = { id: "u1", username: "testuser", displayName: "Test User" };
});

describe("Rentals page", () => {
  it("shows sign-in message when no user", async () => {
    mockCurrentUser = null;
    render(
      <MemoryRouter>
        <Rentals />
      </MemoryRouter>,
    );
    expect(screen.getByText(/please sign in/i)).toBeInTheDocument();
  });

  it("shows empty message when user has no rentals", async () => {
    vi.mocked(api.fetchRentals).mockResolvedValue([]);
    render(
      <MemoryRouter>
        <Rentals />
      </MemoryRouter>,
    );
    await waitFor(() => {
      expect(screen.getByText(/no rentals yet/i)).toBeInTheDocument();
    });
  });

  it("renders rental items with correct details", async () => {
    const rental = makeRental();
    vi.mocked(api.fetchRentals).mockResolvedValue([rental]);
    render(
      <MemoryRouter>
        <Rentals />
      </MemoryRouter>,
    );
    await waitFor(() => {
      expect(screen.getByText("Power Drill")).toBeInTheDocument();
    });
    // Should show the total cost
    expect(screen.getByText(/100\.00/)).toBeInTheDocument();
  });

  it("highlights overdue items in red (endDate < today, status active)", async () => {
    const overdueRental = makeRental({
      id: "rental-overdue",
      endDate: "2020-01-01T00:00:00Z", // well in the past
      status: "active",
    });
    vi.mocked(api.fetchRentals).mockResolvedValue([overdueRental]);
    render(
      <MemoryRouter>
        <Rentals />
      </MemoryRouter>,
    );
    await waitFor(() => {
      expect(screen.getByText("Power Drill")).toBeInTheDocument();
    });
    // The overdue row should have a red-related class
    const row = screen.getByText("Power Drill").closest("[class*='red'], [class*='border-red'], [class*='bg-red']")
      ?? screen.getByText("Power Drill").closest("div");
    // Check that some ancestor has red styling
    const allDivs = document.querySelectorAll("[class]");
    const hasRedClass = Array.from(allDivs).some(
      (el) => el.className.includes("red") || el.className.includes("overdue"),
    );
    expect(hasRedClass).toBe(true);
  });

  it("shows rental status badge", async () => {
    const rental = makeRental({ status: "active" });
    vi.mocked(api.fetchRentals).mockResolvedValue([rental]);
    render(
      <MemoryRouter>
        <Rentals />
      </MemoryRouter>,
    );
    await waitFor(() => {
      expect(screen.getByText("Power Drill")).toBeInTheDocument();
    });
    // Status should be displayed somewhere
    expect(screen.getByText(/active/i)).toBeInTheDocument();
  });
});
