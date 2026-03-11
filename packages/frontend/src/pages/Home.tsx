import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchRentableItems, type RentableItem } from "../lib/api";
import ItemCard from "../components/ItemCard";

const CATEGORIES = ["Tools", "Electronics", "Sports", "Outdoor", "Kitchen"];

export default function Home() {
  const [featured, setFeatured] = useState<RentableItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRentableItems()
      .then((items) => setFeatured(items.slice(0, 6)))
      .catch(() => setFeatured([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      {/* Hero */}
      <section className="bg-indigo-600 text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">
            Rent Anything, From Anyone
          </h1>
          <p className="text-lg text-indigo-100 mb-8">
            A peer-to-peer marketplace for everyday items. Why buy when you can rent?
          </p>
          <Link
            to="/browse"
            className="inline-block bg-white text-indigo-600 font-semibold px-6 py-3 rounded-lg hover:bg-indigo-50 transition-colors"
          >
            Browse Items
          </Link>
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Categories</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat}
              to={`/browse?category=${cat}`}
              className="bg-white border border-gray-200 rounded-lg p-4 text-center font-medium text-gray-700 hover:border-indigo-400 hover:text-indigo-600 transition-colors"
            >
              {cat}
            </Link>
          ))}
        </div>
      </section>

      {/* Featured */}
      <section className="max-w-7xl mx-auto px-4 pb-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Featured Items</h2>
          <Link to="/browse" className="text-indigo-600 hover:underline text-sm">
            View all
          </Link>
        </div>
        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : featured.length === 0 ? (
          <p className="text-gray-500">No items available yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featured.map((r) => (
              <ItemCard key={r.id} rentable={r} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
