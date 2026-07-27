// Mock JWT minting for the demo login.
//
// The FastAPI backend's guard decodes the token WITHOUT verifying the
// signature (see app/security/jwt_guard.py), so it only needs a
// structurally valid JWT: three base64url segments -> header.payload.signature.
// We mint one entirely in the browser — there is no real auth server.

function base64UrlEncode(input: string): string {
  // Handle unicode safely before btoa.
  const bytes = new TextEncoder().encode(input);
  let binary = "";
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export interface MockTokenClaims {
  sub: string;
  name: string;
  iat: number;
  exp: number;
}

/** Mint a structurally valid (unsigned) JWT for the given subject. */
export function mintMockToken(subject: string): string {
  const header = { alg: "HS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const claims: MockTokenClaims = {
    sub: subject,
    name: "Administrator",
    iat: now,
    exp: now + 60 * 60 * 8, // 8 hours
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(claims));
  // Fixed placeholder signature — never verified by the backend.
  const signature = base64UrlEncode("mock-signature");

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

/** Decode the payload of a JWT (no verification). Returns null if malformed. */
export function decodeToken(token: string): MockTokenClaims | null {
  try {
    const payload = token.split(".")[1];
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(normalized)) as MockTokenClaims;
  } catch {
    return null;
  }
}

/** True if the token is missing, malformed, or past its exp claim. */
export function isTokenExpired(token: string): boolean {
  const claims = decodeToken(token);
  if (!claims) return true;
  return claims.exp * 1000 <= Date.now();
}
