// Production database bypass - avoid migration system entirely
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set for bypass connection");
}

// Use HTTP connection to bypass WebSocket/migration issues
const sql = neon(process.env.DATABASE_URL);
export const db = drizzle(sql, { schema });

export async function checkDatabaseHealth() {
  try {
    console.log("🔍 Testing database connection...");
    await sql`SELECT 1 as health_check`;
    console.log("✅ Database bypass connection successful");
    return true;
  } catch (error) {
    console.error("❌ Database bypass connection failed:", error);
    return false;
  }
}