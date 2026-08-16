# MMP Backend

## Quick Start

```bash
npm run dev         # http://localhost:5000
npm run build       # prisma generate + tsup bundle
npm run test        # vitest
npm run check       # lint + typecheck + test + build (CI gate)
npm run typecheck   # tsc --noEmit
npm run lint:fix    # Biome check --write (auto-fix)
```

**Stack:** Express 5, TypeScript (strict), Prisma 7 + PostgreSQL 17, Zod 4, pino logging, Vitest.

## Architecture

### Middleware Pipeline (order matters)

1. `requestContext` — pino-http logger, request ID (x-request-id header or UUID)
2. `helmet()` — security headers
3. `cors()` — origin whitelist from `CORS_ORIGINS` env (comma-separated)
4. `compression()` — gzip
5. `cookieParser()` — parse cookies
6. `express.json({ limit: '1mb' })` — body parsing
7. `express.urlencoded({ extended: true, limit: '1mb' })`
8. `rateLimit()` — rate limiting on all routes
9. Route handlers → `notFound` (404) → `errorHandler` (global)

### Module Structure

```
src/modules/<feature>/
├── <feature>.controller.ts   # HTTP concerns only (req/res)
├── <feature>.routes.ts       # Router with middleware wiring
├── <feature>.service.ts      # Business logic
├── <feature>.validation.ts   # Zod schemas
└── <feature>.repository.ts   # Prisma queries (optional)
```

Mount feature routers in `src/routes/index.ts`:
```ts
apiRouter.use('/users', userRouter);
```

### Route Mounting

| Prefix | File | Description |
|---|---|---|
| `/` | `src/app.ts` | Welcome health check |
| `/health` | `src/modules/health/health.routes.ts` | Liveness/readiness |
| `/api/v1` | `src/routes/index.ts` | All feature routes |

## Key Conventions

### Error Handling
- Throw `AppError` with status code, message, code, and optional details.
- Zod validation errors → automatic 422 `VALIDATION_ERROR` with field-level issues.
- Use `asyncHandler` wrapper for async route handlers to forward errors.
- Never catch errors in controllers — let them propagate to `errorHandler`.

### Response Format
```ts
// Success: sendResponse(res, { message, data?, meta? })
{ success: true, message: "...", data?: ..., meta?: ... }

// Error (auto-handled):
{ success: false, error: { code: "...", message: "...", details?: ... }, requestId: "..." }
```

### Auth
- Import `auth` middleware from `src/middlewares/auth.ts`.
- Token priority: cookie > Authorization header > raw header.
- Roles: `USER_ROLES.USER`, `USER_ROLES.SURVEYOR`, `USER_ROLES.ADMIN`.
```ts
router.get('/profile', auth(), controller);                     // any authenticated user
router.get('/jobs', auth(USER_ROLES.SURVEYOR, USER_ROLES.ADMIN), controller); // role-restricted
router.delete('/users/:id', auth(USER_ROLES.ADMIN), controller); // admin-only
```
- `req.user` available after auth middleware: `{ userId: string, role: UserRole }`.

### Validation
- Use `validateRequest(schema, 'body'|'params'|'query')` middleware with Zod schemas.
- Validated body replaces `req.body`; validated params/query merge into `req.params`/`req.query`.

### Logging
- Use `req.log` (pino instance per request) inside route handlers.
- Use `logger` from `src/lib/logger.ts` outside request context.
- Auth headers, cookies, and set-cookie are **automatically redacted** from logs.

### Configuration
- All env vars defined in `src/config/env.ts` with Zod schema validation.
- `CORS_ORIGINS` is comma-separated string in env, parsed to array at startup.
- Default JWT secret is development-only; production requires a unique secret (validated at startup).

### Database
- Prisma client generated to `../generated/prisma` (not `node_modules/.prisma`).
- Connection via `@prisma/adapter-pg` + `pg` driver.
- Schema file: `prisma/schema.prisma`.
- Migrations: `npm run db:migrate -- --name <name>` for dev, `npm run db:deploy` for production.
- The schema is intentionally model-free until business schema is finalized.

## Important Notes

- **Express 5** — not Express 4. API differences exist (e.g., route param handling, error handling).
- **ESM only** — `"type": "module"` in package.json. All imports must include `.js` extensions.
- **Node.js 22+** required.
- See `README.md` for detailed local setup instructions.
- See `Dockerfile` for multi-stage production build.
- See `docker-compose.yml` for PostgreSQL service (Node app runs separately with `npm run dev`).
