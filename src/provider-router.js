import { validateProviderConfig } from "./provider-config.js";

function secretFor(provider) {
  return provider.secretEnv ? process.env[provider.secretEnv] : undefined;
}

function headersFor(provider) {
  const secret = secretFor(provider);
  return {
    "content-type": "application/json",
    ...(secret ? { authorization: "Bearer " + secret } : {})
  };
}

function requestBody(provider, input) {
  if (provider.kind === "ollama") {
    return {
      model: provider.model,
      messages: [{ role: "user", content: input.prompt }],
      stream: false
    };
  }
  return { model: provider.model, prompt: input.prompt, input };
}

async function callProvider(provider, input, fetchImpl) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), provider.timeoutMs);
  try {
    const response = await fetchImpl(provider.endpoint, {
      method: "POST",
      headers: headersFor(provider),
      body: JSON.stringify(requestBody(provider, input)),
      signal: controller.signal
    });
    if (!response.ok) throw new Error(`Provider returned HTTP ${response.status}`);
    const data = await response.json();
    if (typeof data !== "object" || data === null) throw new Error("Provider returned invalid JSON");
    return data;
  } finally {
    clearTimeout(timeout);
  }
}

export function createProviderRouter(configInput, options = {}) {
  const config = validateProviderConfig(configInput);
  const fetchImpl = options.fetchImpl ?? fetch;

  return {
    providers: config.providers,
    async complete(input) {
      const failures = [];
      for (const provider of config.providers.filter((item) => item.enabled)) {
        for (let attempt = 0; attempt <= provider.retries; attempt += 1) {
          try {
            const result = await callProvider(provider, input, fetchImpl);
            return { providerId: provider.id, model: provider.model, result, failures };
          } catch (error) {
            failures.push({
              providerId: provider.id,
              attempt: attempt + 1,
              reason: error instanceof Error ? error.message : "Provider failed"
            });
          }
        }
      }
      throw new Error(`All configured providers failed: ${failures.map((item) => item.providerId).join(", ")}`);
    }
  };
}
