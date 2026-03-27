import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { fetchCart } from "../lib/api";
import { useUser } from "./UserContext";

interface CartContextValue {
  cartCount: number;
  refreshCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const { currentUser } = useUser();
  const [cartCount, setCartCount] = useState(0);

  const refreshCart = useCallback(() => {
    if (!currentUser) {
      setCartCount(0);
      return;
    }
    fetchCart()
      .then((cart) => setCartCount(cart.items.length))
      .catch(() => setCartCount(0));
  }, [currentUser]);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  return (
    <CartContext.Provider value={{ cartCount, refreshCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
