import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi } from "vitest";
import Navbar from "../components/Navbar";
import { UserProvider } from "../context/UserContext";

vi.mock("../lib/api", () => ({
  fetchCart: vi.fn().mockResolvedValue({ items: [] }),
  fetchUsers: vi.fn().mockResolvedValue([]),
  setApiUserId: vi.fn(),
  getApiUserId: vi.fn().mockReturnValue("test-id"),
}));

vi.mock("../context/CartContext", () => ({
  useCart: () => ({ cartCount: 0, refreshCart: vi.fn() }),
}));

describe("Navbar", () => {
  it("renders brand name and navigation links", () => {
    render(
      <MemoryRouter>
        <UserProvider>
          <Navbar />
        </UserProvider>
      </MemoryRouter>,
    );
    expect(screen.getByText("RentalSvc")).toBeInTheDocument();
    expect(screen.getAllByText("Browse").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/List/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Dash/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Cart").length).toBeGreaterThanOrEqual(1);
  });
});
