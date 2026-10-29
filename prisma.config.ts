import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Read lazily so `prisma generate` works at build time without a database.
    url: process.env.DATABASE_URL ?? "",
  },
});
