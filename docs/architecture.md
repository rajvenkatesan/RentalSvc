# RentalSvc — Architecture & Tech Stack

## Overview

RentalSvc is a peer-to-peer rental marketplace built as a **TypeScript monorepo**. Users can list items for rent, browse available items, add them to a cart with date ranges, and check out to create rental transactions.

## System Architecture

> System architecture diagram:Browser → Vite Dev Server (port 5173) → React 19 SPA (React Router, Tailwind CSS 4) → /api + /uploads proxy → Express 4.21 REST API (port 3001) → Prisma 7.4 ORM → PostgreSQL 17.Express also routes uploads through Multer → /uploads (file system).The frontend package contains React and the proxy; the backend package contains Express, Multer, and Prisma.

## Tech Stack Summary

| Layer | Technology | Version |
| --- | --- | --- |
| Runtime | Node.js + TypeScript | TS 5.7 |
| Backend | Express.js | 4.21 |
| ORM | Prisma | 7.4 |
| Database | PostgreSQL | 17 |
| Frontend | React | 19.0 |
| Build | Vite | 6.0 |
| CSS | Tailwind CSS | 4.0 |
| Routing | React Router | 7.13 |
| Testing | Vitest + React Testing Library | 4.0 / 16.3 |
| Monorepo | pnpm workspaces | — |
| File Upload | Multer | 2.1 |

## Data Model

> Entity-relationship diagram:User (id, username, email, displayName, avatarUrl) owns Items (1:many).Item (id, title, category, images[], location) has a 1:1 RentableItem (dailyRate, weeklyRate, minRentalDays, isAvailable).RentableItem has many BlockedDays (startDate, endDate, reason) and many Rentals (startDate, endDate, totalCost, status).User rents Rentals (1:many).User has many Carts (userId), each Cart has many CartItems (startDate, endDate, estimatedCost).RentableItem has many CartItems.

### Enums

- **ItemCondition**: `new`, `like_new`, `good`, `fair`
- **DeliveryOption**: `pickup`, `shipping`, `both`
- **RentalStatus**: `pending`, `active`, `completed`, `cancelled`

### Cascade Delete Rules

All child relations use `onDelete: Cascade`:

- Deleting an **Item** cascades to RentableItem → CartItems, BlockedDays, Rentals
- Deleting a **Cart** cascades to its CartItems
- Business rule: DELETE is blocked (409) if item has active/pending rentals or is in any cart

## API Endpoints

| Route | Methods | Purpose |
| --- | --- | --- |
| /api/items | GET, POST | List/create items |
| /api/items/:id | GET, PUT, DELETE | Item CRUD (owner-only edit/delete) |
| /api/rentable-items | GET, POST | List/create rentable items |
| /api/rentable-items/:id | GET, PUT | Rentable item detail/update |
| /api/cart/:userId | GET | Get user's cart |
| /api/cart/:userId/items | POST | Add item to cart (with availability check) |
| /api/cart/:userId/items/:itemId | PUT, DELETE | Update/remove cart item |
| /api/cart/:userId/checkout | POST | Checkout → create rentals |
| /api/rentals | GET | List user's rentals |
| /api/rentals/:id | GET | Get rental detail |
| /api/rentals/:id/status | PUT | Update rental status |
| /api/users | GET, POST | List/create users |
| /api/users/:id | GET, PUT, DELETE | User CRUD |
| /api/images | POST | Upload image (Multer) |
| /api/blocked-days | GET, POST | List/create blocked days |
| /api/blocked-days/:id | DELETE | Remove blocked day |
| /api/health | GET | Health check |

**Auth**: `x-user-id` header for owner verification (no JWT/session auth yet)

## Frontend Architecture

### State Management

- **UserContext** — current user, persisted to `localStorage`
- **CartContext** — cart count, `refreshCart()` for live badge updates
- No external state library (Redux, Zustand) — React Context only

### Pages (9 routes)

| Route | Page | Description |
| --- | --- | --- |
| / | Home | Landing with hero, categories, featured items |
| /browse | Browse | Filterable grid of rentable items |
| /item/:id | ItemDetail | Full item view, add-to-cart with dates |
| /item/:id/edit | EditItem | Owner-only edit form |
| /list-item | ListItem | 3-step item creation wizard |
| /cart | Cart | Cart items, date editing, checkout |
| /rentals | Rentals | User's rented items, overdue highlighting |
| /dashboard | Dashboard | My Listings + My Items tabs |
| /register | Register | User registration form |

