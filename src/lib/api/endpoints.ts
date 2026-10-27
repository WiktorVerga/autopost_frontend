/**
 * Backend routes, relative to the FastAPI root.
 * Single source of truth: if a route changes in the backend, change it here.
 */
export const endpoints = {
  auth: {
    googleLogin: "/auth/google/login",
    me: "/auth/me",
    logout: "/auth/logout",
  },
  collections: "/idea-collections",
  ideas: "/ideas",
  programs: "/programs",
  contents: "/contents",
  logs: "/logs",
  instagram: {
    accounts: "/instagram-accounts",
    connect: "/instagram-accounts/oauth/login",
    disconnect: "/instagram-accounts",
  },
  posts: "/posts",
} as const;

/** Prefix the browser uses; `next.config.ts` rewrites it to the backend. */
export const BROWSER_API_PREFIX = "/api";

/** URL to use in an `<a href>` that must hit the backend (e.g. OAuth redirects). */
export function browserUrl(path: string) {
  return `${BROWSER_API_PREFIX}${path}`;
}
