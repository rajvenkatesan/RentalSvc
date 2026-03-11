# RentalSvc — Product Specification (V1)

## Vision
A peer-to-peer rental marketplace where users can list items they own for rent and browse/rent items from others. Think "Airbnb for everyday items."

## Goal
Build a full-stack web application with a scalable backend and responsive frontend that enables users to list items for rent, browse available rentals, and manage their rental transactions.

---

## Domain Model

### User
A registered person on the platform. A single user can act as both a Renter (listing items) and a Rentee (renting items).

| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary key |
| email | string | Unique, used for login |
| displayName | string | Public-facing name |
| avatarUrl | string? | Profile picture |
| createdAt | timestamp | |
| updatedAt | timestamp | |

### Item
Describes a physical item that a user owns and may want to rent out.

| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary key |
| ownerId | UUID | FK → User |
| title | string | Short name |
| description | text | Detailed description |
| category | string | e.g. "Tools", "Electronics", "Sports" |
| condition | enum | new, like_new, good, fair |
| images | string[] | URLs to uploaded images |
| location | object | { city, state, zip, lat?, lng? } |
| createdAt | timestamp | |
| updatedAt | timestamp | |

### RentableItem (Listing)
Represents an Item that is actively available for rent, including pricing and rental terms.

| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary key |
| itemId | UUID | FK → Item |
| dailyRate | decimal | Cost per day in USD |
| weeklyRate | decimal? | Discounted weekly rate |
| securityDeposit | decimal? | Refundable deposit |
| minRentalDays | int | Minimum rental period (default: 1) |
| maxRentalDays | int? | Maximum rental period |
| deliveryOptions | enum[] | pickup, shipping, both |
| shippingCost | decimal? | If delivery includes shipping |
| isAvailable | boolean | Can be toggled by owner |
| createdAt | timestamp | |
| updatedAt | timestamp | |

### Cart
Holds RentableItems a user intends to rent before checkout.

| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary key |
| userId | UUID | FK → User |
| createdAt | timestamp | |
| updatedAt | timestamp | |

### CartItem
A line item in a cart, linking to a RentableItem with rental dates.

| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary key |
| cartId | UUID | FK → Cart |
| rentableItemId | UUID | FK → RentableItem |
| startDate | date | Desired rental start |
| endDate | date | Desired rental end |
| estimatedCost | decimal | Computed from rates + dates |

### Rental (future)
Tracks a completed rental transaction. (Deferred — will be designed when checkout is built.)

---

## User Flows

### 1. Landing / Home
- Show featured or recently listed RentableItems
- Search bar and category filters
- If user is logged in, show a "My Rentals" section summarizing active rentals

### 2. Browse & Search
- Grid/list of RentableItems with image, title, daily rate, location
- Filter by: category, price range, location, availability
- Sort by: price, distance, date listed

### 3. Item Detail
- Full item info: images (carousel), description, condition, location
- Rental terms: daily/weekly rate, deposit, delivery options
- "Add to Cart" with date picker (start/end)
- Owner profile summary

### 4. List an Item (Renter flow)
- Step 1: Item details — title, description, category, condition, photos
- Step 2: Rental terms — daily rate, weekly rate, deposit, delivery options, shipping cost
- Step 3: Review & publish
- After publishing, item appears in "My Listings"

### 5. Cart & Checkout
- View cart items with dates and estimated costs
- Remove items or adjust dates
- Checkout summary with total cost breakdown
- (Payment integration deferred)

### 6. My Dashboard
- **My Rentals**: Items the user is currently renting (as Rentee)
- **My Listings**: Items the user has listed for rent (as Renter)
- **Rental History**: Past completed rentals

---

## Tech Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Frontend | React + TypeScript | Component-based, strong ecosystem |
| Styling | Tailwind CSS | Utility-first, rapid UI development |
| Backend | Node.js + Express | JavaScript throughout, fast iteration |
| Database | PostgreSQL | Relational, scalable, strong for structured data |
| ORM | Prisma | Type-safe queries, migrations, schema-first |
| Image Storage | Local / S3 (later) | Start simple, scale later |
| Auth | (deferred) | Will add JWT/session-based auth later |
| Package Manager | pnpm | Fast, disk-efficient |

---

## Pages & Routes

| Route | Page | Description |
|-------|------|-------------|
| `/` | Home | Featured listings, search |
| `/browse` | Browse | Full listing grid with filters |
| `/item/:id` | Item Detail | Single listing with rental info |
| `/list-item` | List Item | Multi-step form to create a listing |
| `/cart` | Cart | Current cart items |
| `/dashboard` | Dashboard | My rentals, my listings, history |

---

## Acceptance Criteria

- Users can create an Item with photos, description, and location
- Users can set rental terms (rates, deposit, delivery) to create a RentableItem
- Browse page shows available RentableItems with filtering and sorting
- Item detail page shows full info and allows adding to cart with date selection
- Cart allows reviewing, adjusting, and removing items
- Dashboard shows user's listings and active rentals
- Database schema supports all domain models with proper relations
- API endpoints cover full CRUD for Items, RentableItems, and Cart
- Frontend is responsive (mobile + desktop)

## Non-Goals (for V1)
- User authentication / login (deferred — all users are anonymous for now)
- Payment processing
- Real-time messaging between renter and rentee
- Reviews and ratings
- Notification system (email/push)
- Admin panel
- Geolocation-based search (lat/lng filtering)

## Assumptions
- Single-currency (USD) for all pricing
- Images will be stored locally on disk initially ✓
- No multi-tenancy — single deployment for now
- Users can list and rent without authentication in v1 ✓
- PostgreSQL is acceptable as the database ✓

## Verification Plan
- `pnpm dev` starts both frontend and backend
- API endpoints return correct responses (manual or Postman testing)
- Database migrations run cleanly with `npx prisma migrate dev`
- Frontend pages render correctly and are navigable
- Cart operations (add/remove/update) work end-to-end

## Rollback Plan
- All changes are on the `workspace-create` branch
- `git revert` or reset to initial commit if needed
- Database can be reset with `npx prisma migrate reset`
