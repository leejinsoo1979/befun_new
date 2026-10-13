# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Befun V2 is a Korean-language e-commerce application for customizable 3D furniture (shelving units). Users design shelves in a 3D configurator, save/share designs, and purchase through TossPayments integration.

## Commands

```bash
npm run dev       # Start dev server (localhost:3000)
npm run build     # Production build
npm run start     # Run production server
npm run lint      # ESLint

# No test framework is configured.

# Database
npx prisma migrate dev    # Run migrations in development
npx prisma generate       # Regenerate Prisma client (output: src/generated/prisma; also runs on npm install via postinstall)
npx prisma studio         # Database GUI
```

## Architecture

**Stack**: Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS 4 + PostgreSQL (Prisma 7) + Zustand + React Three Fiber

### Source Layout (`src/`)

- **`app/`** - Next.js App Router pages and API routes
- **`components/three/`** - React Three Fiber 3D components (Scene, Shelf, Panel, Door, Drawer, Background)
- **`components/ui/`** - Configurator control panels (StyleSelector, ColorPicker, DimensionPanel, etc.)
- **`components/common/`** - Layout components (ShopLayout wraps Header+Footer, Providers wraps SessionProvider)
- **`stores/`** - Zustand stores (useShelfStore, useMaterialStore, useHardwareStore, useCartStore, useUIStore, useOrderStore)
- **`lib/`** - Business logic and utilities
- **`lib/three/`** - 3D utilities: materials system (`materials.ts`), hardware placement (`hardware.ts`)
- **`lib/three/styles/`** - Panel layout algorithms per style type (grid, slant, pixel, gradient, pattern, mosaic)
- **`types/`** - TypeScript type definitions (shelf.ts, order.ts, material.ts, next-auth.d.ts)
- **`generated/prisma/`** - Auto-generated Prisma client (do not edit)

### Key Patterns

**State management**: Zustand stores are decentralized by feature. `useCartStore` uses persist middleware (localStorage). Stores are not combined into a root store.

**3D rendering**: The Scene component (`components/three/Scene.tsx`) is dynamically imported to avoid SSR issues. The Shelf component orchestrates all 3D geometry. Materials are created per-panel with texture loading from `/public/imgs/textures/{textureName}/` (5 textures per color: verticalBase, verticalEdge, horizontalBase, horizontalEdge, backPanel). Dispose materials/textures properly to avoid memory leaks.

**Style system**: Each of the 6 style types (`StyleType` in `types/shelf.ts`) has its own panel layout algorithm in `lib/three/styles/`, ported from the V1 app. These calculate panel positions, sizes, and rotations based on shelf dimensions and density; most styles fall back to `calculateGridPanels` when the shelf is too narrow. The style-to-function dispatch is duplicated in `app/configurator/page.tsx`, `components/three/Shelf.tsx`, `components/three/DimensionOverlay.tsx`, and `components/ui/PriceDisplay.tsx`, and `lib/optimizer/befun/model.ts` (CNC optimizer) — adding a style means updating all five.

**Color system**: 4 categories - Classic (C\_ prefix, wood textures), Natural (N\_ prefix, real wood textures), Solid (S\_ prefix, hex colors), EdgeMix (S+N, two-tone). Color-to-texture mappings are in `lib/three/materials.ts`.

**Authentication**: NextAuth 4 with Prisma adapter, JWT strategy. Providers: Google, Kakao, Credentials. Config in `lib/auth.ts`.

**Payment flow**: Design saved to DB with shareCode (8-char nanoid, `lib/sharing.ts`) → Cart (localStorage) → Order creation (POST /api/orders) → TossPayments widget → Confirmation (POST /api/payment/confirm) → Webhook updates.

**Pricing** (`lib/pricing.ts`): sum of panel volumes × ₩8, +20% for custom colors (solid/edgeMix), rounded to ₩1000, then 20% discount rounded to ₩10. No hardware surcharge.

### API Routes

| Route | Purpose |
|-------|---------|
| `/api/auth/[...nextauth]` | NextAuth handler |
| `/api/designs` | Create design (POST) |
| `/api/designs/[code]` | Fetch design by shareCode (GET) |
| `/api/orders` | Create order (POST), list user orders (GET) |
| `/api/orders/[id]` | Order detail (GET) |
| `/api/payment/confirm` | TossPayments confirmation |
| `/api/webhook/payment` | Payment webhook |

### Database

PostgreSQL via Prisma 7 with the `@prisma/adapter-pg` driver adapter (`lib/db.ts`, global singleton in dev). Schema at `prisma/schema.prisma`; datasource URL comes from `prisma.config.ts` (reads `DATABASE_URL` via dotenv), not the schema. Import the client from `@/generated/prisma/client`. `next.config.ts` marks `@prisma/client` and `@auth/prisma-adapter` as server external packages.

### Environment Variables

No `.env` is committed. Required: `DATABASE_URL`, `NEXTAUTH_SECRET`, `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET`, `KAKAO_CLIENT_ID`/`KAKAO_CLIENT_SECRET`, `TOSS_SECRET_KEY`, `TOSS_WEBHOOK_SECRET`. The configurator renders without them, but DB, auth, and payment routes fail. Optional: `OPTIMIZER_ADMIN_EMAILS` (comma-separated) restricts `/optimizer`; when unset, `/optimizer` is open in development and blocked in production.

### Path Alias

`@/*` maps to `./src/*` (tsconfig.json).

## Conventions

- UI text is Korean (locale: 'ko')
- Currency is KRW (원), formatted with `Intl.NumberFormat('ko-KR')`
- Shelf dimension constraints: width 30-450cm, height 38-228cm (clamped in `useShelfStore`); depth options 24/32/40cm (`DimensionPanel`)
- Row heights: 18, 28, or 38cm (`RowControls`; store default 28). Doors allowed when row height ≥ `MIN_DOOR_HEIGHT` (28 in code, though comments/UI text say 32); drawers require depth ≥40cm and total height ≤150cm
- Code comments are often in Korean and reference V1 source files ("v1 ... 이식") — the V1 logic is the reference behavior
- 3D lighting uses physically-correct intensities (intensity × π)
- Heavy 3D computations should be memoized with `useMemo`

## Multi-Agent Collaboration

This project is worked on by multiple agents. Follow the "Multi-Agent Collaboration" section in `AGENTS.md`: read `docs/web-analysis.md`, register work and file locks in `docs/team-tasks.md` before editing, ask analysis questions in `docs/analysis-questions.md`, and never overwrite other agents' changes.
