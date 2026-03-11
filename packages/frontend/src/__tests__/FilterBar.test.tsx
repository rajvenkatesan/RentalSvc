import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import FilterBar from "../components/FilterBar";

const defaultProps = {
  category: "",
  minPrice: "",
  maxPrice: "",
  sort: "createdAt",
  onChange: vi.fn(),
};

describe("FilterBar", () => {
  it("renders all filter controls", () => {
    render(<FilterBar {...defaultProps} />);
    expect(screen.getByText("Category")).toBeInTheDocument();
    expect(screen.getByText("Min Price")).toBeInTheDocument();
    expect(screen.getByText("Max Price")).toBeInTheDocument();
    expect(screen.getByText("Sort")).toBeInTheDocument();
    expect(screen.getAllByRole("combobox")).toHaveLength(2);
    expect(screen.getAllByRole("spinbutton")).toHaveLength(2);
  });

  it("calls onChange when category is changed", async () => {
    const onChange = vi.fn();
    render(<FilterBar {...defaultProps} onChange={onChange} />);
    const selects = screen.getAllByRole("combobox");
    // First select is Category
    await userEvent.selectOptions(selects[0], "Tools");
    expect(onChange).toHaveBeenCalledWith({
      category: "Tools",
      minPrice: "",
      maxPrice: "",
      sort: "createdAt",
    });
  });

  it("calls onChange when sort is changed", async () => {
    const onChange = vi.fn();
    render(<FilterBar {...defaultProps} onChange={onChange} />);
    const selects = screen.getAllByRole("combobox");
    // Second select is Sort
    await userEvent.selectOptions(selects[1], "price");
    expect(onChange).toHaveBeenCalledWith({
      category: "",
      minPrice: "",
      maxPrice: "",
      sort: "price",
    });
  });
});
