Backend analysis

Current implementation snapshot (2026-09-22)
- The backend is an ES-module Express REST API using Prisma 6 and PostgreSQL. It listens on PORT or 6000 by default.
- /health is public; all /api routes use the optional API_KEY / x-api-key middleware. CORS allows localhost:3000 and FRONTEND_URL, JSON is limited to 1 MB, and rate limiting is 300 requests per 15 minutes.
- In addition to CRUD resources, app.js mounts /api/speech, /api/voice-assistant/process, and /api/analyze-stored-audio.
- The voice assistant accepts multipart audio, transcribes Arabic with Groq Whisper, persists a transcription JSON file, then analyzes it with Gemini using model fallback and retries. Results are saved under uploads/ and results/.
- The stored-audio endpoint accepts a multipart transcription JSON file and analyzes its text with Gemini.
- The backend now uses generic CRUD/pagination helpers, strict UUID/body validation, standard { data, pagination } responses, and centralized Prisma error mapping.
- Property updates transactionally manage apartment IDs and employee assignments. Material normalization calculates remainingAmount and defaults paymentDate one month after arriveDate.
- Supplier debt/details use database views v_suppliers_with_debt and v_supplier_materials; the seed workflow creates these views and material indexes.
- Required runtime configuration is DATABASE_URL. Optional feature settings are PORT, FRONTEND_URL, API_KEY, GROQ_API_KEY, and GEMINI_API_KEY.

Project overview
- This service is a Prisma + PostgreSQL REST API for a real-estate and construction management system.
- The application is bootstrapped from Express and exposes all resource routes under /api.
- The API includes the main modules: employees, suppliers, properties, materials, expenses, expense categories, apartments, and audit logs.
- A health endpoint is available at /health.
- The app enforces request validation and an API key header for protected routes.

Core entry files
- src/app.js
  - configures Express, CORS, request logging, rate limiting, JSON parsing, and route mounting.
  - uses /api as the route prefix and applies requireApiKey middleware globally to all /api requests.
  - registers resource routers for employees, suppliers, properties, materials, expenses, expense categories, apartments, and audit logs.
  - ends with 404 and global error handlers.
- src/db.js
  - exports the Prisma client instance for database access.
- src/index.js
  - starts the HTTP server.
- src/middleware/authMiddleware.js
  - validates the x-api-key header against API_KEY when configured.
- src/middleware/validate.js
  - central validation helpers used by route handlers to check IDs and required fields.

Route structure
- /health
- /api/employees
  - GET list with optional query params: page, limit, sort_by, search
  - GET /:id
  - POST create
  - PUT /:id update
  - DELETE /:id delete
- /api/suppliers
  - GET list with query params: page, limit, sort_by, search, has_debt
  - GET /total_debt
  - GET /details or supplier detail data
  - GET /:id
  - GET /:id/total_debt
  - POST create
  - PUT /:id update
  - DELETE /:id delete
- /api/properties
  - GET list with filters: status, search, min_area, max_area, started_after, ended_before, sort_by
  - GET /:id
  - GET /:id/employees
  - POST create
  - PUT /:id update
  - DELETE /:id delete
- /api/materials
  - CRUD operations for supplier/property material records
- /api/expenses
  - CRUD plus expense-date filtering and daily expense ordering logic
- /api/expense_categories
  - CRUD for expense categories
- /api/apartments
  - CRUD for apartment records, including property assignment
- /api/audit-logs
  - read-only audit log browsing

Database design
The Prisma schema in prisma/schema.prisma defines the current models and relations.

Models
- Employee
  - id: UUID primary key
  - name, salary, experienceYears, age, phone
  - updatedAt
  - has many property assignments via PropertyEmployee
- Supplier
  - id, name, updatedAt
  - one-to-many relation to Material
- Property
  - id, name, status, address, startedIn, endedIn, floorsNumber, area, updatedAt
  - one-to-many to Apartment and Material
  - many-to-many relationship with Employee through PropertyEmployee
- PropertyEmployee
  - join table containing propertyId, employeeId, role
  - cascade delete and composite primary key
- Apartment
  - id, propertyId, floor, number
  - unique per property + floor + number
- Material
  - id, name, totalPrice, paidPrice, status, quantity, arriveDate, remainingAmount, paymentDate
  - supplierId, propertyId
  - updatedAt
  - status enum is paid or as_dept
- ExpenseCategory
  - id, name unique
- DailyExpense
  - sender, amount, expenseCategoryId, expenseDate, paidTo, paymentMethod, receiptNumber, receiptImageUrl, approvedBy, notes, createdAt
- AuditLog
  - tableName, actionType, oldData, newData, recordId, createdAt

Enums
- PropertyStatus: completed, under_construction
- MaterialStatus: paid, as_dept
- PaymentMethod: CASH, credit_card, BANK_TRANSFER, CHECK, PETTY_CASH
- AuditAction: INSERT, UPDATE, DELETE

Important implementation details
- All IDs are UUIDs stored in PostgreSQL.
- Prisma maps camelCase fields to snake_case database columns via @map.
- Data types include Decimal for money values and Date for date-only values.
- property and material relations use cascade or set-null behavior when parent records are deleted.
- Audit and updated_at behavior are managed via SQL triggers in src/db/migrations/002_audit_triggers.sql and supporting migration files.
- The materials table is indexed on supplierId + status and supplierId + status + remainingAmount for debt queries.

Business logic highlights
- Property listing supports status, search, date and area filters, with sort_by validation.
- Property updates can change both apartment associations and employee assignments in a single transaction.
- Employee and supplier updates share the generic CRUD controller pattern.
- Validation is enforced for required fields and ID formats.
- Error handling converts Prisma constraint errors into client-friendly 400/409 responses.

Current codebase state
- The backend has been modernized around Prisma and an API-key-protected REST API.
- The property and employee flows are now strongly tied to nested relation management instead of the older, more basic CRUD-only draft.
- The app is aligned with the frontend’s app-router implementation and expects camelCase request payloads such as startedIn, endedIn, floorsNumber, area, experienceYears, and expenseCategoryId.

Key migration and SQL files
- prisma/migrations/
  - initial schema migration
  - additional migration for null-safe delete relations
- src/db/migrations/
  - 001_views_and_indexes.sql
  - 002_audit_triggers.sql

Main backend dependency stack
- express
- express-rate-limit
- cors
- morgan
- @prisma/client
- prisma
- PostgreSQL database
- dotenv-based environment configuration

Notes
- The backend currently expects a DATABASE_URL in .env and optionally API_KEY in the environment for protected API access.
- The frontend uses NEXT_PUBLIC_API_URL for the base URL, defaulting to http://localhost:8000/api when not set.

