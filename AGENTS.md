# Repository Guidelines

## Project Structure & Module Organization

Befun V2 is a Korean-language storefront and 3D shelf configurator built with Next.js 16, React 19, TypeScript, and PostgreSQL.

- `src/app/`: App Router pages and API route handlers.
- `src/components/`: `three/` for React Three Fiber scenes, `ui/` for configurator controls, and `common/` for shared layouts.
- `src/stores/`: feature-specific Zustand stores, named `use*Store.ts`.
- `src/lib/`: authentication, payments, pricing, and sharing; `three/styles/` contains shelf layout algorithms.
- `src/types/`: shared TypeScript definitions.
- `prisma/schema.prisma`: database models. `src/generated/prisma/` is generated; never edit it manually.
- `public/imgs/`: product images, color swatches, and textures.

Read `CLAUDE.md` for detailed architecture and furniture constraints.

## Build, Test, and Development Commands

- `npm ci`: install locked dependencies; the postinstall hook generates Prisma clients.
- `npm run dev`: start local development at `http://localhost:3000`.
- `npm run build`: create a production build.
- `npm start`: serve the production build.
- `npm run lint`: run ESLint with Next.js Core Web Vitals and TypeScript rules.
- `npx prisma generate`: regenerate the client after schema changes.
- `npx prisma migrate dev --name <description>`: create/apply migrations against your development database.

## Coding Style & Naming Conventions

Use strict TypeScript, two-space indentation, semicolons, and the surrounding file’s quote style. Prefer `@/` imports for modules under `src/`. Name components in PascalCase, functions and variables in camelCase, and stores `useShelfStore`-style. Follow Next.js `page.tsx`, `layout.tsx`, and `route.ts` conventions. No dedicated formatter is configured.

Preserve Korean UI copy and KRW formatting. Keep Zustand state organized by feature and dispose of Three.js materials/textures when replaced.

## Testing Guidelines

No automated test framework, test script, or coverage threshold is configured. Run lint and build before submitting. Manually verify affected configurator controls, rendered geometry, pricing, sharing, and cart persistence. For order/payment changes, exercise the flow using development credentials. Document verification steps and results in the PR.

## Commit & Pull Request Guidelines

This checkout lacks Git metadata, so historical commit conventions cannot be verified. Use concise, imperative subjects, such as `Fix shelf dimension clamping`. Keep changes focused. PRs should explain behavior changes, link relevant issues, list validation results, and include screenshots for UI/3D changes. Highlight schema and configuration changes.

## Security & Configuration

Keep secrets in ignored `.env` files. Configure `DATABASE_URL`, `NEXTAUTH_SECRET`, Google/Kakao OAuth credentials, and TossPayments secrets as needed. Never commit credentials or expose server secrets through client code.

## Multi-Agent Collaboration

Several agents (Claude ×2 and Codex for development, a separate Codex for web analysis) work in this checkout. Conversations are not shared, so coordinate through `docs/`:

- `docs/web-analysis.md`: analysis results, reference URLs, per-screen requirements, task list. Owned by the analysis agent; developers only read it.
- `docs/analysis-questions.md`: developers append questions; the analysis agent answers.
- `docs/team-tasks.md`: task ownership, file locks, status, and completion notes.

Rules: read `AGENTS.md`, `CLAUDE.md`, and the analysis docs before starting. Register your task and the files you will modify in `team-tasks.md` first, and do not edit files locked by another agent. Never revert or overwrite another agent's changes. When done, record changes, lint/build results, and open questions, then release your locks.
