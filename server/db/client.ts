import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required for database access.");
}

const globalForDb = globalThis as typeof globalThis & {
  __svflixDbClient?: ReturnType<typeof drizzle>;
};

const sql = postgres(connectionString, {
  ssl: "require",
  max: 1,
});

export const db =
  globalForDb.__svflixDbClient ??
  drizzle(sql, {
    schema,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__svflixDbClient = db;
}

export type DbClient = typeof db;
