import { createAuthClient } from "better-auth/react";
import { API_BASE_URL } from "./api-config";

export const authClient = createAuthClient({
  baseURL: API_BASE_URL,
  fetchOptions: {
    credentials: "include", // Ensures browser attaches cross-origin session cookies
  },
});

export const {
  signIn,
  signUp,
  signOut,
  useSession,
  getSession,
} = authClient;
