import { SignJWT, jwtVerify } from "jose";

/** HS256 secrets should be long random strings (env only, never hardcoded). */
const MIN_SECRET_LENGTH = 32;

/**
 * Returns encoded secret for jose, or null if JWT_SECRET is missing or too weak.
 * Use only process.env.JWT_SECRET — no placeholder values in code.
 */
export function getJwtSecretKey() {
  const s = process.env.JWT_SECRET;
  if (!s || typeof s !== "string" || s.length < MIN_SECRET_LENGTH) {
    return null;
  }
  return new TextEncoder().encode(s);
}

export async function signAdminToken(payload) {
  const secret = getJwtSecretKey();
  if (!secret) {
    throw new Error(
      `JWT_SECRET must be set in the environment and be at least ${MIN_SECRET_LENGTH} characters`
    );
  }
  const token = await new SignJWT({ email: payload.email })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(payload.sub))
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
  return token;
}

export async function verifyAdminToken(token) {
  const secret = getJwtSecretKey();
  if (!secret) {
    throw new Error(
      `JWT_SECRET must be set in the environment and be at least ${MIN_SECRET_LENGTH} characters`
    );
  }
  const { payload } = await jwtVerify(token, secret);
  return {
    sub: typeof payload.sub === "string" ? payload.sub : String(payload.sub ?? ""),
    email: typeof payload.email === "string" ? payload.email : "",
  };
}
