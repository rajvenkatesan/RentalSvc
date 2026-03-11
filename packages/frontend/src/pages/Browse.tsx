import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { fetchRentableItems, type RentableItem } from "../lib/api";
import ItemCard from "../components/ItemCard";
import FilterBar from "../components/FilterBar";

export default function Browse() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [items, setItems] = useState<RentableItem[]>([]);
  const [loading, setLoading] = useState(true);

  const category = searchParams.get("category") ?? "";
  const minPrice = searchParams.get("minPrice") ?? "";
  const maxPrice = searchParams.get("maxPrice") ?? "";
  const sort = searchParams.get("sort") ?? "createdAt";

  useEffect(() => {
    setLoading(true);
    fetchRentableItems({
      category: category || undefined,
      minPrice: minPrice || undefined,
      maxPrice: maxPrice || undefined,
      sort,
    })
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [category, minPrice, maxPrice, sort]);

  function handleFilterChange(filters: {
    category: string;
    minPrice: string;
    maxPrice: string;
    sort: string;
  }) {
    const params = new URLSearchParams();
    if (filters.category) params.set("category", filters.category);
    if (filters.minPrice) params.set("minPrice", filters.minPrice);
    if (filters.maxPrice) params.set("maxPrice", filters.maxPrice);
    if (filters.sort !== "createdAt") params.set("sort", filters.sort);
    setSearchParams(params);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Browse Items</h1>
      <div className="mb-6">
        <FilterBar
          category={category}
          minPrice={minPrice}
          maxPrice={maxPrice}
          sort={sort}
          onChange={handleFilterChange}
        />
      </div>
      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : items.length === 0 ? (
        <p className="text-gray-500">No items found. Try adjusting your filters.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {items.map((r) => (
            <ItemCard key={r.id} rentable={r} />
          ))}
        </div>
      )}
    </div>
  );
}
