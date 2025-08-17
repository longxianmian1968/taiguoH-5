// Production-only database connection - completely isolated from migration system
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

// Direct HTTP connection to avoid any WebSocket/migration interference
const sql = neon(process.env.DATABASE_URL);

// Production database instance with schema
export const productionDb = drizzle(sql, { schema });

// Health check function
export async function verifyProductionDatabase() {
  try {
    console.log("🔍 Verifying production database connection...");
    const result = await sql`SELECT 1 as test, current_timestamp as timestamp`;
    console.log("✅ Production database verified:", result[0]);
    return true;
  } catch (error) {
    console.error("❌ Production database verification failed:", error);
    return false;
  }
}