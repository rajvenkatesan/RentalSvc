import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";
import ItemDetail from "../pages/ItemDetail";

const mockFetchRentableItem = vi.fn();
const mockFetchBlockedDays = vi.fn();

vi.mock("../lib/api", () => ({
  fetchRentableItem: (...args: unknown[]) => mockFetchRentableItem(...args),
  addToCart: vi.fn().mockResolvedValue({ data: {} }),
  deleteItem: vi.fn(),
  fetchBlockedDays: (...args: unknown[]) => mockFetchBlockedDays(...args),
  createBlockedDay: vi.fn(),
  deleteBlockedDay: vi.fn(),
  setApiUserId: vi.fn(),
  getApiUserId: vi.fn().mockReturnValue("owner-1"),
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

const MOCK_RENTABLE = {
  id: "ri1",
  itemId: "i1",
  dailyRate: "25.00",
  weeklyRate: null,
  securityDeposit: null,
  minRentalDays: 1,
  maxRentalDays: null,
  deliveryOptions: [],
  shippingCost: null,
  isAvailable: true,
  createdAt: "2025-01-01",
  updatedAt: "2025-01-01",
  item: {
    id: "i1",
    ownerId: "owner-1",
    title: "Power Drill",
    description: "A nice drill",
    category: "Tools",
    condition: "good" as const,
    images: [],
    location: null,
    createdAt: "2025-01-01",
    updatedAt: "2025-01-01",
  },
};

function renderItemDetail() {
  return render(
    <MemoryRouter initialEntries={["/item/ri1"]}>
      <Routes>
        <Route path="/item/:id" element={<ItemDetail />} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockCurrentUser = null;
  mockFetchBlockedDays.mockResolvedValue([]);
});

describe("ItemDetail page", () => {
  it("shows edit and delete buttons when current user is the owner", async () => {
    mockCurrentUser = { id: "owner-1", username: "testuser", displayName: "Test User" };
    mockFetchRentableItem.mockResolvedValue(MOCK_RENTABLE);
    renderItemDetail();

    await waitFor(() => {
      expect(screen.getByText("Power Drill")).toBeInTheDocument();
    });
    expect(screen.getByText("Edit")).toBeInTheDocument();
    expect(screen.getByText("Delete")).toBeInTheDocument();
  });

  it("hides edit and delete buttons when current user is not owner", async () => {
    mockCurrentUser = { id: "other-user", username: "other", displayName: "Other" };
    mockFetchRentableItem.mockResolvedValue(MOCK_RENTABLE);
    renderItemDetail();

    await waitFor(() => {
      expect(screen.getByText("Power Drill")).toBeInTheDocument();
    });
    expect(screen.queryByText("Edit")).not.toBeInTheDocument();
    expect(screen.queryByText("Delete")).not.toBeInTheDocument();
  });

  it("renders BlockedDaysCalendar section", async () => {
    mockCurrentUser = { id: "owner-1", username: "testuser", displayName: "Test User" };
    mockFetchRentableItem.mockResolvedValue(MOCK_RENTABLE);
    renderItemDetail();

    await waitFor(() => {
      expect(screen.getByText("Blocked Dates")).toBeInTheDocument();
    });
  });
});
