import { checkDatabaseHealth } from "./db-bypass";

export async function initializeDatabase() {
  return await checkDatabaseHealth();
}