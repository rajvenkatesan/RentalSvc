import { useEffect, useState } from "react";
import { fetchRentals, type Rental } from "../lib/api";
import { useUser } from "../context/UserContext";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  active: "bg-green-100 text-green-800",
  completed: "bg-gray-100 text-gray-800",
  cancelled: "bg-red-100 text-red-800",
};

function isOverdue(rental: Rental): boolean {
  return rental.status === "active" && new Date(rental.endDate) < new Date();
}

export default function Rentals() {
  const { currentUser } = useUser();
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) {
      setRentals([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchRentals()
      .then(setRentals)
      .catch(() => setRentals([]))
      .finally(() => setLoading(false));
  }, [currentUser?.id]);

  if (!currentUser) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-gray-500">
        Please sign in to view your rentals.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-gray-500">
        Loading...
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Your Rentals</h1>

      {rentals.length === 0 ? (
        <p className="text-gray-500">No rentals yet.</p>
      ) : (
        <div className="space-y-4">
          {rentals.map((rental) => (
            <div
              key={rental.id}
              className={`bg-white border rounded-lg p-4 flex flex-col sm:flex-row gap-4 ${
                isOverdue(rental) ? "border-red-400 bg-red-50 overdue" : "border-gray-200"
              }`}
            >
              {/* Image */}
              <div className="w-full sm:w-24 h-24 bg-gray-100 rounded-md flex-shrink-0 flex items-center justify-center overflow-hidden">
                {rental.rentableItem.item.images?.[0] ? (
                  <img
                    src={rental.rentableItem.item.images[0]}
                    alt={rental.rentableItem.item.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-gray-400 text-xs">No image</span>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 space-y-1">
                <h3 className="font-semibold text-gray-900">
                  {rental.rentableItem.item.title}
                </h3>
                <p className="text-sm text-gray-500">
                  {new Date(rental.startDate).toLocaleDateString()} –{" "}
                  {new Date(rental.endDate).toLocaleDateString()}
                </p>
                <span
                  className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                    statusColors[rental.status] ?? "bg-gray-100 text-gray-800"
                  }`}
                >
                  {rental.status}
                </span>
              </div>

              {/* Cost */}
              <div className="flex flex-col items-end justify-center">
                <span className="text-lg font-bold text-indigo-600">
                  ${Number(rental.totalCost).toFixed(2)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
