# RestaurantOS — Architecture & Engineering Specification

## 1. System Overview
RestaurantOS is an enterprise-grade full-stack platform designed for modern restaurant ordering, live kitchen operations display (KDS), and management console.

### Key Pillars
- **Zero Client Trust Pricing:** All prices, variants, line items, and final totals are computed strictly server-side using integer paise. Client-sent prices or totals are completely discarded.
- **Strict Status Finite State Machine:** Order status progression is strictly enforced: `RECEIVED` ➔ `PREPARING` ➔ `READY` ➔ `SERVED`. No skipping or backward transitions are permitted.
- **Server-Sent Events (SSE):** Lightweight real-time push mechanism using native HTTP streaming with automatic heartbeat (every 25s), exponential reconnect, and snapshot sync.
- **IST Business Day Revenue:** Day boundaries for financial metrics are strictly aligned with `Asia/Kolkata` (00:00:00 to 23:59:59.999 IST) rather than UTC.

## 2. Directory Structure
```
restaurant-ordering-system/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   ├── src/
│   │   ├── config/        # Environment & system constants
│   │   ├── domain/        # Pure domain logic (calcOrderTotal, statusMachine, dayRangeIST)
│   │   ├── events/        # SSE event bus and broadcast handlers
│   │   ├── middleware/    # Auth, role guard, rate limiting, error handlers
│   │   ├── routes/        # Fastify route controllers (auth, menu, orders, kitchen, admin, events)
│   │   └── server.ts      # Fastify server initialization
│   ├── tests/             # Vitest automated test suite
│   ├── tsconfig.json
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/    # Reusable UI design system primitives (Button, Card, Badge, Modal, etc.)
│   │   ├── hooks/         # Custom hooks (useEventSource, useCart, useAuth)
│   │   ├── lib/           # API client, currency formatters, date utilities
│   │   ├── pages/         # Customer Menu, Cart, Order Tracker, Kitchen KDS, Admin Console, Login
│   │   ├── types/         # Shared TypeScript interfaces
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── index.html
│   ├── tailwind.config.js
│   ├── vite.config.ts
│   └── package.json
├── docs/
├── .github/workflows/ci.yml
├── .env.example
├── README.md
└── package.json
```
