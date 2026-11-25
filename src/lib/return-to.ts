/**
 * The backend sends the browser back to the site root after an OAuth round trip
 * (Google sign-in, Instagram connect). The root is the public landing page, so
 * before leaving we note where the user should actually end up: the proxy reads
 * this cookie on "/" and forwards a signed-in user there.
 */
export const RETURN_COOKIE = "autopost_return_to";

/** Long enough for an OAuth consent screen, short enough not to surprise later. */
const MAX_AGE_SECONDS = 10 * 60;

/** Only same-site absolute paths: never "//host" or a full URL. */
export function safeReturnPath(value: string | null | undefined): string | null {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return null;
  return value === "/" ? null : value;
}

/** Browser only: call right before navigating to the OAuth provider. */
export function rememberReturnPath(path: string) {
  const safe = safeReturnPath(path);
  if (!safe) return;
  document.cookie = `${RETURN_COOKIE}=${encodeURIComponent(safe)}; path=/; max-age=${MAX_AGE_SECONDS}; samesite=lax`;
}
