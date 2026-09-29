/** Decode a JWT payload WITHOUT verifying it. Only for reading exp/role in the UI —
 *  the backend always verifies the signature. Works in the browser and Edge middleware. */
export function decodeJwt(token: string): Record<string, unknown> | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    const json = decodeURIComponent(
      atob(padded)
        .split("")
        .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
        .join(""),
    );
    const payload = JSON.parse(json);
    return payload && typeof payload === "object" ? payload : null;
  } catch {
    return null;
  }
}

/** Expiry in ms since epoch, or null if the token has no exp claim. */
export function getJwtExpiry(token: string): number | null {
  const exp = decodeJwt(token)?.exp;
  return typeof exp === "number" ? exp * 1000 : null;
}

export function isJwtExpired(token: string, skewMs = 5_000): boolean {
  const exp = getJwtExpiry(token);
  return exp !== null && exp - skewMs <= Date.now();
}
