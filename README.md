# ShopVerse — MERN E-Commerce

A responsive e-commerce app with a React/Vite storefront, Express API, and MongoDB persistence.

## Included

- Product catalog with search, category and price/rating filters, and product detail pages.
- JWT sign up/sign in with bcrypt-hashed passwords and persisted customer wishlists.
- Persistent browser cart and server-validated orders with stock reservation.
- Administrator product management and order status dashboard.
- Sample product catalog with remote product photography.
- Cash-on-delivery order placement. Online payment is intentionally not enabled until a payment provider and credentials are configured.

## Requirements

- Node.js 18 or newer
- MongoDB local instance or MongoDB Atlas connection

## Local setup

1. Install dependencies from the project root:

   ```sh
   npm install
   ```

2. Copy `.env.example` to `.env` and set `MONGO_URI`, a unique `JWT_SECRET` (at least 32 characters), admin credentials, and `CLIENT_ORIGIN` to the frontend URL for production.

3. Seed the sample products and configured administrator:

   ```sh
   npm run seed
   ```

4. Start frontend and API together:

   ```sh
   npm run dev
   ```

5. Open `http://localhost:5173` and sign in using the configured administrator credentials.

For a production build, run `npm run build`, set `NODE_ENV=production`, and start the API with `npm start`. Express serves the compiled frontend from `dist`.

## API overview

- `GET /api/products`, `GET /api/products/:id`
- `POST /api/auth/signup`, `POST /api/auth/login`, `GET /api/auth/me`
- `GET /api/wishlist`, `PUT /api/wishlist/:productId`
- `POST /api/orders`, `GET /api/orders`
- Admin routes under `/api/admin` for products and order status.

Orders under ₹2,999 include ₹99 shipping; orders at or above ₹2,999 ship free. Product imagery is served from Unsplash URLs. Configure a payment provider separately before offering online card or UPI payments.
