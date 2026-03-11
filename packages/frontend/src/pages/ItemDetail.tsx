import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchRentableItem, addToCart, type RentableItem } from "../lib/api";
import DatePicker from "../components/DatePicker";

export default function ItemDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [rentable, setRentable] = useState<RentableItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetchRentableItem(id)
      .then(setRentable)
      .catch(() => setError("Item not found"))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleAddToCart() {
    if (!rentable || !startDate || !endDate) return;
    setAdding(true);
    try {
      await addToCart(rentable.id, startDate, endDate);
      setAdded(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add to cart");
    } finally {
      setAdding(false);
    }
  }

  if (loading) return <div className="max-w-4xl mx-auto px-4 py-8 text-gray-500">Loading...</div>;
  if (error && !rentable)
    return <div className="max-w-4xl mx-auto px-4 py-8 text-red-500">{error}</div>;
  if (!rentable) return null;

  const { item } = rentable;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <button
        onClick={() => navigate(-1)}
        className="text-sm text-indigo-600 hover:underline mb-4 inline-block"
      >
        &larr; Back
      </button>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Image */}
        <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
          {item.images?.[0] ? (
            <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover" />
          ) : (
            <span className="text-gray-400">No image</span>
          )}
        </div>

        {/* Details */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{item.title}</h1>
          <p className="text-sm text-gray-500 mb-1">
            {item.category} &middot;{" "}
            <span className="capitalize">{item.condition.replace("_", " ")}</span>
          </p>
          {item.description && (
            <p className="text-gray-700 mt-4 mb-6">{item.description}</p>
          )}

          {/* Pricing */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Daily Rate</span>
              <span className="font-bold text-indigo-600">
                ${Number(rentable.dailyRate).toFixed(2)}
              </span>
            </div>
            {rentable.weeklyRate && (
              <div className="flex justify-between">
                <span className="text-gray-600">Weekly Rate</span>
                <span className="font-semibold">
                  ${Number(rentable.weeklyRate).toFixed(2)}
                </span>
              </div>
            )}
            {rentable.securityDeposit && (
              <div className="flex justify-between">
                <span className="text-gray-600">Security Deposit</span>
                <span>${Number(rentable.securityDeposit).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-600">Min Rental</span>
              <span>{rentable.minRentalDays} day(s)</span>
            </div>
            {rentable.deliveryOptions.length > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Delivery</span>
                <span className="capitalize">{rentable.deliveryOptions.join(", ")}</span>
              </div>
            )}
          </div>

          {/* Owner */}
          {item.owner && (
            <p className="text-sm text-gray-500 mb-4">
              Listed by <span className="font-medium">{item.owner.displayName}</span>
            </p>
          )}

          {/* Add to Cart */}
          <div className="space-y-4">
            <DatePicker
              startDate={startDate}
              endDate={endDate}
              onChange={(s, e) => {
                setStartDate(s);
                setEndDate(e);
              }}
            />
            {error && <p className="text-red-500 text-sm">{error}</p>}
            {added ? (
              <div className="flex gap-3">
                <span className="text-green-600 font-medium py-2">Added to cart!</span>
                <button
                  onClick={() => navigate("/cart")}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
                >
                  View Cart
                </button>
              </div>
            ) : (
              <button
                onClick={handleAddToCart}
                disabled={!startDate || !endDate || adding}
                className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {adding ? "Adding..." : "Add to Cart"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
