import { CATEGORIES } from "../lib/constants";

interface FilterBarProps {
  category: string;
  minPrice: string;
  maxPrice: string;
  sort: string;
  onChange: (filters: {
    category: string;
    minPrice: string;
    maxPrice: string;
    sort: string;
  }) => void;
}

export default function FilterBar({
  category,
  minPrice,
  maxPrice,
  sort,
  onChange,
}: FilterBarProps) {
  return (
    <div className="flex flex-wrap gap-3 items-end">
      <div>
        <label className="block text-xs text-gray-500 mb-1">Category</label>
        <select
          value={category}
          onChange={(e) => onChange({ category: e.target.value, minPrice, maxPrice, sort })}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm bg-white"
        >
          <option value="">All</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1">Min Price</label>
        <input
          type="number"
          value={minPrice}
          onChange={(e) => onChange({ category, minPrice: e.target.value, maxPrice, sort })}
          placeholder="0"
          className="border border-gray-300 rounded-md px-3 py-2 text-sm w-24"
        />
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1">Max Price</label>
        <input
          type="number"
          value={maxPrice}
          onChange={(e) => onChange({ category, minPrice, maxPrice: e.target.value, sort })}
          placeholder="Any"
          className="border border-gray-300 rounded-md px-3 py-2 text-sm w-24"
        />
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1">Sort</label>
        <select
          value={sort}
          onChange={(e) => onChange({ category, minPrice, maxPrice, sort: e.target.value })}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm bg-white"
        >
          <option value="createdAt">Newest</option>
          <option value="price">Price</option>
        </select>
      </div>
    </div>
  );
}
