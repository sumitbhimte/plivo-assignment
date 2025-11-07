import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

// Load environment variables if not already loaded
// This ensures DATABASE_URL is available before validation
if (!process.env.DATABASE_URL) {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const rootEnvPath = resolve(__dirname, "../../../.env.local");
  const serverEnvPath = resolve(__dirname, "../../.env");
  
  dotenv.config({ path: rootEnvPath });
  dotenv.config({ path: serverEnvPath });
}

/**
 * Validates that the DATABASE_URL contains a database name
 * MongoDB connection strings must include a database name after the host
 * Format: mongodb+srv://user:pass@host/database_name?options
 *         mongodb://user:pass@host:port/database_name?options
 */
function validateDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL environment variable is not set. " +
      "Please set it in your .env.local file."
    );
  }

  // Check if the connection string has a database name
  // Pattern: mongodb:// or mongodb+srv:// followed by credentials@host/database_name
  // The database name is the path segment after the host and before any query parameters
  const dbNamePattern = /mongodb(\+srv)?:\/\/(?:[^\/]+@)?[^\/]+\/([^?\/\s]+)/;
  const match = databaseUrl.match(dbNamePattern);
  
  if (!match || !match[2] || match[2].trim() === "") {
    throw new Error(
      "DATABASE_URL is missing a database name. " +
      "The connection string must include a database name after the host. " +
      "\n\n" +
      "Example format:\n" +
      "  mongodb+srv://user:password@cluster.mongodb.net/your_database_name\n" +
      "  mongodb://user:password@host:27017/your_database_name\n\n" +
      "Please update your .env.local file with a valid DATABASE_URL that includes a database name."
    );
  }
}

// Validate DATABASE_URL on module load
validateDatabaseUrl();

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

