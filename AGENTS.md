# Mouza Map Pro Backend

## Quick Start

```bash
npm run dev         # http://localhost:5000 (tsx watch src/server.ts)
npm run build       # prisma generate + tsup bundle
npm run test        # vitest
npm run check       # typecheck + build
npm run typecheck   # tsc --noEmit
npm run lint:fix    # Biome check --write (auto-fix)
```

**Stack:** Node.js 22+, Express 5, TypeScript 5 (strict, ESM), Prisma 7 + PostgreSQL 17 (Prisma multi-file schema), Redis 7 (OTP & caching), Zod 4, Pino HTTP logger, Cloudinary (avatars & documents), Nodemailer (SMTP OTP/notifications), Vitest.

---

## Architecture

### Middleware Pipeline (Order Matters)

1. `requestContext` — Pino-HTTP logger & request ID (`x-request-id` header or UUID)
2. `helmet()` — Security HTTP headers
3. `cors()` — Origin whitelist from `CORS_ORIGINS` env (comma-separated, credential support)
4. `compression()` — Gzip compression
5. `cookieParser()` — Parse incoming cookies
6. `express.json({ limit: '10mb' })` — JSON body parser (supports map uploads & geometry payloads)
7. `express.urlencoded({ extended: true, limit: '10mb' })` — URL-encoded parser
8. `rateLimit()` — Global IP rate limiter
9. Route handlers → `notFound` (404) → `errorHandler` (global centralized error handler)

---

### Module Structure

Every feature module in `src/modules/<feature>/` follows a clean, single-responsibility structure:

```
src/modules/<feature>/
├── <feature>.controller.ts   # HTTP layer: extracts req params/body/query, invokes service, calls sendResponse
├── <feature>.routes.ts       # Express router: mounts endpoints with auth() and validate(schema) middlewares
├── <feature>.service.ts      # Core business logic: database queries (Prisma), transactions, error throws
├── <feature>.validation.ts   # Zod validation schemas for body, query, params
└── <feature>.repository.ts   # Specialized query abstractions (optional)
```

---

### Feature Modules & Route Mounting

All API endpoints are mounted under `/api/v1` in `src/routes/index.ts`:

| Route Prefix | Router | Key Responsibilities |
|---|---|---|
| `/` | `src/app.ts` | Server root & health check welcome message |
| `/health` | `healthRouter` | Server liveness (`/health/live`) & database readiness (`/health/ready`) |
| `/api/v1/auth` | `authRouter` | Credential registration with Redis OTP, Email verification, Login, Token refresh, Google OAuth, Password recovery (`forgot`/`reset`), Current user profile (`/auth/me`) |
| `/api/v1/users` | `userRouter` | User management, profile editing, avatar upload (Cloudinary), role assignment (`USER`, `SURVEYOR`, `ADMIN`, `SUPER_ADMIN`), account status toggle (`ACTIVE`, `BLOCKED`, `SUSPENDED`) |
| `/api/v1/services` | `serviceRouter` | Standard land surveying service categories (Land Measurement, Digital Map Tracing, Mouza Sheet Preparation, Mutation assistance, etc.) |
| `/api/v1/districts` | `districtRouter` | Bangladesh administrative divisions and districts data for surveyor coverage |
| `/api/v1/surveyors` & `/api/v1/surveyor` | `surveyorProfileRouter` | Public surveyor directory, search/filtering by district/service, surveyor registration, public profile page, admin verification request approval/rejection |
| `/api/v1/surveyor/services` | `surveyorServiceRouter` | Surveyor-specific offered services, custom starting pricing, service area configuration |
| `/api/v1/calculations` | `calculationRouter` | Cloud storage & sync for user plot calculations, land measurement sessions, geometry data, plot splitting records |
| `/api/v1/reviews` | `reviewRouter` | Public ratings and client reviews for surveyors with admin moderation & approval workflow |
| `/api/v1/plans` | `planRouter` | Subscription plan management (Monthly Pro, 6 Months Pro, Yearly Pro), features/limits config, auto-grant Pro on registration toggle (`AUTO_PRO_ON_REGISTER`) |
| `/api/v1/subscribers` & `/api/v1/subscriptions` | `subscriptionRouter` | Manual bKash/Nagad/Rocket payment checkout, TrxID submission, payment numbers management, admin verification & approval, cumulative validity extension (Validity Stacking), unique subscribers list & complete transaction history logs |
| `/api/v1/broadcasts` & `/api/v1/broadcast` | `broadcastRouter` | Platform-wide broadcast announcements (Info, Warning, Promo, Maintenance) with audience targeting and session dismiss tracking |
| `/api/v1/admin/dashboard` | `adminDashboardRouter` | Admin metrics: total users, active subscribers, revenue, pending payments, surveyor verifications, system growth charts, recent activity log |

