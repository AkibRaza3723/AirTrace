import dotenv from "dotenv";

dotenv.config();

export const env = {
  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 5001,
  NODE_ENV: process.env.NODE_ENV || "development",
  FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:3000",
  DATABASE_URL: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/airtrace?schema=public",
  
  // Better Auth Configuration
  BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET || "airtrace-super-secret-key-change-in-production-min32chars",
  BETTER_AUTH_URL: process.env.BETTER_AUTH_URL || "http://localhost:5001",
  
  // Google OAuth Credentials
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || "",
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || "",

  // External APIs
  OPENAQ_API_KEY: process.env.OPENAQ_API_KEY || "",
  NASA_FIRMS_MAP_KEY: process.env.NASA_FIRMS_MAP_KEY || "",
  MAPBOX_ACCESS_TOKEN: process.env.MAPBOX_ACCESS_TOKEN || "",
};
