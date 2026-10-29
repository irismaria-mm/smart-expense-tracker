# Smart Expense Tracker

A web app deployed on Railway, backed by a Railway PostgreSQL database.

## Deployment

- Railway deploys automatically from the `main` branch of this GitHub repository.
- The Railway project and database have not been created yet (Railway account registration is currently unavailable). Do not claim that a deployment has succeeded.

## Database and secrets

- Access the database only through the `DATABASE_URL` environment variable.
- Never hard-code credentials or commit secrets.
- Keep `.env` files out of Git, and provide a `.env.example` with placeholder values when implementing the app.

## Local environment

- Do not set up a local database or start a local development server.

## Workflow

- Before pushing application code, run `npm run build` and fix any build errors.
- After each finished implementation task, commit and push the changes.
