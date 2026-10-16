/**
 * Session helpers. The Google OAuth flow lives entirely in the backend:
 * the frontend only checks whether a session exists and who the user is.
 */
import "server-only";

import { serverApi } from "./api/server";
import type { User } from "./api/types";

/** Name of the session cookie set by the backend after Google login. */
export const SESSION_COOKIE = process.env.SESSION_COOKIE_NAME ?? "autopost_session";

/**
 * Development switch: lets you browse the UI before the backend auth exists.
 * Never enable it in production.
 */
export const AUTH_BYPASS = process.env.AUTH_BYPASS === "true";

const DEV_USER: User = {
  id: 0,
  email: "dev@localhost",
  name: "Dev user",
  avatar_url: null,
};

/** Returns the signed-in user, or null if there is no valid session. */
export async function getCurrentUser(): Promise<User | null> {
  if (AUTH_BYPASS) return DEV_USER;
  try {
    return await serverApi.me();
  } catch {
    return null;
  }
}
