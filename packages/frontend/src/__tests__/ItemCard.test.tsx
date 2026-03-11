import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect } from "vitest";
import ItemCard from "../components/ItemCard";
import type { RentableItem } from "../lib/api";

function makeRentable(overrides?: Partial<RentableItem>): RentableItem {
  return {
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
      title: "Cordless Drill",
      description: "A nice drill",
      category: "Tools",
      condition: "good",
      images: ["https://example.com/drill.jpg"],
      location: null,
      createdAt: "2025-01-01",
      updatedAt: "2025-01-01",
    },
    ...overrides,
  };
}

describe("ItemCard", () => {
  it("renders title, category, and daily rate", () => {
    render(
      <MemoryRouter>
        <ItemCard rentable={makeRentable()} />
      </MemoryRouter>,
    );
    expect(screen.getByText("Cordless Drill")).toBeInTheDocument();
    expect(screen.getByText("Tools")).toBeInTheDocument();
    expect(screen.getByText("$25.00/day")).toBeInTheDocument();
  });

  it("renders image when provided", () => {
    render(
      <MemoryRouter>
        <ItemCard rentable={makeRentable()} />
      </MemoryRouter>,
    );
    const img = screen.getByAltText("Cordless Drill");
    expect(img).toHaveAttribute("src", "https://example.com/drill.jpg");
  });

  it("shows 'No image' placeholder when no images", () => {
    const rentable = makeRentable({
      item: {
        ...makeRentable().item,
        images: [],
      },
    });
    render(
      <MemoryRouter>
        <ItemCard rentable={rentable} />
      </MemoryRouter>,
    );
    expect(screen.getByText("No image")).toBeInTheDocument();
  });

  it("links to the correct item detail page", () => {
    render(
      <MemoryRouter>
        <ItemCard rentable={makeRentable()} />
      </MemoryRouter>,
    );
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/item/r1");
  });

  it("displays condition with underscores replaced by spaces", () => {
    const rentable = makeRentable({
      item: { ...makeRentable().item, condition: "like_new" },
    });
    render(
      <MemoryRouter>
        <ItemCard rentable={rentable} />
      </MemoryRouter>,
    );
    expect(screen.getByText("like new")).toBeInTheDocument();
  });
});
