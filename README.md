# StockFlow — SaaS Inventory Management (6-Hour MVP)

A minimal, multi-tenant inventory management app: sign up, add products, track
stock, and see a low-stock dashboard. Built to the scope defined in the
Phase 1 MVP PRD.

**Stack:** Flask (Python) + SQLAlchemy/SQLite (SQL) on the backend, React
(JavaScript/HTML/CSS) on the frontend, JWT auth.

## Features (matches PRD scope)

- Email/password signup & login, one Organization created per signup (FR-1, FR-2)
- Product CRUD: name, SKU (unique per org), description, quantity on hand,
  cost price, selling price, low stock threshold (FR-3, FR-4)
- Inline stock adjustment (+/- buttons) with `last_updated_by` tracking (FR-5)
- Dashboard: total products, total units on hand, low-stock table (FR-6)
- Settings: org-wide default low stock threshold (FR-7)
- All data scoped by organization — no cross-tenant leaks

Out of scope, matching the PRD: multi-warehouse, variants, integrations,
purchase orders, email notifications, CSV import, RBAC, audit logs, billing.

## Project structure

```
stockflow/
├── backend/              Flask API (SQLite via SQLAlchemy)
│   ├── app.py            App factory / entrypoint
│   ├── config.py
│   ├── extensions.py     db, jwt, cors
│   ├── models.py         Organization, User, Product
│   ├── utils.py          @require_org auth decorator
│   ├── routes/
│   │   ├── auth.py       /api/auth/signup, /api/auth/login
│   │   ├── products.py   /api/products CRUD + /adjust
│   │   ├── dashboard.py  /api/dashboard
│   │   └── settings.py   /api/settings
│   └── requirements.txt
└── frontend/             React SPA (Create React App)
    ├── src/
    │   ├── api/client.js       fetch wrapper for the API
    │   ├── AuthContext.js      auth state (localStorage-backed)
    │   ├── components/         Layout, ProtectedRoute
    │   ├── pages/               Login, Signup, Dashboard, Products, ProductForm, Settings
    │   ├── App.js               routes
    │   └── index.css            styling (plain CSS)
    └── package.json
```

## Running locally

### 1. Backend (Flask + SQLite)

```bash
cd backend
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env            # edit secrets if you like
python app.py
```

The API runs at `http://localhost:5000`. A `stockflow.db` SQLite file is
created automatically on first run (`db.create_all()`).

Health check: `curl http://localhost:5000/api/health`

### 2. Frontend (React)

In a second terminal:

```bash
cd frontend
npm install
cp .env.example .env            # points to the local API by default
npm start
```

The app runs at `http://localhost:3000` and talks to the API at
`REACT_APP_API_URL` (default `http://localhost:5000/api`).

### 3. Try it

1. Go to `http://localhost:3000`, sign up with an email, password, and
   organization name.
2. Add a product with a SKU and quantity.
3. Set its Low Stock Threshold above its quantity (or lower the quantity via
   the +/- controls) to see it appear on the Dashboard.
4. Visit Settings to change the org-wide default low stock threshold.

## API overview

All routes below except signup/login require `Authorization: Bearer <token>`.

| Method | Path                          | Description                     |
|--------|-------------------------------|----------------------------------|
| POST   | /api/auth/signup              | Create org + user, returns JWT  |
| POST   | /api/auth/login                | Returns JWT                     |
| GET    | /api/products?search=          | List/search org's products      |
| POST   | /api/products                  | Create product                  |
| GET    | /api/products/:id              | Get one product                 |
| PUT    | /api/products/:id               | Update product                  |
| DELETE | /api/products/:id                | Delete product                  |
| POST   | /api/products/:id/adjust        | Adjust stock by +/- delta       |
| GET    | /api/dashboard                  | Summary + low-stock items       |
| GET    | /api/settings                   | Get org settings                |
| PUT    | /api/settings                    | Update default low stock threshold |

## Deployment notes

- **Backend:** deploy with `gunicorn app:app` behind any Python host (Render,
  Railway, Fly.io, a plain VM). Set `SECRET_KEY`, `JWT_SECRET_KEY`, and
  `DATABASE_URL` as environment variables. For anything beyond a quick demo,
  swap SQLite for managed Postgres by changing `DATABASE_URL`.
- **Frontend:** `npm run build` produces a static `build/` folder deployable
  to Vercel, Netlify, or any static host. Set `REACT_APP_API_URL` to the
  deployed backend's URL before building.
- Update CORS origins in `backend/app.py` (`cors.init_app`) to the deployed
  frontend's origin once you have it, instead of `*`.

## Notes / design decisions

- Passwords hashed with Werkzeug's `generate_password_hash` (bcrypt-style PBKDF2).
- JWT identity is the user's UUID; org scoping is enforced on every query
  server-side (never trusted from the client).
- SKU uniqueness is enforced per-organization at the DB level and checked on
  create/update.
- Low-stock logic: a product is low stock if `quantity_on_hand <=
  effective_threshold`, where `effective_threshold` is the product's own
  threshold if set, otherwise the org's default (Settings page).
