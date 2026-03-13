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

const mockFetchUsers = vi.fn();
const mockSetApiUserId = vi.fn();

vi.mock("../lib/api", () => ({
  fetchUsers: (...args: unknown[]) => mockFetchUsers(...args),
  setApiUserId: (...args: unknown[]) => mockSetApiUserId(...args),
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
  it("renders users fetched from API", async () => {
    mockFetchUsers.mockResolvedValue([
      { id: "u1", username: "alice", displayName: "Alice" },
      { id: "u2", username: "bob", displayName: "Bob" },
    ]);
    renderWithProviders(<UserSelector />);
    await waitFor(() => {
      expect(screen.getByText("Alice")).toBeInTheDocument();
      expect(screen.getByText("Bob")).toBeInTheDocument();
    });
  });

  it("shows 'Register New User' option", async () => {
    mockFetchUsers.mockResolvedValue([]);
    renderWithProviders(<UserSelector />);
    await waitFor(() => {
      expect(screen.getByText("+ Register New User")).toBeInTheDocument();
    });
  });

  it("navigates to /register when 'Register New User' is selected", async () => {
    mockFetchUsers.mockResolvedValue([
      { id: "u1", username: "alice", displayName: "Alice" },
    ]);
    renderWithProviders(<UserSelector />);
    await waitFor(() => expect(screen.getByText("Alice")).toBeInTheDocument());

    const select = screen.getByRole("combobox");
    await userEvent.selectOptions(select, "__register__");
    expect(mockNavigate).toHaveBeenCalledWith("/register");
  });
});
