const HARDCODED_USER_ID = "00000000-0000-0000-0000-000000000001";

export { HARDCODED_USER_ID };

let _apiUserId: string | null = null;

export function setApiUserId(id: string | null) {
  _apiUserId = id;
}

export function getApiUserId(): string {
  return _apiUserId ?? HARDCODED_USER_ID;
}

// --- Types ---

export interface User {
  id: string;
  username: string;
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

export interface BlockedDay {
  id: string;
  rentableItemId: string;
  startDate: string;
  endDate: string;
  reason: string | null;
}

interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  message: string | null;
}

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const userId = getApiUserId();
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(userId ? { "x-user-id": userId } : {}),
      ...options?.headers,
    },
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

export function updateItem(
  id: string,
  data: Partial<{
    title: string;
    description: string;
    category: string;
    condition: string;
    images: string[];
  }>,
): Promise<Item> {
  return apiFetch<Item>(`/api/items/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function deleteItem(id: string): Promise<null> {
  return apiFetch<null>(`/api/items/${id}`, {
    method: "DELETE",
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

// --- Users ---

export function fetchUsers(): Promise<User[]> {
  return apiFetch<User[]>("/api/users");
}

export function registerUser(username: string, displayName?: string): Promise<User> {
  return apiFetch<User>("/api/users", {
    method: "POST",
    body: JSON.stringify({ username, ...(displayName ? { displayName } : {}) }),
  });
}

export function fetchUserByUsername(username: string): Promise<User> {
  return apiFetch<User>(`/api/users/by-username/${encodeURIComponent(username)}`);
}

export function updateUser(
  id: string,
  data: Partial<{ username: string; displayName: string }>,
): Promise<User> {
  return apiFetch<User>(`/api/users/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function deleteUser(id: string): Promise<null> {
  return apiFetch<null>(`/api/users/${id}`, {
    method: "DELETE",
  });
}

// --- Cart ---

export function fetchCart(userId: string = HARDCODED_USER_ID): Promise<Cart> {
  return apiFetch<Cart>(`/api/cart/${userId}`);
}

export async function addToCart(
  rentableItemId: string,
  startDate: string,
  endDate: string,
  userId: string = HARDCODED_USER_ID,
): Promise<{ data?: CartItem; error?: string }> {
  const uid = getApiUserId();
  const res = await fetch(`/api/cart/${userId}/items`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(uid ? { "x-user-id": uid } : {}),
    },
    body: JSON.stringify({ rentableItemId, startDate, endDate }),
  });
  const json: ApiResponse<CartItem> = await res.json();
  if (res.status === 409) {
    return { error: json.error ?? "Date conflict" };
  }
  if (json.error || !res.ok) {
    return { error: json.error ?? `Request failed: ${res.status}` };
  }
  return { data: json.data as CartItem };
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

// --- Images ---

export async function uploadImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  const uid = getApiUserId();
  const res = await fetch("/api/images", {
    method: "POST",
    headers: uid ? { "x-user-id": uid } : {},
    body: formData,
  });
  const json: ApiResponse<{ url: string }> = await res.json();
  if (json.error || !res.ok) {
    throw new Error(json.error ?? "Upload failed");
  }
  return (json.data as { url: string }).url;
}

// --- Blocked Days ---

export function fetchBlockedDays(rentableItemId: string): Promise<BlockedDay[]> {
  return apiFetch<BlockedDay[]>(`/api/blocked-days/${rentableItemId}`);
}

export function createBlockedDay(
  rentableItemId: string,
  startDate: string,
  endDate: string,
  reason?: string,
): Promise<BlockedDay> {
  return apiFetch<BlockedDay>(`/api/blocked-days/${rentableItemId}`, {
    method: "POST",
    body: JSON.stringify({ startDate, endDate, reason }),
  });
}

export function deleteBlockedDay(id: string): Promise<null> {
  return apiFetch<null>(`/api/blocked-days/${id}`, {
    method: "DELETE",
  });
}
