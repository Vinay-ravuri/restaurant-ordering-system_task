# RestaurantOS — Enterprise Restaurant Ordering & Kitchen Operations Platform

A modern, full-stack, enterprise-grade restaurant ordering, kitchen operations display (KDS), and management platform engineered with **Fastify, TypeScript, Prisma, PostgreSQL, React, Vite, and Server-Sent Events (SSE)**.

---

## 🌟 Highlights & Core Engineering Principles

1. **Strict Server-Side Price Calculation:** 
   The browser never dictates prices or order totals. All line items, variants, and order totals are computed server-side in integer paise using transactional snapshotting.
2. **Deterministic Finite State Machine (FSM):** 
   Kitchen status strictly enforces: `RECEIVED ➔ PREPARING ➔ READY ➔ SERVED`. Skipping steps or backward transitions are rejected by the backend with informative HTTP errors.
3. **Real-time Live Sync via Server-Sent Events (SSE):** 
   Native HTTP streaming with heartbeat keep-alives (every 25s), automatic exponential-backoff client reconnection, and snapshot recovery. Zero manual browser refreshes needed.
4. **Historical Price & Item Snapshots:** 
   Order items snapshot names, variant labels, and unit prices in paise at order creation time. Subsequent menu edits or price changes never alter past orders.
5. **Asia/Kolkata Business Day Boundaries:** 
   Daily revenue, sales trends, and order counts are calculated using exact `Asia/Kolkata` (IST) midnight-to-midnight bounds, avoiding UTC drift.
6. **Supabase as Plain PostgreSQL:** 
   Supabase is utilized purely as standard PostgreSQL via `DATABASE_URL`. All business logic, authorization, pricing, and live broadcasts are executed in our own Node.js backend.

---

## 🏛️ Architecture & Tech Stack

### Backend
- **Runtime:** Node.js 20+ with TypeScript (Strict mode)
- **Framework:** Fastify 5 (Ultra-fast, modular HTTP server)
- **ORM:** Prisma ORM 5 with PostgreSQL
- **Validation:** Zod schemas on every route payload & query parameter
- **Authentication:** JWT in secure `httpOnly`, `SameSite=Lax` cookies, bcrypt password hashing
- **Security:** `@fastify/helmet`, `@fastify/cors` (credentials-enabled, origin-restricted), rate limiting
- **Real-Time:** In-process event bus emitting SSE (`order.created`, `order.updated`, `menu.updated`)
- **Testing:** Vitest with comprehensive domain, pricing, FSM, and authorization tests

### Frontend
- **Framework:** React 18 + Vite + TypeScript (Strict mode)
- **Styling:** Tailwind CSS with a curated warm hospitality design system (Ivory `#F8F6F1`, Terracotta `#C65D3B`, Deep Charcoal `#20211F`)
- **State & Data Fetching:** TanStack Query (React Query) for server state; Zustand for persistent cart state
- **Routing:** React Router v7
- **Icons & Micro-animations:** Lucide React & Framer Motion
- **Sound & Accessibility:** Kitchen >15 min overdue alert with audio chime & user-controlled sound toggle

---

## 📂 Repository Structure

```
restaurant-ordering-system/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma       # Database schema & indexes
│   │   └── seed.ts             # Idempotent seed script (admin, kitchen, categories, items, orders)
│   ├── src/
│   │   ├── config/             # Environment & constants
│   │   ├── db/                 # Prisma client instance
│   │   ├── domain/             # Pure logic: calcOrderTotal, statusMachine, dayRangeIST
│   │   ├── events/             # SSE event bus & connection manager
│   │   ├── middleware/         # Auth guard, role authorization, rate limiter, error handler
│   │   ├── routes/             # Auth, menu, orders, kitchen, admin, SSE routes
│   │   └── server.ts           # Fastify server entry point
│   ├── tests/                  # Vitest automated test suite (pricing, FSM, auth, IST)
│   ├── tsconfig.json
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/         # Reusable design system primitives (Button, Card, Badge, Modal, etc.)
│   │   ├── hooks/              # useEventSource, useCart, useAuth
│   │   ├── lib/                # API client, currency formatting, sound generator
│   │   ├── pages/              # Menu, Cart, Live Tracker, Kitchen KDS, Admin Console, Login
│   │   ├── types/              # Domain & API interfaces
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── index.html
│   ├── tailwind.config.js
│   ├── vite.config.ts
│   └── package.json
├── docs/                       # Architecture diagrams & specifications
├── .github/workflows/ci.yml    # Continuous Integration pipeline
├── .env.example                # Root environment blueprint
├── README.md
└── package.json                # Root monorepo orchestrator
```

