# IJsvogel Case Management

MVP monorepo for a shared interface between NedCargo and Anidis, managed by IJsvogel.

## Stack
- Web: React + TypeScript
- API: Node + Express + TypeScript
- Database: Supabase PostgreSQL
- Hosting: Railway

## Run (after installing Node.js 20+)
1. Install dependencies: `npm install`
2. API: `npm run dev -w @ijsvogel/api`
3. Web: `npm run dev -w @ijsvogel/web`

## Persistence mode
- Without `DATABASE_URL`: API uses in-memory storage (good for local demo).
- With `DATABASE_URL`: API uses PostgreSQL/Supabase tables from `packages/db/migrations`.

## Supabase setup
1. Set `DATABASE_URL` in `apps/api/.env` (or Railway environment variables).
2. Run one command from repository root: `npm run db:setup`
3. The command executes all SQL migrations and performs a DB health check.
4. Restart API.

## Current status
- Initial implementation scaffolded
- Core data model SQL migration added
- Basic auth/case APIs and Dutch UI shell added
