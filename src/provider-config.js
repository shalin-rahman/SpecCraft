const providerKinds = new Set(["http-model", "ollama"]);
const maxTimeoutMs = 120_000;
const maxRetries = 5;

function requireText(value, field) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new TypeError(`${field} must be a non-empty string`);
  }
  return value.trim();
}

export function validateProviderConfig(input) {
  if (!input || input.version !== 1 || !Array.isArray(input.providers)) {
    throw new TypeError("Provider configuration version 1 is required");
  }
  if (input.providers.length === 0) {
    throw new RangeError("At least one provider is required");
  }

  const ids = new Set();
  const providers = input.providers.map((provider) => {
    const id = requireText(provider.id, "provider.id");
    if (ids.has(id)) throw new RangeError(`Duplicate provider id: ${id}`);
    ids.add(id);
    const kind = requireText(provider.kind, `${id}.kind`);
    if (!providerKinds.has(kind)) throw new RangeError(`Unsupported provider kind: ${kind}`);
    const endpoint = new URL(requireText(provider.endpoint, `${id}.endpoint`));
    const allowedHosts = Array.isArray(provider.allowedHosts)
      ? provider.allowedHosts.map((host) => requireText(host, `${id}.allowedHosts`))
      : [];
    if (allowedHosts.length === 0 || !allowedHosts.includes(endpoint.hostname)) {
      throw new RangeError(`${id}.endpoint host must be listed in allowedHosts`);
    }
    const localEndpoint = endpoint.hostname === "localhost" || endpoint.hostname === "127.0.0.1";
    if (endpoint.protocol !== "https:" && !(localEndpoint && provider.allowLocal === true)) {
      throw new RangeError(`${id}.endpoint must use HTTPS unless allowLocal is enabled for localhost`);
    }
    const priority = Number(provider.priority);
    if (!Number.isInteger(priority) || priority < 0) {
      throw new RangeError(`${id}.priority must be a non-negative integer`);
    }
    const timeoutMs = provider.timeoutMs === undefined ? 30000 : Number(provider.timeoutMs);
    if (!Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > maxTimeoutMs) {
      throw new RangeError(`${id}.timeoutMs must be an integer from 1 to ${maxTimeoutMs}`);
    }
    const retries = provider.retries === undefined ? 0 : Number(provider.retries);
    if (!Number.isInteger(retries) || retries < 0 || retries > maxRetries) {
      throw new RangeError(`${id}.retries must be an integer from 0 to ${maxRetries}`);
    }
    return {
      id,
      kind,
      enabled: provider.enabled !== false,
      priority,
      endpoint: endpoint.toString(),
      allowedHosts,
      allowLocal: provider.allowLocal === true,
      model: requireText(provider.model, `${id}.model`),
      timeoutMs,
      retries,
      secretEnv: provider.secretEnv
    };
  });

  return {
    version: 1,
    providers: providers.sort((left, right) => left.priority - right.priority)
  };
}
