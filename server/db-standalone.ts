// Standalone database connection - no migration dependencies
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "@shared/schema";

// Ensure database URL is available
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL environment variable is required");
}

// Direct HTTP connection - completely isolated from any migration system
const sql = neon(databaseUrl);

// Create database instance with schema
export const standaloneDb = drizzle(sql, { schema });

// Simple health check
export async function verifyConnection() {
  try {
    const result = await sql`SELECT 1 as health_check, current_timestamp`;
    console.log("✅ Standalone database connection verified:", result[0]);
    return true;
  } catch (error) {
    console.error("❌ Standalone database connection failed:", error);
    return false;
  }
}