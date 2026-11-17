# Contributing

This repository contains three related Node.js applications: the Express backend, customer frontend, and admin frontend.

## Local setup

Install dependencies separately in each application directory:

~~~bash
cd backend && npm ci
cd ../frontend && npm ci
cd ../admin && npm ci
~~~

Configure backend/.env using backend/.env.example. Never commit local environment files or real credentials.

## Before opening a pull request

- Build the customer frontend with npm run build from frontend/.
- Build the admin frontend with npm run build from admin/.
- Syntax-check backend/server.js with node --check.
- Test affected API routes and user flows locally where dependencies are available.
- Keep Stripe secret keys server-side only.
- Do not commit uploads, customer records, order data, or private database exports.

There is currently no dedicated automated test suite. Add tests when introducing or changing authentication, payment, cart, or order behavior.

## Pull requests

Describe which application(s) changed, list commands run, and include screenshots for visible UI changes. Call out any new environment variables or database changes.
