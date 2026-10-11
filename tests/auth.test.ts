import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { authMessageKey } from "../src/lib/auth/errors.ts";
import { safeNext } from "../src/lib/auth/redirect.ts";
import { decideRoute } from "../src/lib/auth/routes.ts";
import {
  MAX_PASSWORD,
  isValidEmail,
  validateEmailOnly,
  validateLogin,
  validateNewPassword,
  validateSignup,
} from "../src/lib/auth/validation.ts";
import { DEFAULT_LIMITS, evaluateUsage, limitMessage, readLimits } from "../src/lib/usage.ts";

describe("safeNext (open redirect prevention)", () => {
  it("keeps normal same-site paths, queries and hashes", () => {
    assert.equal(safeNext("/lab"), "/lab");
    assert.equal(safeNext("/runs/abc?x=1#top"), "/runs/abc?x=1#top");
  });

  it("falls back for missing or empty values", () => {
    assert.equal(safeNext(null), "/dashboard");
    assert.equal(safeNext(undefined), "/dashboard");
    assert.equal(safeNext(""), "/dashboard");
    assert.equal(safeNext("", "/lab"), "/lab");
  });

  for (const evil of [
    "https://evil.example",
    "http://evil.example/lab",
    "//evil.example",
    "//evil.example/lab",
    "/\\evil.example",
    "\\\\evil.example",
    "/\t/evil.example",
    "/\n/evil.example",
    "javascript:alert(1)",
    "evil.example",
    "lab",
    "/%0d%0aSet-Cookie:x=1/\r\n",
  ]) {
    it(`rejects ${JSON.stringify(evil)}`, () => {
      assert.equal(safeNext(evil), "/dashboard");
    });
  }

  it("does not send people back to the sign-in pages or auth callbacks", () => {
    assert.equal(safeNext("/login"), "/dashboard");
    assert.equal(safeNext("/login?next=/lab"), "/dashboard");
    assert.equal(safeNext("/signup"), "/dashboard");
    assert.equal(safeNext("/auth/callback?code=1"), "/dashboard");
  });

  it("rejects very long values", () => {
    assert.equal(safeNext(`/${"a".repeat(600)}`), "/dashboard");
  });
});

describe("route protection decisions", () => {
  it("sends signed-out visitors from private pages to login and remembers where they were going", () => {
    for (const path of ["/dashboard", "/lab", "/runs", "/runs/123", "/account"]) {
      const d = decideRoute(path, "", false);
      assert.deepEqual(d, { action: "redirect", to: `/login?next=${encodeURIComponent(path)}` });
    }
    assert.deepEqual(decideRoute("/lab", "?preset=blank", false), {
      action: "redirect",
      to: "/login?next=%2Flab%3Fpreset%3Dblank",
    });
  });

  it("lets signed-out visitors see public pages and the demo", () => {
    for (const path of ["/", "/demo", "/login", "/signup", "/forgot-password", "/reset-password", "/auth/callback"]) {
      assert.deepEqual(decideRoute(path, "", false), { action: "allow" }, path);
    }
  });

  it("does not match look-alike paths", () => {
    assert.deepEqual(decideRoute("/labs", "", false), { action: "allow" });
    assert.deepEqual(decideRoute("/dashboard-old", "", false), { action: "allow" });
  });

  it("keeps signed-in users out of the sign-in pages but allows password reset", () => {
    for (const path of ["/login", "/signup", "/forgot-password"]) {
      assert.deepEqual(decideRoute(path, "", true), { action: "redirect", to: "/dashboard" }, path);
    }
    assert.deepEqual(decideRoute("/reset-password", "", true), { action: "allow" });
    assert.deepEqual(decideRoute("/lab", "", true), { action: "allow" });
  });
});

