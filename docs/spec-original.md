# RentalSvc — Original Concept Notes

> These were the initial concept notes before the formal product spec was created.

## Concept

- Peer-to-peer rental marketplace
- Users can list items they own for rent
- Users can browse and rent items from others
- "Airbnb for everyday items"

## Initial Ideas

- Domain models: User, Item, RentableItem, Cart, CartItem, Rental
- Users act as both Renter (listing items) and Rentee (renting items)
- Categories for items (Tools, Electronics, Sports, etc.)
- Daily and weekly rental rates with security deposits
- Delivery options: pickup, shipping, or both
- Cart-based checkout flow

## Initial Assumptions

- Images stored locally on disk initially
- No authentication in v1
- PostgreSQL as database
- Single-currency (USD)
- Node.js + React stack