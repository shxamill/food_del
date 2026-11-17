# Food Delivery App

[![CI](https://github.com/shxamill/food_del/actions/workflows/ci.yml/badge.svg)](https://github.com/shxamill/food_del/actions/workflows/ci.yml) [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

A full-stack food-delivery application with a customer-facing website, an admin panel, and an Express API backed by MongoDB. The backend includes Stripe-related payment integration code.

## Applications

| Directory | Role | Stack |
| --- | --- | --- |
| backend/ | API, authentication, food, cart, and order routes | Node.js, Express, MongoDB/Mongoose |
| frontend/ | Customer-facing food ordering site | React, Vite |
| admin/ | Admin interface for food and order management | React, Vite |

## Requirements

- Node.js 20 or later and npm.
- A MongoDB database, local or hosted.
- Stripe credentials for payment-related functionality.

## Local setup

Run each service in a separate terminal.

### 1. Backend API

~~~bash
cd backend
npm ci
~~~

Create a local environment file from the example:

~~~bash
cp .env.example .env
~~~

Set the values in backend/.env:

| Variable | Purpose |
| --- | --- |
| MONGO_URI | MongoDB connection string |
| JWT_SECRET | Secret used to sign authentication tokens |
| STRIPE_SECRET_KEY | Server-side Stripe secret key |

Start the API:

~~~bash
npm run server
~~~

The backend defaults to http://localhost:4000. Its root route responds with "API Working".

### 2. Customer frontend

In a second terminal:

~~~bash
cd frontend
npm ci
npm run dev
~~~

Open the local URL printed by Vite.

### 3. Admin frontend

In a third terminal:

~~~bash
cd admin
npm ci
npm run dev
~~~

Open the local URL printed by Vite.

## API route groups

The Express server mounts route groups for:

- /api/user — user-related routes
- /api/food — food-related routes
- /api/cart — cart operations
- /api/order — order operations
- /images — uploaded image files

Review the route files under backend/routes/ for the exact supported methods and request shapes.

## Build status

The frontend and admin source trees are currently incomplete in this repository. The customer app imports modules under frontend/src/Context, frontend/src/pages, and frontend/src/components that are not present in the committed tree. The admin app likewise imports admin/src/pages and admin/src/components, which are not present yet.

As a result, the Vite production builds currently fail. CI installs the dependencies and checks backend syntax, then skips the frontend builds with a warning until those source modules are committed. This is intentional: placeholder components are not generated because that would misrepresent working application features.

Once the missing source modules are added, run:

~~~bash
npm run build --prefix frontend
npm run build --prefix admin
~~~

The backend currently has no dedicated test or build script. It can be syntax-checked with:

~~~bash
node --check backend/server.js
~~~

## Security notes

- Never commit backend/.env or any real Stripe, MongoDB, or JWT credentials.
- Keep STRIPE_SECRET_KEY on the server; never expose it in browser code.
- Use a strong, unique JWT_SECRET outside local development.
- Treat uploaded images and user/order data as untrusted input.
- Configure database access and allowed origins deliberately before deployment.

## Current status

This repository contains the application source. A successful local build does not by itself verify payment flows, database deployment, authentication security, or production readiness. Test those integrations in a safe sandbox before launch.

## Contribution and support

See [CONTRIBUTING.md](CONTRIBUTING.md), [SECURITY.md](SECURITY.md), [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md), and [SUPPORT.md](SUPPORT.md).

## License

This project is licensed under the [MIT License](LICENSE).