---

## 🚀 Quickstart & Local Setup

### 1. Prerequisites
- Node.js 20+ installed (`node -v`)
- npm 10+ (`npm -v`)
- PostgreSQL database instance (Local PostgreSQL or Supabase project)

### 2. Clone & Install
```bash
git clone <repo-url>
cd kitchen_task

# Install dependencies across root, backend, and frontend
npm run install:all
```

### 3. Configure Environment Variables
Copy `.env.example` in both `backend` and `frontend`:
```bash
# Backend configuration
cp backend/.env.example backend/.env

# Frontend configuration
cp frontend/.env.example frontend/.env
```
In `backend/.env`, set your PostgreSQL connection string:
```ini
PORT=4000
NODE_ENV=development
DATABASE_URL="postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/[DB]?schema=public"
DIRECT_URL="postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/[DB]?schema=public"
JWT_SECRET="your-super-secure-jwt-secret-at-least-32-chars-long"
FRONTEND_ORIGIN="http://localhost:5173"
```

### 4. Database Setup & Seed
```bash
# Push Prisma schema to database or run migrations
npm run prisma:push --prefix backend

# Seed the database with demo accounts, menu items, and active orders
npm run seed
```

### 5. Launch the Application
```bash
# Run both Backend (Port 4000) and Frontend (Port 5173) concurrently
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🔑 Demo Accounts

| Role | Email | Password | Access Routes |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@demo.com` | `Admin@123` | `/admin` (Analytics, Menu, Orders), `/kitchen` |
| **Kitchen Staff** | `kitchen@demo.com` | `Kitchen@123` | `/kitchen` (KDS Columns & Actions) |
| **Customer** | *No login needed* | *N/A* | `/` (Menu & Cart), `/order/:id` (Tracking) |

---

## 🧪 Automated Testing
Run the automated test suite with Vitest:
```bash
npm test
```
The test suite covers:
- Server-side price calculation across Half/Full/Regular variants
- Client-submitted prices & totals being discarded
- Zero and out-of-bounds quantities (1–20)
- Out-of-stock items rejected with 409 Conflict
- Unknown variants rejected with 422 Unprocessable Entity
- Dine-in validation (requires table number 1–200)
- Takeaway validation (table number forbidden)
- Duplicate variant lines merged into single line items
- Status FSM valid transitions (`RECEIVED ➔ PREPARING ➔ READY ➔ SERVED`)
- Invalid FSM transitions rejected (skipping or moving backward)
- Kitchen and Admin role authorization guards
- Asia/Kolkata IST business day midnight-to-midnight revenue bounds

---

## 🛠️ Main Design Decisions
1. **Integer Paise Everywhere:** Storing monetary values as integers (paise) avoids JavaScript floating-point arithmetic errors (`0.1 + 0.2 !== 0.3`). The UI formats values as `₹` with tabular digits.
2. **Server-Sent Events over WebSockets:** SSE is unidirectional, natively reconnects via browser `EventSource`, traverses enterprise proxies without WebSocket upgrade issues, and handles keep-alive heartbeats cleanly.
3. **Pure Domain Separation:** Critical calculations (`calcOrderTotal`, `canTransition`, `dayRangeIST`) are isolated into pure functions with zero database or framework coupling, allowing 100% deterministic unit testing.
4. **Idempotency & Anti-Duplicate Protection:** Orders support unique idempotency keys to protect against network retries and double-clicks.

---

## 🔮 What's Next (With More Time)
- Redis Pub/Sub backend adapter for horizontally scaled multi-instance SSE
- Thermal POS printer integration (ESC/POS protocol)
- Dynamic table QR code generation for automatic table detection
- Integrated Razorpay / Stripe webhook payment processing

---

## 🤖 AI Tools Used
- **Antigravity (Google DeepMind):** Full-stack architecture, code scaffolding, database modeling, responsive UI design system, automated tests, and verification.
