import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";
import UserSelector from "../components/UserSelector";
import { UserProvider } from "../context/UserContext";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

const mockFetchUserByUsername = vi.fn();

vi.mock("../lib/api", () => ({
  fetchUserByUsername: (...args: unknown[]) => mockFetchUserByUsername(...args),
  setApiUserId: vi.fn(),
  getApiUserId: vi.fn().mockReturnValue("test-id"),
}));

function renderWithProviders(ui: React.ReactElement) {
  return render(
    <MemoryRouter>
      <UserProvider>{ui}</UserProvider>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  try { localStorage.removeItem("rentalsvc_current_user"); } catch {}
});

describe("UserSelector", () => {
  it("renders sign-in form with username input and Sign In button", () => {
    renderWithProviders(<UserSelector />);
    expect(screen.getByPlaceholderText("Username")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign In" })).toBeInTheDocument();
  });

  it("signing in with a valid username calls fetchUserByUsername and updates context", async () => {
    mockFetchUserByUsername.mockResolvedValue({
      id: "u1",
      username: "alice",
      displayName: "Alice",
    });
    renderWithProviders(<UserSelector />);

    const input = screen.getByPlaceholderText("Username");
    await userEvent.type(input, "alice");
    await userEvent.click(screen.getByRole("button", { name: "Sign In" }));

    await waitFor(() => {
      expect(mockFetchUserByUsername).toHaveBeenCalledWith("alice");
      expect(screen.getByText("Alice")).toBeInTheDocument();
    });
  });

  it("signing in with unknown username shows not found message with register link", async () => {
    mockFetchUserByUsername.mockRejectedValue(new Error("Not found"));
    renderWithProviders(<UserSelector />);

    const input = screen.getByPlaceholderText("Username");
    await userEvent.type(input, "unknown");
    await userEvent.click(screen.getByRole("button", { name: "Sign In" }));

    await waitFor(() => {
      expect(screen.getByText(/Username not found/)).toBeInTheDocument();
      expect(screen.getByText("Register")).toBeInTheDocument();
    });

    await userEvent.click(screen.getByText("Register"));
    expect(mockNavigate).toHaveBeenCalledWith("/register");
  });
});
