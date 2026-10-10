import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { prisma } from "./lib/dbconnect.js";
import { logger } from "./utils/logger.js";

const app = createApp();

/**
 * Idempotent DB initialization for authentication & campus profiles
 */
async function initDatabase() {
  try {
    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        CREATE TYPE "Profession" AS ENUM ('STUDENT', 'PROFESSIONAL');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await prisma.$executeRawUnsafe(`
      ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "profession" "Profession" DEFAULT 'STUDENT';
      ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "onboardingCompleted" BOOLEAN DEFAULT false;
      ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "preferredAddress" TEXT;
      ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "preferredLat" DOUBLE PRECISION;
      ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "preferredLng" DOUBLE PRECISION;
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "campus_profiles" (
        "id" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "campusName" TEXT NOT NULL,
        "campusLatitude" DOUBLE PRECISION NOT NULL,
        "campusLongitude" DOUBLE PRECISION NOT NULL,
        "campusAddress" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "campus_profiles_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "campus_profiles_userId_key" UNIQUE ("userId")
      );
    `);

    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        ALTER TABLE "campus_profiles" ADD CONSTRAINT "campus_profiles_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    logger.info("✅ Database authentication schema verified and ready.");
  } catch (err) {
    logger.error("Database schema init notice:", err);
  }
}

const server = app.listen(env.PORT, async () => {
  logger.info(`🚀 AirTrace Backend API is running on http://localhost:${env.PORT}`);
  await initDatabase();
});

// Graceful shutdown handling
async function shutdown(signal: string) {
  logger.info(`Received ${signal}. Gracefully shutting down...`);
  server.close(async () => {
    try {
      await prisma.$disconnect();
      logger.info("Prisma Client disconnected.");
      process.exit(0);
    } catch (err) {
      logger.error("Error during graceful shutdown:", err);
      process.exit(1);
    }
  });
}

process.on("SIGTERM", () => shutdown("SIGTERM")); 
process.on("SIGINT", () => shutdown("SIGINT"));