describe("form validation", () => {
  it("checks email shape", () => {
    assert.equal(isValidEmail("a@b.co"), true);
    assert.equal(isValidEmail(" a@b.co "), true);
    for (const bad of ["", "a", "a@b", "a@b.c", "a b@c.com", "@b.com", `${"a".repeat(250)}@b.com`]) {
      assert.equal(isValidEmail(bad), false, bad);
    }
  });

  it("returns no errors for a good signup", () => {
    assert.deepEqual(
      validateSignup({ name: "Ayesha", email: "a@b.co", password: "longenough1", confirm: "longenough1" }),
      {},
    );
  });

  it("reports every problem in a bad signup with translation keys", () => {
    assert.deepEqual(validateSignup({ name: " ", email: "nope", password: "short", confirm: "other" }), {
      name: "err.nameRequired",
      email: "err.emailInvalid",
      password: "err.passwordShort",
      confirm: "err.passwordMismatch",
    });
  });

  it("limits name and password length", () => {
    assert.equal(validateSignup({ name: "x".repeat(61), email: "a@b.co", password: "longenough1", confirm: "longenough1" }).name, "err.nameLong");
    const long = "p".repeat(MAX_PASSWORD + 1);
    assert.equal(validateNewPassword({ password: long, confirm: long }).password, "err.passwordLong");
    const multibyte = "é".repeat(40); // 80 bytes
    assert.equal(validateNewPassword({ password: multibyte, confirm: multibyte }).password, "err.passwordLong");
  });

  it("login only needs an email and a password", () => {
    assert.deepEqual(validateLogin({ email: "a@b.co", password: "x" }), {});
    assert.deepEqual(validateLogin({ email: "", password: "" }), {
      email: "err.emailRequired",
      password: "err.passwordRequired",
    });
  });

  it("validates the forgot and reset forms", () => {
    assert.deepEqual(validateEmailOnly({ email: "a@b.co" }), {});
    assert.equal(validateEmailOnly({ email: "x" }).email, "err.emailInvalid");
    assert.deepEqual(validateNewPassword({ password: "longenough1", confirm: "longenough1" }), {});
    assert.equal(validateNewPassword({ password: "longenough1", confirm: "nope" }).confirm, "err.passwordMismatch");
  });
});

describe("auth error messages", () => {
  it("maps known Supabase errors to friendly keys", () => {
    assert.equal(authMessageKey({ code: "invalid_credentials" }), "authErr.invalidCredentials");
    assert.equal(authMessageKey({ message: "Invalid login credentials" }), "authErr.invalidCredentials");
    assert.equal(authMessageKey({ code: "email_not_confirmed" }), "authErr.emailNotConfirmed");
    assert.equal(authMessageKey({ status: 429 }), "authErr.rateLimited");
    assert.equal(authMessageKey({ code: "over_email_send_rate_limit" }), "authErr.rateLimited");
    assert.equal(authMessageKey({ code: "weak_password" }), "authErr.weakPassword");
    assert.equal(authMessageKey({ code: "same_password" }), "authErr.sameAsOld");
    assert.equal(authMessageKey({ message: "Auth session missing!" }), "authErr.sessionExpired");
    assert.equal(authMessageKey({ message: "Failed to fetch" }), "authErr.network");
  });

  it("never passes raw server text through", () => {
    assert.equal(authMessageKey({ message: "duplicate key value violates unique constraint users_pkey" }), "authErr.generic");
    assert.equal(authMessageKey(null), "authErr.generic");
    assert.equal(authMessageKey(undefined), "authErr.generic");
  });
});

describe("paid run limits", () => {
  it("allows runs under both limits", () => {
    assert.deepEqual(evaluateUsage(0, 0, DEFAULT_LIMITS), { ok: true });
    assert.deepEqual(evaluateUsage(DEFAULT_LIMITS.perHour - 1, DEFAULT_LIMITS.perDay - 1, DEFAULT_LIMITS), { ok: true });
  });

  it("blocks at the hourly limit, then the daily limit", () => {
    assert.deepEqual(evaluateUsage(DEFAULT_LIMITS.perHour, 10, DEFAULT_LIMITS), { ok: false, reason: "hour" });
    assert.deepEqual(evaluateUsage(0, DEFAULT_LIMITS.perDay, DEFAULT_LIMITS), { ok: false, reason: "day" });
  });

  it("reads limits from the environment and ignores nonsense", () => {
    assert.deepEqual(readLimits({ PAID_RUNS_PER_HOUR: "3", PAID_RUNS_PER_DAY: "9" }), { perHour: 3, perDay: 9 });
    assert.deepEqual(readLimits({}), DEFAULT_LIMITS);
    assert.deepEqual(readLimits({ PAID_RUNS_PER_HOUR: "abc", PAID_RUNS_PER_DAY: "-4" }), DEFAULT_LIMITS);
    assert.equal(readLimits({ PAID_RUNS_PER_HOUR: "999999" }).perHour, 1000);
  });

  it("explains which limit was hit", () => {
    assert.match(limitMessage("hour", DEFAULT_LIMITS), /this hour/);
    assert.match(limitMessage("day", DEFAULT_LIMITS), /today/);
  });
});

describe("paid run size", () => {
  it("is smaller than the demo limit", async () => {
    const { PAID_MAX_CASES } = await import("../src/lib/usage.ts");
    const { LIMITS } = await import("../src/lib/engine/runner.ts");
    assert.ok(PAID_MAX_CASES < LIMITS.maxCases);
    assert.ok(PAID_MAX_CASES * 2 <= 100, "must fit the api_usage.calls check constraint");
  });
});
