import { AxiosError, AxiosHeaders, type AxiosResponse } from "axios";
import { describe, expect, it } from "vitest";
import { API_BASE_URL, apiErrorMessage, isNotFound } from "@/lib/api";

/** Build an AxiosError carrying the given status and response body. */
function httpError(status: number, data: unknown): AxiosError {
  const error = new AxiosError("Request failed with status code " + status);
  error.response = {
    status,
    data,
    statusText: "",
    headers: new AxiosHeaders(),
    config: { headers: new AxiosHeaders() },
  } as AxiosResponse;
  return error;
}

describe("apiErrorMessage", () => {
  it("surfaces FastAPI's string detail", () => {
    expect(apiErrorMessage(httpError(404, { detail: "Profile not found" }))).toBe(
      "Profile not found",
    );
  });

  it("surfaces the first message of a FastAPI validation error", () => {
    const detail = [
      { loc: ["body", "title"], msg: "Field required", type: "missing" },
      { loc: ["body", "x"], msg: "second problem", type: "missing" },
    ];
    expect(apiErrorMessage(httpError(422, { detail }))).toBe("Field required");
  });

  it("falls back to the axios message when detail is an unexpected shape", () => {
    expect(apiErrorMessage(httpError(500, { detail: { nested: true } }))).toBe(
      "Request failed with status code 500",
    );
  });

  it("falls back when detail is an empty array", () => {
    expect(apiErrorMessage(httpError(422, { detail: [] }))).toBe(
      "Request failed with status code 422",
    );
  });

  it("names the base URL when the backend is unreachable", () => {
    const error = new AxiosError("Network Error", "ERR_NETWORK");
    const message = apiErrorMessage(error);
    expect(message).toContain(API_BASE_URL);
    expect(message).toContain("Is the backend server running?");
  });

  it("handles a non-axios throw", () => {
    expect(apiErrorMessage(new Error("boom"))).toBe(
      "An unexpected error occurred.",
    );
    expect(apiErrorMessage("a bare string")).toBe(
      "An unexpected error occurred.",
    );
  });
});

describe("isNotFound", () => {
  it("is true only for a 404", () => {
    expect(isNotFound(httpError(404, { detail: "nope" }))).toBe(true);
    expect(isNotFound(httpError(500, {}))).toBe(false);
  });

  it("is false for a network error, which carries no response", () => {
    expect(isNotFound(new AxiosError("Network Error", "ERR_NETWORK"))).toBe(false);
  });

  it("is false for a non-axios error", () => {
    expect(isNotFound(new Error("boom"))).toBe(false);
  });
});
