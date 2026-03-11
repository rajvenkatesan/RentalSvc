const HARDCODED_USER_ID = "00000000-0000-0000-0000-000000000001";

export { HARDCODED_USER_ID };

// --- Types ---

export interface User {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Item {
  id: string;
  ownerId: string;
  title: string;
  description: string | null;
  category: string;
  condition: "new" | "like_new" | "good" | "fair";
  images: string[];
  location: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  owner?: User;
}

export interface RentableItem {
  id: string;
  itemId: string;
  dailyRate: string;
  weeklyRate: string | null;
  securityDeposit: string | null;
  minRentalDays: number;
  maxRentalDays: number | null;
  deliveryOptions: string[];
  shippingCost: string | null;
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
  item: Item;
}

export interface CartItem {
  id: string;
  cartId: string;
  rentableItemId: string;
  startDate: string;
  endDate: string;
  estimatedCost: string;
  rentableItem: RentableItem;
}

export interface Cart {
  id: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  items: CartItem[];
}

interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  message: string | null;
}

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const json: ApiResponse<T> = await res.json();
  if (json.error || !res.ok) {
    throw new Error(json.error ?? `Request failed: ${res.status}`);
  }
  return json.data as T;
}

// --- Items ---

export function fetchItems(): Promise<Item[]> {
  return apiFetch<Item[]>("/api/items");
}

export function fetchItem(id: string): Promise<Item> {
  return apiFetch<Item>(`/api/items/${id}`);
}

export function createItem(data: {
  ownerId: string;
  title: string;
  description?: string;
  category: string;
  condition?: string;
  images?: string[];
  location?: Record<string, unknown>;
}): Promise<Item> {
  return apiFetch<Item>("/api/items", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// --- Rentable Items ---

export function fetchRentableItems(params?: {
  category?: string;
  minPrice?: string;
  maxPrice?: string;
  sort?: string;
}): Promise<RentableItem[]> {
  const search = new URLSearchParams();
  if (params?.category) search.set("category", params.category);
  if (params?.minPrice) search.set("minPrice", params.minPrice);
  if (params?.maxPrice) search.set("maxPrice", params.maxPrice);
  if (params?.sort) search.set("sort", params.sort);
  const qs = search.toString();
  return apiFetch<RentableItem[]>(`/api/rentable-items${qs ? `?${qs}` : ""}`);
}

export function fetchRentableItem(id: string): Promise<RentableItem> {
  return apiFetch<RentableItem>(`/api/rentable-items/${id}`);
}

export function createRentableItem(data: {
  itemId: string;
  dailyRate: number;
  weeklyRate?: number;
  securityDeposit?: number;
  minRentalDays?: number;
  maxRentalDays?: number;
  deliveryOptions?: string[];
  shippingCost?: number;
}): Promise<RentableItem> {
  return apiFetch<RentableItem>("/api/rentable-items", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// --- Cart ---

export function fetchCart(userId: string = HARDCODED_USER_ID): Promise<Cart> {
  return apiFetch<Cart>(`/api/cart/${userId}`);
}

export function addToCart(
  rentableItemId: string,
  startDate: string,
  endDate: string,
  userId: string = HARDCODED_USER_ID,
): Promise<CartItem> {
  return apiFetch<CartItem>(`/api/cart/${userId}/items`, {
    method: "POST",
    body: JSON.stringify({ rentableItemId, startDate, endDate }),
  });
}

export function updateCartItem(
  itemId: string,
  startDate: string,
  endDate: string,
  userId: string = HARDCODED_USER_ID,
): Promise<CartItem> {
  return apiFetch<CartItem>(`/api/cart/${userId}/items/${itemId}`, {
    method: "PUT",
    body: JSON.stringify({ startDate, endDate }),
  });
}

export function removeFromCart(
  itemId: string,
  userId: string = HARDCODED_USER_ID,
): Promise<null> {
  return apiFetch<null>(`/api/cart/${userId}/items/${itemId}`, {
    method: "DELETE",
  });
}
