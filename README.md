# Lumen Marketplace

Lumen is a full-stack, MongoDB-backed marketplace built from the supplied Stitch visual design. Stage 1 delivers the responsive public catalog and its Express product/category API.

## Run locally

1. Install Node.js 20 or newer and run MongoDB locally (or prepare a MongoDB Atlas connection string).
2. Copy `.env.example` to `.env`, then set `MONGODB_URI` and replace `JWT_SECRET` with a long private value.
3. Install dependencies:

   ```powershell
   npm install
   ```

4. Optionally add Lumen’s example categories and products:

   ```powershell
   cd backend
   npm run seed
   ```

5. Start the backend in one terminal:

   ```powershell
   cd backend
   npm run dev
   ```

6. Start the frontend in a second terminal, then open `http://localhost:3000`:

   ```powershell
   cd frontend
   npm run dev
   ```

## Verify

```powershell
npm test
```

## Owner & Administrator Dashboard

The store includes a dedicated Owner Dashboard where owners can oversee the website, track catalog metrics, register new products, and delete items in real time.

### Owner Credentials

| Field | Default Value | Notes |
|---|---|---|
| **Email** | `admin@lumen.local` (or `owner@lumen.local`) | Configurable in `.env` via `ADMIN_EMAIL` |
| **Password** | `ChangeMe123!` | Configurable in `.env` via `ADMIN_PASSWORD` |
| **Login URL** | `http://localhost:3000/login.html` | Features an "Auto-fill Owner Credentials" button |
| **Dashboard URL** | `http://localhost:3000/admin.html` | Owner console for catalog monitoring & inventory |

### Owner Capabilities

1. **Monitor Website Activity**:
   - Total active live units/artifacts published on the store.
   - Total catalog collections / disciplines.
   - Total inventory archive valuation ($ USD).
   - Real-time catalog sync status and search filter.
2. **Add Products / Items**:
   - Click **+ Register artifact** to open the creation modal.
   - Fill in product name, description, price, category, and image URL.
   - Instantly publishes to the storefront and updates dashboard metrics.
3. **Delete Products / Items**:
   - Each item in the dashboard inventory table features a **Delete** button.
   - Includes safety confirmation dialog before deletion.
   - Immediately removes the product from the public website and adjusts inventory metrics.

## Current API

- `GET /api/health`
- `POST /api/auth/login` — Administrator & Owner authentication (returns JWT token)
- `GET /api/categories` — List all categories
- `POST /api/categories` — Create category (requires Admin token)
- `DELETE /api/categories/:categoryId` — Delete category (requires Admin token)
- `GET /api/products?category=<category-id>` — List active products
- `GET /api/products/:productId` — Get single product details
- `POST /api/products` — Register new product (requires Admin token)
- `DELETE /api/products/:productId` — Delete product from store (requires Admin token)

## Project structure

- `frontend/` — HTML pages (`index.html`, `login.html`, `admin.html`), styles, and vanilla JavaScript client. Development server runs on port 3000.
- `backend/` — Express app, Mongoose models (`User`, `Product`, `Category`), controllers, auth middleware, and API server on port 5000.
