# MMP Backend

Production-oriented Express 5 + TypeScript REST API foundation. The Prisma/PostgreSQL setup is intentionally model-free until the business schema is finalized.

## Requirements

- Node.js 22+
- PostgreSQL 17+ (or Docker)

## Local setup

```bash
cp .env.example .env
npm install
docker compose up -d postgres
npm run dev
```

The server defaults to `http://localhost:5000`. Health endpoints are `GET /health/live` and `GET /health/ready`; feature routes belong under `/api/v1`.

## Quality commands

```bash
npm run check
npm run lint:fix
```

## Adding a module

Create a folder under `src/modules/<feature>` with route, controller, service, validation, and repository files as needed. Export its router and mount it in `src/routes/index.ts`. Keep controllers limited to HTTP concerns and business logic in services.

## Database workflow (after schema design)

Add models to `prisma/schema.prisma`, then run:

```bash
npm run db:format
npm run db:migrate -- --name init
```

Use `npm run db:deploy` in deployments. Never use `migrate dev` in production.

## Protecting routes

Roles: USER, SURVEYOR, and ADMIN.

    router.get('/profile', auth(), controller);
    router.get('/survey-jobs', auth(USER_ROLES.SURVEYOR, USER_ROLES.ADMIN), controller);
    router.delete('/users/:id', auth(USER_ROLES.ADMIN), controller);
