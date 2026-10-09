import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { prisma } from "./lib/prisma.js";
import { logger } from "./utils/logger.js";

const app = createApp();

const server = app.listen(env.PORT, () => {
  logger.info(`🚀 AirTrace Backend API is running on http://localhost:${env.PORT}`);
  logger.info(`🔐 Better Auth endpoint active at http://localhost:${env.PORT}/api/auth`);
  logger.info(`🌐 Allowed Frontend Origin: ${env.FRONTEND_URL}`);
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
