# Smart Expense Tracker

A mobile-friendly personal finance tracker for students and young professionals. Users register, log in, record income and expenses in EUR, set monthly category budgets, and see their spending on a dashboard with charts.

## Features (v1)

- Email and password registration, login and logout (Auth.js v5, bcrypt-hashed passwords, JWT session in an httpOnly cookie)
- Rate limiting on login (5 attempts per 15 minutes per IP and email) and on registration (5 per hour per IP)
- Add, edit and delete income and expenses with type, amount, date, category, and optional description, note, merchant and payment method
- Default categories created for each new user
  - Expense: Food, Transport, Housing, Entertainment, Health, Education, Other
  - Income: Salary, Freelance, Scholarship, Gift, Other
- Transactions page with search (description, merchant, note), filters (type, category, date range), sorting and pagination
- Dashboard for any month: income, expenses, monthly balance, recent transactions, spending-by-category chart, six-month income vs. expenses chart, budget progress
- Monthly category budgets with progress bars and alerts at 80% and 100% (shown with icons and text, not only color)
- Responsive layout: sidebar on desktop, bottom navigation with an "Add transaction" button on mobile

## Tech stack

Next.js 16 (App Router) · TypeScript (strict) · Tailwind CSS 4 · shadcn/ui-style components on Radix · Lucide icons · Recharts · Prisma 7 with the `pg` driver adapter · PostgreSQL · Zod · Vitest

## Design notes

- **Money** is stored as integer cents (`amountCents Int`). User input like `12,50` or `12.50` is parsed to cents with a regex, never with floating-point maths. The database also enforces positive amounts with `CHECK` constraints.
- **Dates** are calendar dates (PostgreSQL `DATE`). "Today" and the current month use the `Europe/Tallinn` timezone.
- **Data isolation**: every query and server action gets the user id from the server-side session (`requireUserId()`) and filters by it. Updates and deletes use `updateMany`/`deleteMany` with `{ id, userId }`, so another user's id matches nothing. Transactions and budgets reference categories through a composite `(categoryId, userId)` foreign key, so the database rejects links to another user's category. The `proxy.ts` redirect is only a convenience layer.
- **Rate limiting** is in memory, which is suitable for a single Railway instance. Counters reset when the app restarts.

## Environment variables

Copy `.env.example` to `.env` and fill in real values. Never commit `.env`.

| Variable | Description |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string (Railway provides it) |
| `AUTH_SECRET` | Long random string used to sign sessions. Generate with `npx auth secret` or `openssl rand -base64 32` |
| `AUTH_TRUST_HOST` | `true`, needed behind Railway's proxy |

## Scripts

| Command | What it does |
| --- | --- |
| `npm run build` | `prisma generate` and `next build`. Does **not** need a database |
| `npm start` | Starts Next.js on `0.0.0.0` and Railway's `PORT` |
| `npm run db:migrate:deploy` | Applies Prisma migrations (`prisma migrate deploy`) |
| `npm test` | Runs the Vitest unit tests |
| `npm run lint` / `npm run typecheck` | ESLint / TypeScript checks |

## Local development

Requires Node.js 20+ and a PostgreSQL database.

```bash
npm install
cp .env.example .env   # then edit the values
npm run db:migrate:deploy
npm run dev
```

## Database migrations

Migrations live in `prisma/migrations`. The initial migration was generated from the schema with `prisma migrate diff`, plus hand-added `CHECK` constraints. After changing `prisma/schema.prisma`, create a new migration with `npx prisma migrate dev --name <change>` against a development database.

## Deploying to Railway

Railway configuration is in `railway.json`:

- **Build:** `npm run build`
- **Pre-deploy:** `npm run db:migrate:deploy` runs migrations before each release starts
- **Start:** `npm start`, which listens on `0.0.0.0:$PORT`
- **Health check:** `GET /api/health` returns `{"status":"ok"}`

Steps:

1. Create a Railway project and add a **PostgreSQL** service.
2. Add a service from this GitHub repository (deploys from `main`).
3. In the app service variables, set `DATABASE_URL` to `${{Postgres.DATABASE_URL}}`, and set `AUTH_SECRET` (a new random value) and `AUTH_TRUST_HOST=true`.
4. Under Settings → Networking, generate a Railway domain.
5. Deploy. Check `https://<your-domain>/api/health`, then register and test on desktop and phone.

## Not in v1

Google sign-in, email verification and password reset, Estonian UI, USD, starting balances, budget rollover, recurring reminders, demo mode, custom categories, CSV export, account deletion and dark mode are planned for later versions.
