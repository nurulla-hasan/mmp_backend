# Mouza Map Pro Backend API

A high-performance, production-ready RESTful API backend for **Mouza Map Pro** — Bangladesh's premier digital land surveying, mapping, and surveyor discovery platform.

[Live Product](https://mouzamappro.com/) · [Developer Portfolio](https://nurulla-hasan-portfolio-pink.vercel.app/)

> **Status:** Version 2 is under active development. This repository contains the Express 5 + TypeScript + Prisma backend.

---

## 🛠️ Tech Stack & Requirements

- **Runtime:** Node.js 22+ (ESM only)
- **Framework:** Express 5
- **Language:** TypeScript 5 (strict mode)
- **Database & ORM:** PostgreSQL 17 + Prisma 7 (Modular multi-file schema)
- **Caching & OTP:** Redis 7
- **Media & File Storage:** Cloudinary
- **Email Service:** Nodemailer (SMTP OTP & notifications)
- **Validation:** Zod 4
- **Logging:** Pino & Pino-HTTP (with automatic token/credential redaction)
- **Testing:** Vitest

---

## 🚀 Local Setup & Development

### 1. Prerequisites
Ensure you have **Node.js 22+**, **PostgreSQL 17**, and **Redis** installed locally or running via Docker.

### 2. Environment Configuration
Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Fill in your database URL, JWT secrets, Redis URL, Cloudinary credentials, and SMTP configuration.

### 3. Install Dependencies & Generate Prisma Client
```bash
npm install
npm run postinstall   # Generates Prisma client from multi-file schema
```

### 4. Run Migrations & Start Server
```bash
npm run db:migrate -- --name init   # Run Prisma migrations
npm run dev                         # Starts development server with hot-reload (http://localhost:5000)
```

---

## 📦 Quality & Maintenance Commands

```bash
npm run dev         # Start development server (tsx watch src/server.ts)
npm run build       # Generate Prisma client + tsup bundle to /dist
npm run start       # Run production bundle (node dist/server.js)
npm run check       # Run typecheck + build (CI gate)
npm run typecheck   # Typecheck codebase (tsc --noEmit)
npm run test        # Run unit & integration tests with Vitest
npm run lint:fix    # Auto-format & lint with Biome
npm run db:format   # Format all Prisma schema files
npm run db:migrate  # Run database migration in development
npm run db:deploy   # Apply migrations in production
```

---

## 🗺️ Feature Modules & API Endpoints

All API endpoints are prefixed with `/api/v1`:

| Route Prefix | Module | Description | Access |
|---|---|---|---|
| `/health` | Health | Server liveness (`/health/live`) and DB readiness (`/health/ready`) | Public |
| `/api/v1/auth` | Auth | Register with Redis OTP, Email Verification, Login, Token Refresh, Google OAuth, Forgot/Reset Password, `/auth/me` | Public / Auth |
| `/api/v1/users` | Users | User management, profile update, avatar upload to Cloudinary, role & status management | Auth / Admin |
| `/api/v1/services` | Services | Standard surveying service categories (Land Measurement, Digital Map Tracing, Mouza Sheet, etc.) | Public / Admin |
| `/api/v1/districts` | Districts | Bangladesh administrative divisions and districts data | Public / Admin |
| `/api/v1/surveyors` | Surveyor Profile | Surveyor directory search, filtering by district/service, public profile, verification approval | Public / Admin |
| `/api/v1/surveyor/services` | Surveyor Services | Surveyor-specific custom pricing, offered services, and coverage area configuration | Surveyor |
| `/api/v1/calculations` | Calculations | Cloud sync for land measurement sessions, plot geometry, scaling, and plot division history | Auth (User) |
| `/api/v1/reviews` | Reviews | Client reviews & ratings for surveyors with admin moderation workflow | Public / Auth / Admin |
| `/api/v1/plans` | Plans | Subscription plans (Monthly, 6 Months, Yearly Pro), auto-grant Pro toggle (`AUTO_PRO_ON_REGISTER`) | Public / Admin |
| `/api/v1/subscribers` | Subscriptions | Manual checkout via bKash/Nagad/Rocket, TrxID submission, validity stacking, approval/rejection, transaction logs | Auth / Admin |
| `/api/v1/broadcasts` | Broadcasts | Platform-wide announcements (Info, Warning, Promo, Maintenance) with session dismiss tracking | Public / Admin |
| `/api/v1/admin/dashboard` | Admin Dashboard | Key platform metrics: active subscribers, revenue, pending verifications, user growth stats | Admin |

---

## 🗄️ Database Architecture (Prisma Multi-File Schemas)

Prisma schemas are organized in `prisma/schema/*.prisma`:

- `schema.prisma` — Datasource & generator configuration
- `enums.prisma` — Enums: `UserRole`, `AccountStatus`, `AuthProvider`, `SubscriptionStatus`, `BroadcastType`, `VerificationStatus`, `ReviewStatus`, `BillingCycle`
- `user.prisma` — User accounts, auth provider details, `isSubscribed` flag
- `surveyor-profile.prisma` — Professional surveyor profile, experience, verification credentials, ratings
- `surveyor-service.prisma` — Custom pricing per offered service
- `surveyor-review.prisma` — Client feedback and ratings (1–5 stars)
- `service.prisma` & `service-area.prisma` — Surveying categories and service area mappings
- `calculation.prisma` & `plot.prisma` — Cloud-saved land measurement sessions, plot points, and scale data
- `plan.prisma` — Subscription packages, pricing, duration, tool permissions, and feature lists
- `subscription.prisma` — Subscriber records, active/pending/expired status, payment method, TrxID, validity periods
- `broadcast.prisma` — System announcements and alerts
- `system-setting.prisma` — Dynamic platform settings (bKash/Nagad manual payment numbers, Auto Pro on registration toggle, etc.)

---

## 💎 Subscription & Validity Stacking Rules

1. **Validity Stacking (Accumulated Duration)**: When an active subscriber renews or upgrades their subscription, their remaining active days are preserved and the new duration is added on top of their existing `endDate` ($baseDate = currentActiveSub.endDate$).
2. **Single Active Plan**: Older active subscription records are transitioned to `EXPIRED` status when a new plan is activated.
3. **Realtime Administration**: `/subscribers` returns unique subscribers for user management, while `history=true` returns the complete chronological transaction history log.

---

## 🔒 Roles & Access Control

- **`USER`**: Access to free land tools, profile management, personal plot calculation history, and manual checkout.
- **`SURVEYOR`**: Professional profile management, service pricing, and surveyor tools.
- **`ADMIN` / `SUPER_ADMIN`**: Full platform management, user/surveyor approval, subscription verification, plan configuration, broadcast publishing, and metric analytics.

---

## 📄 License & Maintainer

Maintained by the **Mouza Map Pro Engineering Team**.
All rights reserved © 2026 Mouza Map Pro.
