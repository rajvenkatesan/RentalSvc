# RentalSvc — Architecture & Tech Stack

## Overview

RentalSvc is a peer-to-peer rental marketplace built as a **TypeScript monorepo**. Users can list items for rent, browse available items, add them to a cart with date ranges, and check out to create rental transactions.

## System Architecture

> **System architecture diagram:**
> Browser → Vite Dev Server (port 5173) → React 19 SPA (React Router, Tailwind CSS 4) → /api + /uploads proxy → Express 4.21 REST API (port 3001) → Prisma 7.4 ORM → PostgreSQL 17.
> Express also routes uploads through Multer → /uploads (file system).
> The frontend package contains React and the proxy; the backend package contains Express, Multer, and Prisma.

## Tech Stack Summary

| Layer | Technology | Version |
|-------|-----------|---------|
| **Runtime** | Node.js + TypeScript | TS 5.7 |
| **Backend** | Express.js | 4.21 |
| **ORM** | Prisma | 7.4 |
| **Database** | PostgreSQL | 17 |
| **Frontend** | React | 19.0 |
| **Build** | Vite | 6.0 |
| **CSS** | Tailwind CSS | 4.0 |
| **Routing** | React Router | 7.13 |
| **Testing** | Vitest + React Testing Library | 4.0 / 16.3 |
| **Monorepo** | pnpm workspaces | — |
| **File Upload** | Multer | 2.1 |

## Data Model

> **Entity-relationship diagram:**
> User (id, username, email, displayName, avatarUrl) owns Items (1:many).
> Item (id, title, category, images[], location) has a 1:1 RentableItem (dailyRate, weeklyRate, minRentalDays, isAvailable).
> RentableItem has many BlockedDays (startDate, endDate, reason) and many Rentals (startDate, endDate, totalCost, status).
> User rents Rentals (1:many).
> User has many Carts (userId), each Cart has many CartItems (startDate, endDate, estimatedCost).
> RentableItem has many CartItems.

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
|-------|---------|---------|
| `/api/items` | GET, POST | List/create items |
| `/api/items/:id` | GET, PUT, DELETE | Item CRUD (owner-only edit/delete) |
| `/api/rentable-items` | GET, POST | List/create rentable items |
| `/api/rentable-items/:id` | GET, PUT | Rentable item detail/update |
| `/api/cart/:userId` | GET | Get user's cart |
| `/api/cart/:userId/items` | POST | Add item to cart (with availability check) |
| `/api/cart/:userId/items/:itemId` | PUT, DELETE | Update/remove cart item |
| `/api/cart/:userId/checkout` | POST | Checkout → create rentals |
| `/api/rentals` | GET | List user's rentals |
| `/api/rentals/:id` | GET | Get rental detail |
| `/api/rentals/:id/status` | PUT | Update rental status |
| `/api/users` | GET, POST | List/create users |
| `/api/users/:id` | GET, PUT, DELETE | User CRUD |
| `/api/images` | POST | Upload image (Multer) |
| `/api/blocked-days` | GET, POST | List/create blocked days |
| `/api/blocked-days/:id` | DELETE | Remove blocked day |
| `/api/health` | GET | Health check |

**Auth**: `x-user-id` header for owner verification (no JWT/session auth yet)

## Frontend Architecture

### State Management
- **UserContext** — current user, persisted to `localStorage`
- **CartContext** — cart count, `refreshCart()` for live badge updates
- No external state library (Redux, Zustand) — React Context only

### Pages (9 routes)
| Route | Page | Description |
|-------|------|-------------|
| `/` | Home | Landing with hero, categories, featured items |
| `/browse` | Browse | Filterable grid of rentable items |
| `/item/:id` | ItemDetail | Full item view, add-to-cart with dates |
| `/item/:id/edit` | EditItem | Owner-only edit form |
| `/list-item` | ListItem | 3-step item creation wizard |
| `/cart` | Cart | Cart items, date editing, checkout |
| `/rentals` | Rentals | User's rented items, overdue highlighting |
| `/dashboard` | Dashboard | My Listings + My Items tabs |
| `/register` | Register | User registration form |

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
|---------|-----------|-------|----------|
| Backend | Vitest + Supertest | 174 | Mocked Prisma, HTTP assertions |
| Frontend | Vitest + RTL | 49 | Component rendering, user events, mocked API |
| **Total** | | **223** | |

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
