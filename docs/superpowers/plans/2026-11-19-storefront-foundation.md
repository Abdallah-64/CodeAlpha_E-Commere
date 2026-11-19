# Lumen Storefront Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a runnable Lumen public catalog that loads products and categories from a MongoDB-backed Express API while matching the supplied Stitch home screen.

**Architecture:** `backend/` exposes versioned JSON REST endpoints, with Mongoose models and controllers isolated from route wiring. `frontend/` is a static vanilla JavaScript client served by Express in development; it uses a small API module and rendering module rather than embedded sample catalog data.

**Tech Stack:** Node.js, Express, MongoDB/Mongoose, Node's built-in test runner, HTML5, CSS3, vanilla JavaScript.

**Spec:** `docs/superpowers/specs/2026-11-19-lumen-marketplace-design.md`

## Global Constraints

- Preserve the uploaded Stitch home-catalog visual identity and use no UI framework.
- Keep the standard `frontend/` and `backend/` directories.
- Persist products and categories in MongoDB; category filtering must use returned data.
- Keep all connection settings in environment variables; commit `.env.example`, never `.env`.

## Review Focus

- API behavior when MongoDB is unavailable: return a controlled 500 response without leaking credentials.
- Product validation: reject missing name/category and non-positive price.
- Category filtering: category IDs containing non-alphanumeric characters must not break rendering or selection.
- Empty catalog: show an intentional empty-state message, not a blank grid.
- Responsive catalog: the grid must reduce to two and one columns without horizontal scrolling.

### Task 1: Backend application and environment setup

**Files:**
- Create: `package.json`, `.gitignore`, `.env.example`
- Create: `backend/app.js`, `backend/server.js`, `backend/config/database.js`
- Test: `backend/tests/app.test.js`

**Interfaces:**
- Produces: `createApp()` in `backend/app.js`, returning an Express application with JSON error responses.

- [ ] **Step 1: Write the failing application-health test**

```js
test('GET /api/health returns application status', async () => {
  const response = await request(app).get('/api/health');
  assert.equal(response.status, 200);
  assert.deepEqual(response.body, { status: 'ok' });
});
```

- [ ] **Step 2: Run the health test to verify it fails**

Run: `npm test -- backend/tests/app.test.js`
Expected: FAIL because the application module does not exist.

- [ ] **Step 3: Implement the minimal Express application**

Implement `createApp()` in `backend/app.js`, mount `GET /api/health`, enable JSON parsing, and add a final JSON 404/error handler. `backend/server.js` must call `connectDatabase()` before listening on `PORT`.

- [ ] **Step 4: Run the health test to verify it passes**

Run: `npm test -- backend/tests/app.test.js`
Expected: PASS.

### Task 2: Category API

**Files:**
- Create: `backend/models/Category.js`, `backend/controllers/categoryController.js`, `backend/routes/categoryRoutes.js`
- Modify: `backend/app.js`
- Test: `backend/tests/category.test.js`

**Interfaces:**
- Consumes: `createApp()` from Task 1.
- Produces: `GET /api/categories` returning `{ categories: Category[] }`; `POST /api/categories` accepting `{ name, description? }` and returning a created Category.

- [ ] **Step 1: Write the failing category-route tests**

```js
test('POST /api/categories creates a category with a name', async () => {
  const response = await request(app).post('/api/categories').send({ name: 'Lighting' });
  assert.equal(response.status, 201);
  assert.equal(response.body.category.name, 'Lighting');
});

test('POST /api/categories rejects a missing name', async () => {
  const response = await request(app).post('/api/categories').send({});
  assert.equal(response.status, 400);
});
```

- [ ] **Step 2: Run category tests to verify they fail**

Run: `npm test -- backend/tests/category.test.js`
Expected: FAIL because category routes do not exist.

- [ ] **Step 3: Implement Category model, controller, and routes**

Define a trimmed, unique `name` and optional trimmed `description`; map Mongoose validation errors to 400 responses. Mount the routes at `/api/categories`.

- [ ] **Step 4: Run category tests to verify they pass**

Run: `npm test -- backend/tests/category.test.js`
Expected: PASS.

### Task 3: Product API

