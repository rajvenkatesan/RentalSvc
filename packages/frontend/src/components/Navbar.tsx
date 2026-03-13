import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { fetchCart } from "../lib/api";
import UserSelector from "./UserSelector";
import { useUser } from "../context/UserContext";

export default function Navbar() {
  const [cartCount, setCartCount] = useState(0);
  const { currentUser } = useUser();

  useEffect(() => {
    fetchCart()
      .then((cart) => setCartCount(cart.items.length))
      .catch(() => setCartCount(0));
  }, [currentUser]);

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link to="/" className="text-xl font-bold text-indigo-600">
            RentalSvc
          </Link>
          <div className="hidden sm:flex items-center gap-6">
            <Link to="/browse" className="text-gray-700 hover:text-indigo-600">
              Browse
            </Link>
            <Link
              to="/list-item"
              className="text-gray-700 hover:text-indigo-600"
            >
              List an Item
            </Link>
            <Link
              to="/dashboard"
              className="text-gray-700 hover:text-indigo-600"
            >
              Dashboard
            </Link>
            <Link to="/cart" className="relative text-gray-700 hover:text-indigo-600">
              Cart
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-4 bg-indigo-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>
            <UserSelector />
          </div>
          {/* Mobile menu */}
          <div className="sm:hidden flex items-center gap-4">
            <Link to="/browse" className="text-sm text-gray-700">Browse</Link>
            <Link to="/list-item" className="text-sm text-gray-700">List</Link>
            <Link to="/dashboard" className="text-sm text-gray-700">Dash</Link>
            <Link to="/cart" className="relative text-sm text-gray-700">
              Cart
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-3 bg-indigo-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>
            <UserSelector />
          </div>
        </div>
      </div>
    </nav>
  );
}
