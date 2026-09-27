export class SecretManager {
  constructor({ environment = process.env, cache = new Map(), cacheTtlMs = 300_000 } = {}) {
    this.environment = environment;
    this.cache = cache;
    this.cacheTtlMs = cacheTtlMs;
  }

  resolve(reference, options = {}) {
    const safeReference = String(reference ?? "");
    if (!safeReference) {
      throw new TypeError("A secret reference is required");
    }

    const { allowCache = true, ttlMs = this.cacheTtlMs } = options;
    const cached = this.cache.get(safeReference);
    const now = Date.now();
    if (allowCache && cached && cached.expiresAt > now) {
      return cached.value;
    }

    const value = this.environment[safeReference];
    if (!value) {
      throw new Error(`Secret is not available: ${safeReference}`);
    }

    if (allowCache) {
      this.cache.set(safeReference, { value, expiresAt: now + ttlMs });
    }
    return value;
  }

  redact() {
    return "[REDACTED]";
  }
}

export class EnvironmentSecretManager extends SecretManager {
  constructor(environment = process.env) {
    super({ environment });
  }
}

export class VaultSecretProvider {
  constructor({ environment = process.env, prefix = "SPECCRAFT_" } = {}) {
    this.environment = environment;
    this.prefix = prefix;
  }

  resolve(reference) {
    if (!reference || typeof reference !== "string") {
      throw new TypeError("A secret reference is required");
    }

    const normalized = reference.trim();
    const envKey = normalized.replace(/^secret:\/\//, "");
    const candidates = [
      envKey,
      `${this.prefix}${envKey}`,
      envKey.toUpperCase(),
      `${this.prefix}${envKey.toUpperCase()}`
    ];

    for (const key of candidates) {
      if (Object.prototype.hasOwnProperty.call(this.environment, key)) {
        const value = this.environment[key];
        if (value && value !== "") {
          return value;
        }
      }
    }

    throw new Error(`Secret is not available: ${reference}`);
  }

  set(reference, value) {
    if (!reference || typeof reference !== "string") {
      throw new TypeError("A secret reference is required");
    }
    const safeValue = String(value ?? "");
    if (safeValue === "") {
      throw new Error(`Secret is empty: ${reference}`);
    }
    const trimmed = reference.trim();
    const key = trimmed.replace(/^secret:\/\//, "");
    this.environment[key] = safeValue;
    this.environment[`${this.prefix}${key}`] = safeValue;
    return safeValue;
  }

  rotate(reference, value) {
    return this.set(reference, value);
  }

  revoke(reference) {
    const trimmed = String(reference ?? "").trim();
    if (!trimmed) {
      throw new TypeError("A secret reference is required");
    }
    const key = trimmed.replace(/^secret:\/\//, "");
    delete this.environment[key];
    delete this.environment[`${this.prefix}${key}`];
    delete this.environment[key.toUpperCase()];
    delete this.environment[`${this.prefix}${key.toUpperCase()}`];
    return true;
  }

  redact(value) {
    return typeof value === "string" && value.trim() ? "[REDACTED]" : null;
  }
}

export class EnvironmentSecretProvider extends VaultSecretProvider {
  constructor(environment = process.env) {
    super({ environment });
  }
}

