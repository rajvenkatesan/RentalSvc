import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi } from "vitest";
import ListItem from "../pages/ListItem";

vi.mock("../lib/api", () => ({
  createItem: vi.fn(),
  createRentableItem: vi.fn(),
  HARDCODED_USER_ID: "00000000-0000-0000-0000-000000000001",
}));

describe("ListItem page", () => {
  it("renders step 1 with title and category fields", () => {
    render(
      <MemoryRouter>
        <ListItem />
      </MemoryRouter>,
    );
    expect(screen.getByText("Item Details")).toBeInTheDocument();
    expect(screen.getByText("Title *")).toBeInTheDocument();
    expect(screen.getByText("Category *")).toBeInTheDocument();
  });

  it("Next button is disabled when title is empty", () => {
    render(
      <MemoryRouter>
        <ListItem />
      </MemoryRouter>,
    );
    const nextBtn = screen.getByRole("button", { name: /Next: Rental Terms/i });
    expect(nextBtn).toBeDisabled();
  });

  it("Next button enables after entering a title", async () => {
    render(
      <MemoryRouter>
        <ListItem />
      </MemoryRouter>,
    );
    const titleInput = screen.getByPlaceholderText("e.g. DeWalt Cordless Drill");
    await userEvent.type(titleInput, "Drill");
    const nextBtn = screen.getByRole("button", { name: /Next: Rental Terms/i });
    expect(nextBtn).toBeEnabled();
  });

  it("advances to step 2 when Next is clicked", async () => {
    render(
      <MemoryRouter>
        <ListItem />
      </MemoryRouter>,
    );
    const titleInput = screen.getByPlaceholderText("e.g. DeWalt Cordless Drill");
    await userEvent.type(titleInput, "Drill");
    await userEvent.click(screen.getByRole("button", { name: /Next: Rental Terms/i }));
    expect(screen.getByText("Rental Terms")).toBeInTheDocument();
    expect(screen.getByText("Daily Rate ($) *")).toBeInTheDocument();
  });
});
