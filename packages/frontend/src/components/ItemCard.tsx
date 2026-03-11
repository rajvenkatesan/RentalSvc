import { Link } from "react-router-dom";
import type { RentableItem } from "../lib/api";

export default function ItemCard({ rentable }: { rentable: RentableItem }) {
  const { item } = rentable;
  const image = item.images?.[0];

  return (
    <Link
      to={`/item/${rentable.id}`}
      className="block bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
    >
      <div className="aspect-video bg-gray-100 flex items-center justify-center">
        {image ? (
          <img
            src={image}
            alt={item.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-gray-400 text-sm">No image</span>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 truncate">{item.title}</h3>
        <p className="text-sm text-gray-500 mt-1">{item.category}</p>
        <div className="flex justify-between items-center mt-2">
          <span className="text-indigo-600 font-bold">
            ${Number(rentable.dailyRate).toFixed(2)}/day
          </span>
          <span className="text-xs text-gray-400 capitalize">
            {item.condition.replace("_", " ")}
          </span>
        </div>
      </div>
    </Link>
  );
}
