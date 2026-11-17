# Food Delivery App

Full-stack food delivery app (MERN + Stripe).

- `frontend/` – customer site (React + Vite)
- `admin/` – admin panel for managing food items and orders (React + Vite)
- `backend/` – Express + MongoDB API

## Run locally

```bash
cd backend && npm install && cp .env.example .env   # fill in your values
npm run server   # or: node server.js
cd ../frontend && npm install && npm run dev
cd ../admin && npm install && npm run dev
```
