# Lumen Marketplace

Lumen is a full-stack e-commerce storefront and store management system built with semantic HTML5, CSS3, vanilla JavaScript, Express, and MongoDB. It provides a curated shopping experience with cart and stock tracking for customers, alongside an authenticated Owner Dashboard for managing products, inventory, and customer orders.

---

## System Features

### Customer Storefront (`frontend/index.html`)
- **Curated Catalog & Category Showcase**: Browse products by category with live filter pills and category discipline cards.
- **Quick-View Product Modal**: Click **Quick View** or **View Details** on any product card to inspect full product descriptions, pricing, and remaining stock availability.
- **Shopping Cart & Checkout**:
  - Add items to the cart, adjust quantities (`+` / `−`), or remove items.
  - Real-time subtotal and **Total money to pay** calculation.
  - Checkout form collecting customer name, email, and delivery address, generating an order confirmation receipt.
- **Automatic Stock Deduction**: Purchases automatically deduct sold quantities from available store inventory, prevent ordering above remaining stock, and mark items as **Sold out** when `0` units remain.

### Owner Dashboard (`frontend/admin.html`)
- **Protected Access**: Guarded behind owner sign-in (`frontend/login.html`) with JWT/session verification. Unauthenticated requests redirect to login, and logging out or closing the session clears stored credentials.
- **Live Store Metrics**:
  - **Total products** listed in the store
  - **Total units in stock** across all items
  - **Customer orders** count
  - **Total sales revenue** ($ USD)
- **Unified Add Product Workflow**:
  - Single **+ Add Product** modal to register an item in one step: product name, description, USD price, initial stock quantity, category selection or custom category entry, and drag-and-drop / click image upload with preview.
- **Inventory & Stock Controls**:
  - Inline `+` / `−` stock controls and click-to-edit quantities with low-stock warnings and sold item indicators.
  - Product search and confirmation-protected item deletion.
- **Customer Purchases & Orders Tab**:
  - Displays each order reference, timestamp, customer contact and delivery address, purchased items with thumbnails, total amount paid, and payment status (`Paid`), with search filtering and cross-tab sync.

---

## Security Practices

- **No Hardcoded Public Credentials**: Owner credentials and JWT signing keys are never exposed in public storefront pages or documentation.
- **Environment Isolation**: Sensitive runtime configuration (`.env`, `.env.*`, `backend/.env`, `backend/.env.*`) is excluded from version control via `.gitignore`.
- **Authenticated Admin Endpoints**: Product creation, stock updates, deletions, category mutations, and order listing require a valid administrator Bearer token verified by `requireAdmin` middleware.
- **Session Handling**: Owner sessions are stored in browser `sessionStorage` and cleared on logout.

---

## Environment Configuration

Create a private `.env` file in the project root (and/or `backend/.env`) before running the backend. Never commit `.env` files to source control.

```env
PORT=5000
MONGODB_URI=<your-mongodb-connection-string>
JWT_SECRET=<your-long-random-secret-key>
CLIENT_URL=http://localhost:3000
ADMIN_EMAIL=<your-owner-email>
ADMIN_PASSWORD=<your-strong-owner-password>
```

---

## Run Locally

1. **Prerequisites**: Install Node.js 20 or newer and ensure MongoDB is running locally (or provide a MongoDB Atlas URI in `.env`).
2. **Install dependencies**:
   ```powershell
   npm install
   ```
3. **Seed starter catalog (optional)**:
   ```powershell
   cd backend
   npm run seed
   ```
4. **Start the backend API** (Terminal 1, listens on port `5000`):
   ```powershell
   cd backend
   npm run dev
   ```
5. **Start the frontend server** (Terminal 2, listens on port `3000`):
   ```powershell
   cd frontend
   npm run dev
   ```
6. Open `http://localhost:3000` in your browser.

---

## Verification & Tests

Run the automated test suite from the project root:

```powershell
npm test
```

This verifies backend Mongoose model validation (`Category`, `Product`, `Order`) and frontend currency, cart total, stock deduction, and catalog merge utilities.

---

## API Endpoints

- `GET /api/health` — API health check
- `POST /api/auth/login` — Owner authentication (issues JWT)
- `GET /api/auth/verify` — Validate active owner session (requires Admin token)
- `GET /api/categories` — List all categories
- `POST /api/categories` — Create a category (requires Admin token)
- `DELETE /api/categories/:categoryId` — Delete a category (requires Admin token)
- `GET /api/products?category=<category-id>` — List products (optionally filtered by category)
- `GET /api/products/:productId` — Fetch single product details
- `POST /api/products` — Create a product (requires Admin token)
- `PATCH /api/products/:productId/stock` — Update product stock quantity (requires Admin token)
- `DELETE /api/products/:productId` — Delete a product (requires Admin token)
- `POST /api/orders` — Place a customer order and deduct tracked product stock
- `GET /api/orders` — List customer orders (requires Admin token)

---

## Project Structure

- `frontend/` — Static storefront (`index.html`), owner sign-in (`login.html`), Owner Dashboard (`admin.html`), CSS (`css/styles.css`), vanilla JS modules (`js/`), tests (`tests/`), and local static server (`server.js` on port `3000`).
- `backend/` — Express application (`app.js`), server entrypoint (`server.js` on port `5000`), database connection (`config/`), Mongoose models (`models/`), route handlers (`controllers/`, `routes/`), auth middleware (`middleware/`), catalog seeder (`services/`), and tests (`tests/`).