### Key Components

- `Navbar` — nav links + cart badge (via CartContext)
- `ItemCard` — reusable item display card
- `FilterBar` — search + category/condition filters
- `DatePicker` — start/end date selection
- `BlockedDaysCalendar` — owner availability management
- `ImageUpload` — drag-and-drop file upload
- `UserSelector` — text-input sign-in (demo auth)

## Project Structure

```
rentalsvc/
├── packages/
│   ├── backend/             # @rentalsvc/backend
│   │   ├── src/
│   │   │   ├── routes/      # 7 route files (Express routers)
│   │   │   ├── lib/         # prisma.ts (client singleton)
│   │   │   ├── __tests__/   # Vitest + Supertest tests
│   │   │   ├── app.ts       # Express app setup
│   │   │   └── index.ts     # Server entry (port 3001)
│   │   └── prisma/
│   │       ├── schema.prisma
│   │       ├── seed.ts
│   │       └── migrations/
│   └── frontend/            # @rentalsvc/frontend
│       └── src/
│           ├── pages/       # 9 page components
│           ├── components/  # 7 reusable components
│           ├── context/     # UserContext, CartContext
│           ├── lib/         # api.ts (API client + types)
│           ├── __tests__/   # Vitest + RTL tests
│           └── App.tsx      # Root with routes
├── package.json             # Root (pnpm scripts)
├── pnpm-workspace.yaml
└── tsconfig.base.json       # Shared TS config
```

## Testing Strategy

| Package | Framework | Tests | Approach |
| --- | --- | --- | --- |
| Backend | Vitest + Supertest | 174 | Mocked Prisma, HTTP assertions |
| Frontend | Vitest + RTL | 49 | Component rendering, user events, mocked API |
| Total |  | 223 |  |

### Backend Testing Pattern

- Prisma fully mocked via `prismaMock` helper
- Tests cover CRUD, auth (403), validation (400), conflicts (409), errors (500)
- Transaction mocking for cascade operations

### Frontend Testing Pattern

- React Testing Library for component rendering
- `vi.mock()` for API client and context providers
- Router/navigation mocking
- User interaction simulation via `@testing-library/user-event`

## Development Workflow

```bash
# Start both services
pnpm dev

# Or individually
pnpm --filter @rentalsvc/backend dev    # Express on :3001
pnpm --filter @rentalsvc/frontend dev   # Vite on :5173

# Build
pnpm build

# Test
pnpm --filter @rentalsvc/backend test
pnpm --filter @rentalsvc/frontend test

# Database
pnpm --filter @rentalsvc/backend db:migrate
pnpm --filter @rentalsvc/backend db:seed
```

## Key Architectural Decisions

1. **pnpm monorepo** — shared TypeScript config, parallel dev servers
2. **ESM throughout** — both packages use ES modules
3. **React Context over Redux** — lightweight state for user + cart
4. **Prisma ORM** — type-safe DB access with migrations and seeding
5. **REST API** — traditional endpoints, not GraphQL
6. **Vite proxy** — frontend proxies `/api` and `/uploads` to backend in dev
7. **Multer file uploads** — stored on local filesystem (`/uploads`)
8. **No auth system** — `x-user-id` header for demo/development (no JWT/sessions)
9. **Cascade deletes** — Prisma `onDelete: Cascade` with business-rule guards
10. **localStorage persistence** — user state survives browser refresh

## Project Review & Recommendations

*Reviewed March 2026 at commit *`d6bbe37`* (V3.1). All 228 tests passing (178 backend, 50 frontend).*

### Strengths

