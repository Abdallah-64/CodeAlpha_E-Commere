# Lumen Marketplace Design

## Intent

Build a general-purpose e-commerce marketplace with a customer storefront and an administrator console. The supplied Google Stitch screens are the visual source of truth; the application must preserve their warm-minimal, editorial LUMEN identity while replacing their sample data and placeholder actions with real functionality.

## Stage 1 scope

Establish the normal `frontend/` and `backend/` folder structure and deliver a runnable public product catalog. The catalog will obtain categories and products from an Express REST API backed by MongoDB/Mongoose, render dynamic category filters, and include clear loading and error states.

## Visual direction

Use the uploaded Stitch design system: Plus Jakarta Sans; warm alabaster background; white cards; charcoal actions; restrained bronze accents; generous spacing; 4:5 product imagery; fine borders; and responsive 12/8/4-column layouts. Do not introduce a generic dashboard or UI framework.

## Constraints

- Frontend: HTML5, CSS3, vanilla JavaScript.
- Backend: Node.js, Express, MongoDB/Mongoose.
- Later stages will add JWT/bcrypt authentication, cart/order processing, and the admin system.
- Secrets must be environment variables, with `.env.example` committed and `.env` ignored.
- Product categories are data-driven; no category or product type is hardcoded into application behavior.

## Non-goals for Stage 1

Authentication, persistent cart operations, checkout/orders, image uploads, receipts, and dashboard management are reserved for later independently testable stages.