**Files:**
- Create: `backend/models/Product.js`, `backend/controllers/productController.js`, `backend/routes/productRoutes.js`
- Modify: `backend/app.js`
- Test: `backend/tests/product.test.js`

**Interfaces:**
- Consumes: `Category` model from Task 2.
- Produces: `GET /api/products?category=<id>` returning `{ products: Product[] }`; `POST /api/products` accepting name, description, price, category, and optional images.

- [ ] **Step 1: Write the failing product-route tests**

```js
test('GET /api/products filters products by category ID', async () => {
  const response = await request(app).get(`/api/products?category=${category.id}`);
  assert.equal(response.status, 200);
  assert.equal(response.body.products.length, 1);
});

test('POST /api/products rejects a zero price', async () => {
  const response = await request(app).post('/api/products').send({ name: 'Lamp', price: 0, category: category.id });
  assert.equal(response.status, 400);
});
```

- [ ] **Step 2: Run product tests to verify they fail**

Run: `npm test -- backend/tests/product.test.js`
Expected: FAIL because product routes do not exist.

- [ ] **Step 3: Implement Product model, controller, and routes**

Model `name`, `description`, positive `price`, image URL array, category reference, created/updated timestamps. Populate category on reads and accept an optional category query filter.

- [ ] **Step 4: Run product tests to verify they pass**

Run: `npm test -- backend/tests/product.test.js`
Expected: PASS.

### Task 4: Stitch-based public catalog

**Files:**
- Create: `frontend/index.html`, `frontend/css/styles.css`, `frontend/js/api.js`, `frontend/js/catalog.js`, `frontend/assets/.gitkeep`
- Modify: `backend/app.js`
- Test: `frontend/tests/catalog.test.js`

**Interfaces:**
- Consumes: `GET /api/categories` and `GET /api/products?category=<id>`.
- Produces: `loadCatalog()` in `frontend/js/catalog.js`, which renders API data, an empty state, or an error state into the catalog page.

- [ ] **Step 1: Write the failing catalog-render test**

```js
test('renderProducts shows a product title and formatted price', () => {
  renderProducts([{ _id: 'p1', name: 'Aero Headphones', price: 280, category: { name: 'Audio' }, images: [] }]);
  assert.match(document.body.textContent, /Aero Headphones/);
  assert.match(document.body.textContent, /\$280\.00/);
});
```

- [ ] **Step 2: Run the catalog test to verify it fails**

Run: `npm test -- frontend/tests/catalog.test.js`
Expected: FAIL because the catalog module does not exist.

- [ ] **Step 3: Implement the responsive catalog page**

Build the supplied Stitch home layout in semantic HTML/CSS. The JavaScript API module must fetch real endpoints; catalog rendering must create category chips from response data, fetch filtered products, and communicate loading, empty, and error states.

- [ ] **Step 4: Run the catalog test to verify it passes**

Run: `npm test -- frontend/tests/catalog.test.js`
Expected: PASS.

### Task 5: Stage verification and run documentation

**Files:**
- Create: `README.md`
- Modify: `package.json`

**Interfaces:**
- Consumes: all prior tasks.
- Produces: `npm test` and `npm start` scripts and accurate setup instructions.

- [ ] **Step 1: Add the failing script-existence test**

```js
test('package scripts expose test and start commands', () => {
  assert.ok(packageJson.scripts.test);
  assert.ok(packageJson.scripts.start);
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm test -- backend/tests/scripts.test.js`
Expected: FAIL because the scripts are not defined.

- [ ] **Step 3: Add scripts and document local setup**

Document Node version, `npm install`, `.env` setup from `.env.example`, MongoDB dependency, `npm start`, and `npm test`.

- [ ] **Step 4: Run the complete suite**

Run: `npm test`
Expected: PASS with all Stage 1 tests.

## Plan self-review

- Coverage: Stage 1 covers repository architecture, environment handling, MongoDB-backed categories/products, a real REST API, and the public Stitch catalog. Authentication, cart, orders, receipts, and administration remain intentionally staged rather than omitted.
- Interfaces: route paths and response shapes are declared before the frontend task consumes them.
- Review focus: unavailable database, invalid product input, unexpected category IDs, empty data, and responsive layout are each assigned to owning tests/tasks.
