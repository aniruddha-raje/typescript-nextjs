import { describe, expect, it, vi, afterEach } from "vitest";
import { decodeToken, isTokenExpired, mintMockToken } from "@/lib/jwt";

afterEach(() => {
  vi.useRealTimers();
});

describe("mintMockToken", () => {
  it("produces three base64url segments", () => {
    const parts = mintMockToken("admin").split(".");
    expect(parts).toHaveLength(3);
    // base64url alphabet only: no +, / or = padding, which the backend's
    // decoder would choke on.
    parts.forEach((part) => expect(part).toMatch(/^[A-Za-z0-9_-]+$/));
  });

  it("declares HS256 in the header", () => {
    const [header] = mintMockToken("admin").split(".");
    expect(JSON.parse(atob(header))).toEqual({ alg: "HS256", typ: "JWT" });
  });

  it("round-trips the subject through decodeToken", () => {
    expect(decodeToken(mintMockToken("admin"))?.sub).toBe("admin");
  });

  it("survives a non-ASCII subject", () => {
    // btoa() throws on raw multi-byte input, hence the TextEncoder in jwt.ts.
    expect(decodeToken(mintMockToken("既存ユーザ"))?.sub).toBe("既存ユーザ");
  });

  it("expires eight hours out", () => {
    const claims = decodeToken(mintMockToken("admin"));
    expect(claims!.exp - claims!.iat).toBe(8 * 60 * 60);
  });
});

describe("decodeToken", () => {
  it("returns null for a malformed token", () => {
    expect(decodeToken("not-a-jwt")).toBeNull();
    expect(decodeToken("")).toBeNull();
    expect(decodeToken("a.b.c")).toBeNull();
  });
});

describe("isTokenExpired", () => {
  it("is false for a freshly minted token", () => {
    expect(isTokenExpired(mintMockToken("admin"))).toBe(false);
  });

  it("is true once exp has passed", () => {
    const token = mintMockToken("admin");
    vi.useFakeTimers();
    vi.setSystemTime(Date.now() + 9 * 60 * 60 * 1000);
    expect(isTokenExpired(token)).toBe(true);
  });

  it("treats exp exactly now as expired", () => {
    const token = mintMockToken("admin");
    const { exp } = decodeToken(token)!;
    vi.useFakeTimers();
    vi.setSystemTime(exp * 1000);
    expect(isTokenExpired(token)).toBe(true);
  });

  it("treats a malformed token as expired", () => {
    expect(isTokenExpired("garbage")).toBe(true);
  });
});
