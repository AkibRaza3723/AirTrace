/**
 * Central API configuration helper.
 * Strips trailing slashes to prevent double-slash (//) routing issues in deployments.
 */
export const API_BASE_URL: string = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001"
).replace(/\/+$/, "");
