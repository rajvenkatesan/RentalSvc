import { useEffect, useState } from "react";
import {
  fetchCart,
  removeFromCart,
  updateCartItem,
  type Cart as CartType,
  type CartItem,
} from "../lib/api";
import { useUser } from "../context/UserContext";
import { useCart } from "../context/CartContext";
import DatePicker from "../components/DatePicker";

export default function Cart() {
  const { currentUser } = useUser();
  const { refreshCart } = useCart();
  const [cart, setCart] = useState<CartType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) {
      setCart(null);
      setLoading(false);
      return;
    }
    loadCart();
  }, [currentUser?.id]);

  function loadCart() {
    if (!currentUser) return;
    setLoading(true);
    fetchCart()
      .then(setCart)
      .catch(() => setCart(null))
      .finally(() => setLoading(false));
  }

  async function handleRemove(itemId: string) {
    if (!currentUser) return;
    await removeFromCart(itemId);
    loadCart();
    refreshCart();
  }

  async function handleDateChange(
    cartItem: CartItem,
    start: string,
    end: string,
  ) {
    if (!start || !end || !currentUser) return;
    await updateCartItem(cartItem.id, start, end);
    loadCart();
    refreshCart();
  }

  const total =
    cart?.items.reduce((sum, ci) => sum + Number(ci.estimatedCost), 0) ?? 0;

  if (!currentUser) return <div className="max-w-4xl mx-auto px-4 py-8 text-gray-500">Please sign in to view your cart.</div>;
  if (loading) return <div className="max-w-4xl mx-auto px-4 py-8 text-gray-500">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Your Cart</h1>

      {!cart || cart.items.length === 0 ? (
        <p className="text-gray-500">Your cart is empty.</p>
      ) : (
        <>
          <div className="space-y-4">
            {cart.items.map((ci) => (
              <div
                key={ci.id}
                className="bg-white border border-gray-200 rounded-lg p-4 flex flex-col sm:flex-row gap-4"
              >
                {/* Image */}
                <div className="w-full sm:w-24 h-24 bg-gray-100 rounded-md flex-shrink-0 flex items-center justify-center overflow-hidden">
                  {ci.rentableItem.item.images?.[0] ? (
                    <img
                      src={ci.rentableItem.item.images[0]}
                      alt={ci.rentableItem.item.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-gray-400 text-xs">No image</span>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 space-y-2">
                  <h3 className="font-semibold text-gray-900">
                    {ci.rentableItem.item.title}
                  </h3>
                  <p className="text-sm text-gray-500">
                    ${Number(ci.rentableItem.dailyRate).toFixed(2)}/day
                  </p>
                  <DatePicker
                    startDate={ci.startDate.split("T")[0]}
                    endDate={ci.endDate.split("T")[0]}
                    onChange={(s, e) => handleDateChange(ci, s, e)}
                  />
                </div>

                {/* Price & Remove */}
                <div className="flex flex-col items-end justify-between">
                  <span className="text-lg font-bold text-indigo-600">
                    ${Number(ci.estimatedCost).toFixed(2)}
                  </span>
                  <button
                    onClick={() => handleRemove(ci.id)}
                    className="text-red-500 text-sm hover:underline"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="mt-6 bg-gray-50 rounded-lg p-4 flex justify-between items-center">
            <span className="text-lg font-semibold text-gray-900">Total</span>
            <span className="text-2xl font-bold text-indigo-600">
              ${total.toFixed(2)}
            </span>
          </div>
        </>
      )}
    </div>
  );
}