1. **Consistent API response envelope** — Every endpoint returns `{ data, error, message }`. This makes frontend error handling predictable and enables the clean `apiFetch<T>()` wrapper in `packages/frontend/src/lib/api.ts:101-116`.
2. **Strong availability validation** — The cart add-to-cart (`packages/backend/src/routes/cart.ts:86-111`) and checkout (`cart.ts:209-265`) both check overlapping rentals, blocked days, and item availability. Checkout also removes invalid items atomically, which is a good UX pattern.
3. **Well-structured Prisma schema** — The 7-model schema in `packages/backend/prisma/schema.prisma` correctly uses `@db.Uuid`, `@db.Decimal(10,2)`, proper enums, and cascade deletes. The 1:1 Item→RentableItem separation is a clean design that separates "ownership" from "rental configuration."
4. **Business rule guards on deletion** — `items.ts:87-99` checks for active rentals and cart items before allowing deletion (returning 409), preventing orphaned references.
5. **Frontend type safety** — The API client in `api.ts` defines full TypeScript interfaces for all entities and uses generics (`apiFetch<T>`) to ensure type-safe responses. No `any` types in the main codebase.
6. **Comprehensive test coverage** — Backend tests cover all CRUD operations, auth (403), validation (400), conflict detection (409), and error paths (500). Frontend tests cover all major pages and the API client. The `prismaMock` helper (`packages/backend/src/__tests__/helpers/prismaMock.ts`) is clean and reusable.
7. **Filter state in URL** — `Browse.tsx` persists filter/sort state to URL search params, making filtered views shareable and back-button friendly.
8. **Responsive layout** — Navbar has distinct desktop (`hidden sm:flex`) and mobile layouts. Grid layouts use responsive breakpoints (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`).

### Areas for Improvement

#### Backend

1. **Checkout is not atomic** — `cart.ts:281-302` creates rentals and deletes cart items in a sequential `for` loop without a transaction. If the process crashes mid-loop, some items become rentals while others remain in the cart. Should use `prisma.$transaction()`:`// cart.ts:281 — wrap in transaction await prisma.$transaction(async (tx) => { for (const cartItem of validItems) { const rental = await tx.rental.create({ ... }); rentals.push(rental); await tx.cartItem.delete({ where: { id: cartItem.id } }); } });`
2. **Race condition in availability check** — Between checking availability (`cart.ts:209-265`) and creating rentals (`cart.ts:283-298`), another request could create a conflicting rental. The check-then-act should happen inside a serializable transaction or use a database-level unique constraint.
3. `PUT /api/items/:id`** passes `req.body` directly to Prisma** — `items.ts:68-69` does `data: req.body`, allowing clients to overwrite any field including `ownerId`, `createdAt`, `id`. This is a **mass assignment vulnerability**. Should whitelist allowed fields:`const { title, description, category, condition, images, location } = req.body; const item = await prisma.item.update({ where: { id: req.params.id }, data: { title, description, category, condition, images, location }, });`
4. `PUT /api/rentable-items/:id`** also passes `req.body` directly** — `rentableItems.ts:107-108` has the same mass assignment issue. A client could set `itemId` to hijack another item's rental config.
5. **No input validation library** — All validation is manual `if (!field)` checks. Missing: type validation (is `dailyRate` a number?), string length limits, enum validation (is `condition` one of the valid values?). Consider `zod` for request body parsing.
6. **Rental status transitions are unchecked** — `rentals.ts:85-88` accepts any status string. A client could transition `completed→active` or set status to `"hacked"`. Should validate against allowed transitions (e.g., `pending→active→completed`, `pending→cancelled`).
7. **N+1 query pattern in checkout** — `cart.ts:215-263` does individual `prisma.rentableItem.findUnique()`, `prisma.rental.findMany()`, and `prisma.blockedDay.findMany()` per cart item in a loop. For a cart with 10 items, that's 30+ queries. Could batch with `findMany({ where: { id: { in: [...] } } })`.
8. **No pagination** — `GET /api/items`, `GET /api/rentable-items`, `GET /api/rentals` all return every record. With growth, this becomes a performance issue. Add `?page=1&limit=20` support.
9. **Duplicate cart creation logic** — Cart-finding-or-creating appears in both `GET /api/cart/:userId` (`cart.ts:12-40`) and `POST /api/cart/:userId/items` (`cart.ts:60-68`). Should extract to a `getOrCreateCart(userId)` helper.
10. **Silent error swallowing** — Every route's `catch(err)` discards the error with a generic 500. No logging. In production, you'd never know what went wrong. At minimum, log `err` to stderr.

#### Frontend

1. **Dashboard fetches ALL items then filters client-side** — `Dashboard.tsx:27-29` calls `fetchItems()` and `fetchRentableItems()` (all items, all users), then filters by `ownerId` in JavaScript. This should use a server-side filter: `GET /api/items?ownerId=xxx`.
2. **Home page fetches all items to show 6** — `Home.tsx:13-14` fetches every rentable item then slices to 6. Should use a `?limit=6` parameter on the backend.
3. **No error boundaries** — If any component throws during render, the entire app crashes to a white screen. A React error boundary would show a fallback UI.
4. **Errors silently swallowed in multiple places** — `Dashboard.tsx:34` catches errors with `.catch(() => {})`. User gets no feedback if the API is down. `Cart.tsx:38` similarly catches and sets cart to null with no message.
5. `CATEGORIES`** constant duplicated** — Defined identically in `Home.tsx:6`, `ListItem.tsx:9`, and `FilterBar.tsx:1`. Should be a single shared constant in `lib/constants.ts`.
6. **Stale data after mutations** — After `handleDelete` in `Dashboard.tsx:38-47`, the component optimistically removes the item from local state but doesn't refetch. If the delete fails silently (the catch is empty), the UI and server are out of sync.

### Security Recommendations

1. `x-user-id`** header is trivially spoofable** — Any client can set this header to any UUID and act as that user. This is acknowledged as a non-goal for V1, but should be the **first thing addressed** before any production use.
2. **Mass assignment in PUT endpoints** — `items.ts:68` and `rentableItems.ts:107` pass raw `req.body` to Prisma `update()`. This allows overwriting protected fields like `ownerId`, `createdAt`, `id`. **Fix immediately** — this is a data integrity bug regardless of auth status.
3. **No CORS restrictions** — `app.ts:20` uses `cors()` with no origin restrictions, allowing any domain to make API calls.
4. **Image upload has no restrictions** — `images.ts:22` creates a Multer instance with no `fileFilter`, `limits.fileSize`, or file type validation. Clients can upload any file type or size:`const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 }, fileFilter: (_req, file, cb) => { cb(null, file.mimetype.startsWith('image/')); }, });`
5. **No rate limiting** — No rate limiting on any endpoint. The image upload and user registration endpoints are particularly vulnerable to abuse.
6. **Cart endpoints don't verify user identity** — `GET /api/cart/:userId` returns any user's cart to any caller. The `userId` in the URL path should be verified against the authenticated user.
7. **User deletion has no cascading checks** — `users.ts:122` doesn't check for active rentals, listed items, or cart items before deleting. Would fail with a FK constraint error on any user with data.

### Performance Considerations

1. **No database indexes beyond PKs and unique constraints** — The Prisma schema has no `@@index` directives. Queries that would benefit:

- `Rental(rentableItemId, status)` — availability checks, checkout
- `Item(ownerId)` — dashboard filtering
- `CartItem(cartId)` — cart retrieval
- `BlockedDay(rentableItemId)` — availability checks

1. **No caching** — Every page load hits the database. For read-heavy pages like Browse and Home, consider HTTP cache headers or in-memory caching.
2. **Frontend makes redundant API calls** — `ItemDetail.tsx` fetches the rentable item, then `BlockedDaysCalendar` makes a second request for blocked days. Could be a single endpoint.
3. **Images served from Express** — `app.ts:24` uses `express.static`. In production, these should be served by a CDN or object storage.
4. **No query result limits** — All list endpoints return unbounded results. With 10k+ items, responses become multi-megabyte.
5. **Cart badge fetches full cart** — `CartContext.tsx:21-23` calls `fetchCart()` (full cart with all includes) just to count items. A lightweight `GET /api/cart/:userId/count` endpoint would be more efficient.

### Suggested Next Steps (prioritized)

| Priority | Task | Effort | Files |
| --- | --- | --- | --- |
| P0 | Fix mass assignment in PUT endpoints | 30 min | items.ts:68, rentableItems.ts:107 |
| P0 | Wrap checkout in $transaction | 30 min | cart.ts:281-302 |
| P1 | Add input validation with zod | 2-3 hrs | All route files |
| P1 | Add database indexes | 30 min | schema.prisma |
| P1 | Add pagination to list endpoints | 2-3 hrs | items.ts, rentableItems.ts, rentals.ts |
| P1 | Add server-side owner filtering | 1 hr | items.ts, rentableItems.ts |
| P2 | Add error logging | 1 hr | All route files |
| P2 | Restrict image uploads (type + size) | 15 min | images.ts |
| P2 | Add React error boundary | 30 min | App.tsx |
| P2 | Validate rental status transitions | 1 hr | rentals.ts |
| P3 | Add authentication (JWT/sessions) | 1-2 days | New middleware + all routes |
| P3 | Add CI/CD pipeline | 1-2 hrs | .github/workflows/ |
| P3 | Extract shared constants | 15 min | lib/constants.ts |