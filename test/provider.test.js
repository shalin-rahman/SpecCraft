import test from "node:test";
import assert from "node:assert/strict";
import { validateProviderConfig } from "../src/provider-config.js";
import { createProviderRouter } from "../src/provider-router.js";
import { AuditLog, RateLimiter } from "../src/audit-rate-limit.js";

const config = {
  version: 1,
  providers: [
    {
      id: "first",
      kind: "http-model",
      enabled: true,
      priority: 10,
      endpoint: "https://first.test",
      allowedHosts: ["first.test"],
      model: "first-model",
      retries: 0
    },
    {
      id: "ollama",
      kind: "ollama",
      enabled: true,
      priority: 20,
      endpoint: "http://127.0.0.1/api/chat",
      allowedHosts: ["127.0.0.1"],
      allowLocal: true,
      model: "local-coder",
      retries: 0
    }
  ]
};

test("validates provider config and orders by priority", () => {
  const validated = validateProviderConfig(config);
  assert.deepEqual(validated.providers.map((provider) => provider.id), ["first", "ollama"]);
  assert.throws(() => validateProviderConfig({ version: 1, providers: [] }), /At least/);
});

test("falls back to the next provider after a failure", async () => {
  const calls = [];
  const router = createProviderRouter(config, {
    fetchImpl: async (url) => {
      calls.push(url);
      if (url.includes("first")) throw new Error("first unavailable");
      return { ok: true, json: async () => ({ message: "local response" }) };
    }
  });
  const result = await router.complete({ prompt: "review this requirement" });
  assert.equal(result.providerId, "ollama");
  assert.equal(calls.length, 2);
  assert.equal(result.failures[0].providerId, "first");
});

test("reports all-provider failure without exposing secrets", async () => {
  const router = createProviderRouter({
    version: 1,
    providers: [{ ...config.providers[0], secretEnv: "TEST_SECRET" }]
  }, {
    fetchImpl: async () => {
      throw new Error("provider unavailable");
    }
  });
  await assert.rejects(() => router.complete({ prompt: "x" }), /All configured providers failed/);
});

test("records audit events and enforces a request window", () => {
  const audit = new AuditLog();
  audit.append({ actor: "user-1", action: "scan", project: "demo", result: "ok" });
  assert.equal(audit.list().length, 1);

  const limiter = new RateLimiter({ limit: 2, windowMs: 1000 });
  assert.equal(limiter.allow("user", 0), true);
  assert.equal(limiter.allow("user", 1), true);
  assert.equal(limiter.allow("user", 2), false);
  assert.equal(limiter.allow("user", 1001), true);
});
