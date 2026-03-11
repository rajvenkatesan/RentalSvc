import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  fetchItems,
  fetchRentableItems,
  HARDCODED_USER_ID,
  type Item,
  type RentableItem,
} from "../lib/api";

type Tab = "listings" | "rentals";

export default function Dashboard() {
  const [tab, setTab] = useState<Tab>("listings");
  const [myListings, setMyListings] = useState<RentableItem[]>([]);
  const [myItems, setMyItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchItems(), fetchRentableItems()])
      .then(([items, rentables]) => {
        setMyItems(items.filter((i) => i.ownerId === HARDCODED_USER_ID));
        setMyListings(
          rentables.filter((r) => r.item.ownerId === HARDCODED_USER_ID),
        );
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Dashboard</h1>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-200 mb-6">
        <button
          onClick={() => setTab("listings")}
          className={`pb-2 px-1 text-sm font-medium border-b-2 ${
            tab === "listings"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          My Listings ({myListings.length})
        </button>
        <button
          onClick={() => setTab("rentals")}
          className={`pb-2 px-1 text-sm font-medium border-b-2 ${
            tab === "rentals"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          My Items ({myItems.length})
        </button>
      </div>

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : tab === "listings" ? (
        myListings.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">You haven't listed any items yet.</p>
            <Link
              to="/list-item"
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-indigo-700"
            >
              List Your First Item
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {myListings.map((r) => (
              <Link
                key={r.id}
                to={`/item/${r.id}`}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <h3 className="font-semibold text-gray-900">{r.item.title}</h3>
                <p className="text-sm text-gray-500">{r.item.category}</p>
                <div className="flex justify-between mt-2">
                  <span className="text-indigo-600 font-bold">
                    ${Number(r.dailyRate).toFixed(2)}/day
                  </span>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      r.isAvailable
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {r.isAvailable ? "Available" : "Unavailable"}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )
      ) : myItems.length === 0 ? (
        <p className="text-gray-500">No items found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {myItems.map((item) => (
            <div
              key={item.id}
              className="bg-white border border-gray-200 rounded-lg p-4"
            >
              <h3 className="font-semibold text-gray-900">{item.title}</h3>
              <p className="text-sm text-gray-500">
                {item.category} &middot;{" "}
                <span className="capitalize">{item.condition.replace("_", " ")}</span>
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
