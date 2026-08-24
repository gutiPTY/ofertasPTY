import { describe, expect, it } from "vitest";
import { buildApp } from "../src/app";

describe("GET /auth/me", () => {
  it("rechaza requests sin token", async () => {
    const app = buildApp();
    const res = await app.inject({ method: "GET", url: "/auth/me" });
    expect(res.statusCode).toBe(401);
  });

  it("rechaza tokens inválidos", async () => {
    const app = buildApp();
    const res = await app.inject({
      method: "GET",
      url: "/auth/me",
      headers: { authorization: "Bearer token-invalido" },
    });
    expect(res.statusCode).toBe(401);
  });
});
