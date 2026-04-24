/**
 * Session cookie flags for admin_token.
 * Use Secure only when the request is HTTPS (or behind a TLS terminator that sets
 * x-forwarded-proto). Otherwise Secure cookies are ignored on http:// LAN URLs and
 * mobile browsers never keep the session after login.
 */
export function adminTokenCookieBaseOptions(request) {
  const forwarded = request.headers.get("x-forwarded-proto");
  let isHttps = forwarded === "https";
  if (!isHttps) {
    try {
      isHttps = new URL(request.url).protocol === "https:";
    } catch {
      isHttps = false;
    }
  }
  return {
    httpOnly: true,
    secure: isHttps,
    sameSite: "lax",
    path: "/",
  };
}
