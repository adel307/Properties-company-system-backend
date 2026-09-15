# Real Estate & Construction Management API

## Setup

1. Copy `.env.example` to `.env` and set `DATABASE_URL`.
2. Ensure PostgreSQL supplies `uuid_generate_v7()` (or change the Prisma UUID defaults to `uuid()` if using a database without UUID v7 support).
3. Install dependencies: `npm install`.
4. Generate the Prisma client: `npm run prisma:generate`.
5. Create/apply the Prisma migration, then execute `src/db/migrations/001_views_and_indexes.sql` and `002_audit_triggers.sql` against the same database.
6. Start the API: `npm run dev`.

The service exposes `/health` and API resources beneath `/api`. Set `API_KEY` to require an `x-api-key` request header.

Main resources: `employees`, `suppliers`, `properties`, `materials`, `expenses`, `expense_categories`, and `apartments`.
