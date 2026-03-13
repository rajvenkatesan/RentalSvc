import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";
import Register from "../pages/Register";
import { UserProvider } from "../context/UserContext";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

const mockRegisterUser = vi.fn();

vi.mock("../lib/api", () => ({
  registerUser: (...args: unknown[]) => mockRegisterUser(...args),
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

describe("Register page", () => {
  it("renders form with username and display name fields", () => {
    renderWithProviders(<Register />);
    expect(screen.getByRole("heading", { name: "Create Account" })).toBeInTheDocument();
    expect(screen.getByLabelText(/Username/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Display Name/)).toBeInTheDocument();
  });

  it("submit button is disabled when username is empty", () => {
    renderWithProviders(<Register />);
    expect(screen.getByRole("button", { name: "Create Account" })).toBeDisabled();
  });

  it("submitting calls registerUser and navigates to / on success", async () => {
    mockRegisterUser.mockResolvedValue({
      id: "u1",
      username: "alice",
      displayName: "Alice",
    });
    renderWithProviders(<Register />);

    await userEvent.type(screen.getByPlaceholderText("Enter a username"), "alice");
    await userEvent.type(screen.getByPlaceholderText("Optional display name"), "Alice");
    await userEvent.click(screen.getByRole("button", { name: "Create Account" }));

    await waitFor(() => {
      expect(mockRegisterUser).toHaveBeenCalledWith("alice", "Alice");
      expect(mockNavigate).toHaveBeenCalledWith("/");
    });
  });

  it("shows 'Username already taken' error on 409", async () => {
    mockRegisterUser.mockRejectedValue(new Error("Username already taken"));
    renderWithProviders(<Register />);

    await userEvent.type(screen.getByPlaceholderText("Enter a username"), "taken");
    await userEvent.click(screen.getByRole("button", { name: "Create Account" }));

    await waitFor(() => {
      expect(screen.getByText("Username already taken")).toBeInTheDocument();
    });
  });
});
