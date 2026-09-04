import fs from "fs";
import path from "path";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";

let initialized = false;

export function getDbUrl(): string | undefined {
  return process.env.DATABASE_URL;
}

export function createDb() {
  const url = getDbUrl();
  if (!url) return undefined;

  const sql = postgres(url, {
    ssl: process.env.DB_SSL === "true" ? "require" : undefined,
  });
  const db = drizzle(sql);
  return { db, sql };
}

export async function runMigrationsIfNeeded(sql: postgres.Sql) {
  if (initialized) return;
  initialized = true;
  try {
    const migrationPath = path.resolve(process.cwd(), "migrations", "0000_perpetual_raider.sql");
    const sqlText = await fs.promises.readFile(migrationPath, "utf-8");
    const statements = sqlText.split("--> statement-breakpoint");
    for (const chunk of statements) {
      const stmt = chunk.trim();
      if (!stmt) continue;
      // Wrap each statement to avoid errors on existing tables
      try {
        // Replace plain CREATE TABLE with CREATE TABLE IF NOT EXISTS
        const safeStmt = stmt.replace(/CREATE TABLE\s+"/g, "CREATE TABLE IF NOT EXISTS \"");
        await sql.unsafe(safeStmt);
      } catch {
        // ignore
      }
    }
  } catch (e) {
    // If migration file missing, skip
  }
}


