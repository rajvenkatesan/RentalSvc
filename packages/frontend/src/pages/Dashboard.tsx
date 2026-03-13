import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  fetchItems,
  fetchRentableItems,
  deleteItem,
  type Item,
  type RentableItem,
} from "../lib/api";
import { useUser } from "../context/UserContext";

type Tab = "listings" | "rentals";

export default function Dashboard() {
  const navigate = useNavigate();
  const { currentUser } = useUser();
  const [tab, setTab] = useState<Tab>("listings");
  const [myListings, setMyListings] = useState<RentableItem[]>([]);
  const [myItems, setMyItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }
    Promise.all([fetchItems(), fetchRentableItems()])
      .then(([items, rentables]) => {
        setMyItems(items.filter((i) => i.ownerId === currentUser.id));
        setMyListings(
          rentables.filter((r) => r.item.ownerId === currentUser.id),
        );
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [currentUser]);

  async function handleDelete(itemId: string) {
    if (!window.confirm("Are you sure you want to delete this item?")) return;
    try {
      await deleteItem(itemId);
      setMyItems((prev) => prev.filter((i) => i.id !== itemId));
      setMyListings((prev) => prev.filter((r) => r.item.id !== itemId));
    } catch {
      // silently fail — user will see item still present
    }
  }

  if (!currentUser) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 text-center">
        <p className="text-gray-500">Please select a user to view your dashboard.</p>
      </div>
    );
  }

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
              <div
                key={r.id}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <Link to={`/item/${r.id}`}>
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
                <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => navigate(`/item/${r.id}/edit`)}
                    className="text-xs bg-gray-100 text-gray-700 px-3 py-1 rounded-md hover:bg-gray-200"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(r.item.id)}
                    className="text-xs bg-red-100 text-red-700 px-3 py-1 rounded-md hover:bg-red-200"
                  >
                    Delete
                  </button>
                </div>
              </div>
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
              <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                <button
                  onClick={() => handleDelete(item.id)}
                  className="text-xs bg-red-100 text-red-700 px-3 py-1 rounded-md hover:bg-red-200"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
