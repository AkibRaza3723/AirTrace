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

  // AWS Bedrock AI Model Configuration
  AWS_REGION: process.env.AWS_REGION || "us-east-1",
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID || "",
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY || "",
  AWS_BEDROCK_MODEL_ID: process.env.AWS_BEDROCK_MODEL_ID || "anthropic.claude-3-haiku-20240307-v1:0",

  // OpenAI Configuration
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || "",
  OPENAI_MODEL: process.env.OPENAI_MODEL || "gpt-4o-mini",
};


