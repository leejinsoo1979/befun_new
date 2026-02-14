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

# Database
npx prisma migrate dev    # Run migrations in development
npx prisma generate       # Regenerate Prisma client (output: src/generated/prisma)
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
- **`lib/three/styles/`** - Panel layout algorithms per style type (grid, slant, pixel, gradient, mosaic)
- **`types/`** - TypeScript type definitions (shelf.ts, order.ts, material.ts, next-auth.d.ts)
- **`generated/prisma/`** - Auto-generated Prisma client (do not edit)

### Key Patterns

**State management**: Zustand stores are decentralized by feature. `useCartStore` uses persist middleware (localStorage). Stores are not combined into a root store.

**3D rendering**: The Scene component (`components/three/Scene.tsx`) is dynamically imported to avoid SSR issues. The Shelf component orchestrates all 3D geometry. Materials are created per-panel with texture loading from `/public/imgs/textures/{textureName}/` (5 textures per color: verticalBase, verticalEdge, horizontalBase, horizontalEdge, backPanel). Dispose materials/textures properly to avoid memory leaks.

**Style system**: Each of the 5 style types has its own panel layout algorithm in `lib/three/styles/`. These calculate panel positions, sizes, and rotations based on shelf dimensions and density.

**Color system**: 4 categories - Classic (C\_ prefix, wood textures), Natural (N\_ prefix, real wood textures), Solid (S\_ prefix, hex colors), EdgeMix (S+N, two-tone). Color-to-texture mappings are in `lib/three/materials.ts`.

**Authentication**: NextAuth 4 with Prisma adapter, JWT strategy. Providers: Google, Kakao, Credentials. Config in `lib/auth.ts`.

**Payment flow**: Design saved to DB with shareCode → Cart (localStorage) → Order creation (POST /api/orders) → TossPayments widget → Confirmation (POST /api/payment/confirm) → Webhook updates.

**Pricing**: Volume-based (₩5/cm³) + color category surcharge + hardware surcharge - 20% discount. Logic in `lib/pricing.ts`.

### API Routes

| Route | Purpose |
|-------|---------|
| `/api/auth/[...nextauth]` | NextAuth handler |
| `/api/designs` | Create design (POST), fetch by code (GET) |
| `/api/orders` | Create order (POST), list user orders (GET) |
| `/api/orders/[id]` | Order detail (GET) |
| `/api/payment/confirm` | TossPayments confirmation |
| `/api/webhook/payment` | Payment webhook |

### Database

PostgreSQL via Prisma. Schema at `prisma/schema.prisma`. Prisma client output is `src/generated/prisma` (configured in generator). `next.config.ts` marks `@prisma/client` and `@auth/prisma-adapter` as server external packages.

### Path Alias

`@/*` maps to `./src/*` (tsconfig.json).

## Conventions

- UI text is Korean (locale: 'ko')
- Currency is KRW (원), formatted with `Intl.NumberFormat('ko-KR')`
- Shelf dimension constraints: width 30-450cm, height 38-228cm, depth 24-42cm
- Row heights are fixed options: 18, 32, or 38cm
- 3D lighting uses physically-correct intensities (intensity × π)
- Heavy 3D computations should be memoized with `useMemo`