---

## Database Architecture (Prisma Multi-File Schema)

Prisma schemas are modularized in `prisma/schema/*.prisma`:

- **`schema.prisma`** — Datasource (`postgresql`), generator (`prisma-client-js`), preview features.
- **`enums.prisma`** — Global enums (`UserRole`, `AccountStatus`, `AuthProvider`, `SubscriptionStatus`, `BroadcastType`, `VerificationStatus`, `ReviewStatus`, `BillingCycle`).
- **`user.prisma`** — Core `User` model, authentication tokens, profile details, `isSubscribed` flag.
- **`surveyor-profile.prisma`** — `SurveyorProfile` model, bio, experience years, NID/Certificates verification status, rating stats.
- **`surveyor-service.prisma`** — `SurveyorService` model, custom pricing per service.
- **`surveyor-review.prisma`** — `Review` model, ratings (1-5), client feedback, moderation status.
- **`service.prisma`** & **`service-area.prisma`** — Service categories & coverage area relations.
- **`calculation.prisma`** & **`plot.prisma`** — User land measurement records, plots, scale settings, geo data.
- **`plan.prisma`** — `Plan` model, pricing, original price, duration in days, billing cycle, tool access list, feature bullet points, sort order.
- **`subscription.prisma`** — `Subscription` model, active/pending/expired status, start & end dates, payment method, transaction ID, sender phone, amount paid, admin notes.
- **`broadcast.prisma`** — `Broadcast` announcement model, type, message, active status.
- **`system-setting.prisma`** — Key-value system settings (`MANUAL_PAYMENT_BKASH`, `MANUAL_PAYMENT_NAGAD`, `AUTO_PRO_ON_REGISTER`, `AUTO_PRO_PLAN_ID`, etc.).

---

## Key Conventions

### 1. Error Handling
- Throw `AppError(status, message, code?, details?)` from `src/utils/app-error.ts`.
- Zod validation errors are automatically intercepted and formatted into 422 `VALIDATION_ERROR` with path-specific details.
- Always use `asyncHandler` in route handlers to forward unhandled rejections to `errorHandler`.
- Never use `try/catch` in controllers simply to send error responses — let `AppError` bubble up.

### 2. Standard Response Format
```ts
// Success Response:
sendResponse(res, {
  statusCode: httpStatus.OK, // or 201 CREATED
  success: true,
  message: "Operation completed successfully.",
  data: resultData,
  meta: paginationMeta, // { page, limit, total, totalPages }
});

// Centralized Error Response:
{
  success: false,
  message: "Error message description",
  error: {
    code: "NOT_FOUND",
    details: [...]
  },
  stack: process.env.NODE_ENV === "development" ? "..." : undefined
}
```

### 3. Authentication & Authorization
- Import `auth` middleware from `src/middlewares/auth.ts`.
- Token extraction order: Cookie `accessToken` > `Authorization: Bearer <token>` > Header `token`.
- Roles supported: `USER`, `SURVEYOR`, `ADMIN`, `SUPER_ADMIN`.
```ts
router.get("/my-subscription", auth(), subscriptionController.getMySubscription);
router.get("/subscribers", auth("ADMIN", "SUPER_ADMIN"), subscriptionController.getAllSubscribers);
router.patch("/:id/approve", auth("ADMIN"), validate(approveSubscriptionSchema), subscriptionController.approveSubscription);
```
- Decoded token attaches to `req.user: { userId: string, role: string, email: string }`.

### 4. Validation
- Use `validate(schema)` middleware with Zod schemas in `src/middlewares/validate.ts`.
- Schemas validate `body`, `query`, or `params` as defined in `<feature>.validation.ts`.

### 5. Subscription & Validity Stacking Rules
- **Accumulated Validity (Validity Stacking)**: When an active user purchases or is granted a new plan, remaining active days are not forfeited. New duration is added to existing `endDate` ($baseDate = currentActiveSub.endDate$).
- **Single Active Subscription**: Older active records are transitioned to `EXPIRED` upon activating the upgraded subscription.
- **Admin Realtime**: `/subscribers` supports `history=true` for transaction logs and default deduplication (1 row per user) for the active subscriber roster.

---

## Important Environment Variables

| Variable | Description |
|---|---|
| `PORT` | API server port (default: `5000`) |
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | Cryptographic JWT signing keys |
| `REDIS_URL` | Redis instance URL for OTP storage |
| `CORS_ORIGINS` | Comma-separated allowed frontend origins |
| `CLOUDINARY_*` | Cloudinary credentials for avatar & document uploads |
| `SMTP_*` | SMTP credentials for email OTP & notifications |

