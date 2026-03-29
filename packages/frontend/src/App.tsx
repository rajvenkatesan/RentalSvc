import { BrowserRouter, Routes, Route } from "react-router-dom";
import { UserProvider } from "./context/UserContext";
import { CartProvider } from "./context/CartContext";
import ErrorBoundary from "./components/ErrorBoundary";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Browse from "./pages/Browse";
import ItemDetail from "./pages/ItemDetail";
import ListItem from "./pages/ListItem";
import Cart from "./pages/Cart";
import Dashboard from "./pages/Dashboard";
import Register from "./pages/Register";
import EditItem from "./pages/EditItem";
import Rentals from "./pages/Rentals";

function App() {
  return (
    <BrowserRouter>
      <UserProvider>
        <CartProvider>
        <ErrorBoundary>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/browse" element={<Browse />} />
            <Route path="/item/:id" element={<ItemDetail />} />
            <Route path="/item/:id/edit" element={<EditItem />} />
            <Route path="/list-item" element={<ListItem />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/rentals" element={<Rentals />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/register" element={<Register />} />
          </Routes>
        </div>
        </ErrorBoundary>
        </CartProvider>
      </UserProvider>
    </BrowserRouter>
  );
}

export default App;
