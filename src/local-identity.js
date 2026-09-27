import { createHmac, createPublicKey, timingSafeEqual, verify as verifySignature } from "node:crypto";

function base64UrlDecode(value) {
  if (typeof value !== "string" || !/^[A-Za-z0-9_-]+$/.test(value)) {
    throw new Error("Invalid JWT encoding");
  }
  return Buffer.from(value, "base64url").toString("utf8");
}

function decodeJsonWebToken(token) {
  if (typeof token !== "string" || Buffer.byteLength(token) > 64 * 1024) {
    throw new Error("Invalid JWT size");
  }
  const parts = String(token).split(".");
  if (parts.length !== 3) {
    throw new Error("Invalid JWT format");
  }
  const header = JSON.parse(base64UrlDecode(parts[0]));
  const payload = JSON.parse(base64UrlDecode(parts[1]));
  if (!header || typeof header !== "object" || Array.isArray(header) ||
      !payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("Invalid JWT contents");
  }
  return {
    header,
    payload,
    signature: parts[2],
    signingInput: `${parts[0]}.${parts[1]}`
  };
}

function verifyHmacJwt(decoded, secret) {
  if (decoded.header.alg !== "HS256") throw new Error("Unsupported token algorithm");
  if ((typeof secret !== "string" && !Buffer.isBuffer(secret)) || secret.length === 0) {
    throw new Error("Token verification key is required");
  }
  if (!/^[A-Za-z0-9_-]+$/.test(decoded.signature)) throw new Error("Token signature verification failed");
  const actual = Buffer.from(decoded.signature, "base64url");
  const expected = createHmac("sha256", secret).update(decoded.signingInput).digest();
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    throw new Error("Token signature verification failed");
  }
}

function createVerifiedPrincipal(decoded, { issuer, audience, clockSkewMs }) {
  const payload = decoded.payload;
  const now = Date.now();
  if (typeof payload.exp !== "number" || !Number.isFinite(payload.exp)) {
    throw new Error("Token expiration claim is required");
  }
  const expiresAt = payload.exp * 1000;
  if (!Number.isFinite(expiresAt)) throw new Error("Token expiration claim is invalid");
  if (now >= expiresAt + clockSkewMs) throw new Error("Token expired");
  if (payload.nbf !== undefined) {
    if (typeof payload.nbf !== "number" || !Number.isFinite(payload.nbf)) {
      throw new Error("Token not-before claim is invalid");
    }
    const validFrom = payload.nbf * 1000;
    if (!Number.isFinite(validFrom)) throw new Error("Token not-before claim is invalid");
    if (now + clockSkewMs < validFrom) throw new Error("Token not yet valid");
  }
  if (issuer && payload.iss !== issuer) throw new Error("Token issuer mismatch");

  const tokenAudience = Array.isArray(payload.aud) ? payload.aud : [payload.aud].filter(Boolean);
  if (tokenAudience.some((value) => typeof value !== "string")) throw new Error("Token audience is invalid");
  if (audience && !tokenAudience.includes(audience)) throw new Error("Token audience mismatch");

  return {
    subject: payload.sub ?? "anonymous",
    issuer: payload.iss ?? issuer ?? "unknown",
    audience: tokenAudience,
    project: payload.project ?? null,
    tenant: payload.tenant ?? null,
    roles: Array.isArray(payload.roles) ? payload.roles : [],
    scopes: Array.isArray(payload.scopes) ? payload.scopes : [],
    claims: payload
  };
}

export class HmacIdentityVerifier {
  constructor({ issuer, audience, signingSecret = null, clockSkewMs = 30_000 } = {}) {
    if (!Number.isSafeInteger(clockSkewMs) || clockSkewMs < 0) {
      throw new RangeError("Clock skew must be a non-negative safe integer");
    }
    this.issuer = issuer;
    this.audience = audience;
    this.signingSecret = signingSecret;
    this.clockSkewMs = clockSkewMs;
  }

  verifyToken(token, options = {}) {
    const issuer = options.issuer ?? this.issuer;
    const audience = options.audience ?? this.audience;
    const secret = options.signingSecret ?? this.signingSecret;
    const decoded = decodeJsonWebToken(token);
    verifyHmacJwt(decoded, secret);
    return createVerifiedPrincipal(decoded, {
      issuer,
      audience,
      clockSkewMs: options.clockSkewMs ?? this.clockSkewMs
    });
  }

  authorize(principal, required = {}) {
    const requiredRoles = Array.isArray(required.roles) ? required.roles : [];
    const requiredScopes = Array.isArray(required.scopes) ? required.scopes : [];
    const projectId = required.projectId ?? null;

    if (projectId && principal.project !== projectId) {
      return false;
    }

    if (requiredRoles.length > 0 && !requiredRoles.some((role) => principal.roles.includes(role))) {
      return false;
    }

    if (requiredScopes.length > 0 && !requiredScopes.every((scope) => principal.scopes.includes(scope))) {
      return false;
    }

    return true;
  }
}

export class LocalIdentityProvider extends HmacIdentityVerifier {
  constructor({
    issuer,
    audience,
    jwksUrl = null,
    signingSecret = null,
    clockSkewMs = 30_000,
    requiredTenant = null,
    fetchImpl = globalThis.fetch,
    jwksTimeoutMs = 5_000,
    jwksCacheTtlMs = 300_000,
    maxJwksBytes = 256 * 1024,
    maxJwksKeys = 100
  } = {}) {
    super({ issuer, audience, signingSecret, clockSkewMs });
    if (jwksUrl) {
      const endpoint = new URL(jwksUrl);
      if (endpoint.protocol !== "https:" || endpoint.username || endpoint.password) {
        throw new Error("JWKS endpoint must use HTTPS and contain no credentials");
      }
    }
    if (!Number.isSafeInteger(jwksTimeoutMs) || jwksTimeoutMs < 1 ||
        !Number.isSafeInteger(jwksCacheTtlMs) || jwksCacheTtlMs < 1 ||
        !Number.isSafeInteger(maxJwksBytes) || maxJwksBytes < 1 ||
        !Number.isSafeInteger(maxJwksKeys) || maxJwksKeys < 1) {
      throw new RangeError("JWKS limits must be positive safe integers");
    }
    this.jwksUrl = jwksUrl;
    this.requiredTenant = requiredTenant;
    this.fetchImpl = fetchImpl;
    this.jwksTimeoutMs = jwksTimeoutMs;
    this.jwksCacheTtlMs = jwksCacheTtlMs;
    this.maxJwksBytes = maxJwksBytes;
    this.maxJwksKeys = maxJwksKeys;
    this.jwksCache = null;
    this.validateConfiguration();
  }

  validateConfiguration() {
    if (typeof this.issuer !== "string" || !this.issuer.trim() ||
        typeof this.audience !== "string" || !this.audience.trim()) {
      throw new Error("Managed identity provider requires issuer and audience");
    }
    if (Boolean(this.jwksUrl) === Boolean(this.signingSecret)) {
      throw new Error("Managed identity provider requires exactly one of JWKS or a shared signing secret");
    }
    return {
      issuer: this.issuer,
      audience: this.audience,
      jwksUrl: this.jwksUrl,
      requiredTenant: this.requiredTenant
    };
  }

  async loadJwks() {
    if (!this.jwksUrl || typeof this.fetchImpl !== "function") {
      throw new Error("JWKS verification is not configured");
    }
    if (this.jwksCache && this.jwksCache.expiresAt > Date.now()) return this.jwksCache.keys;

    let response;
    try {
      response = await this.fetchImpl(this.jwksUrl, {
        redirect: "error",
        signal: AbortSignal.timeout(this.jwksTimeoutMs)
      });
    } catch {
      throw new Error("Unable to retrieve JWKS");
    }
    if (!response?.ok || !response.body) throw new Error("Unable to retrieve JWKS");

    const declaredLength = Number(response.headers?.get?.("content-length"));
    if (Number.isFinite(declaredLength) && declaredLength > this.maxJwksBytes) {
      await response.body.cancel().catch(() => {});
      throw new Error("JWKS response is too large");
    }

    const reader = response.body.getReader();
    const chunks = [];
    let totalBytes = 0;
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        totalBytes += value.byteLength;
        if (totalBytes > this.maxJwksBytes) {
          await reader.cancel();
          throw new Error("JWKS response is too large");
        }
        chunks.push(Buffer.from(value));
      }
    } catch (error) {
      await reader.cancel().catch(() => {});
      if (error instanceof Error && /too large/i.test(error.message)) throw error;
      throw new Error("Unable to read JWKS response");
    } finally {
      reader.releaseLock();
    }

    let document;
    try {
      document = JSON.parse(Buffer.concat(chunks, totalBytes).toString("utf8"));
    } catch {
      throw new Error("Invalid JWKS response");
    }
    if (!Array.isArray(document.keys) || document.keys.length > this.maxJwksKeys) {
      throw new Error("Invalid JWKS key set");
    }
    const keyIds = new Set();
    for (const key of document.keys) {
      if (typeof key?.kid !== "string" || key.kid.length === 0) continue;
      if (keyIds.has(key.kid)) throw new Error("JWKS contains duplicate key IDs");
      keyIds.add(key.kid);
    }
    this.jwksCache = { keys: document.keys, expiresAt: Date.now() + this.jwksCacheTtlMs };
    return document.keys;
  }

  async verifyToken(token, options = {}) {
    const decoded = decodeJsonWebToken(token);
    let principal;
    if (decoded.header.alg === "HS256") {
      principal = super.verifyToken(token, options);
    } else if (decoded.header.alg === "RS256") {
      if (decoded.header.crit || decoded.header.b64 === false || typeof decoded.header.kid !== "string") {
        throw new Error("Unsupported JWT header");
      }
      const keys = await this.loadJwks();
      const key = keys.find((candidate) =>
        candidate && candidate.kid === decoded.header.kid && candidate.kty === "RSA" &&
        (!candidate.alg || candidate.alg === "RS256") &&
        (!candidate.use || candidate.use === "sig") &&
        (candidate.key_ops === undefined || (Array.isArray(candidate.key_ops) && candidate.key_ops.includes("verify"))) &&
        typeof candidate.n === "string" && typeof candidate.e === "string"
      );
      if (!key || !/^[A-Za-z0-9_-]+$/.test(decoded.signature)) {
        throw new Error("No compatible JWKS key found");
      }
      let signatureValid = false;
      try {
        const publicKey = createPublicKey({ key, format: "jwk" });
        signatureValid = verifySignature("RSA-SHA256", Buffer.from(decoded.signingInput), publicKey, Buffer.from(decoded.signature, "base64url"));
      } catch {
        signatureValid = false;
      }
      if (!signatureValid) throw new Error("Token signature verification failed");
      principal = createVerifiedPrincipal(decoded, {
        issuer: options.issuer ?? this.issuer,
        audience: options.audience ?? this.audience,
        clockSkewMs: options.clockSkewMs ?? this.clockSkewMs
      });
    } else {
      throw new Error("Unsupported token algorithm");
    }
    if (this.requiredTenant && principal.tenant !== this.requiredTenant) {
      throw new Error("Tenant is not authorized for this resource");
    }
    return principal;
  }
}

export class LocalAuthorizationService {
  constructor({ requiredTenant = null } = {}) {
    this.requiredTenant = requiredTenant;
  }

  authorize(principal, required = {}) {
    if (!principal) {
      return false;
    }

    if (this.requiredTenant && principal.tenant !== this.requiredTenant) {
      return false;
    }

    if (required.tenant && principal.tenant !== required.tenant) {
      return false;
    }

    if (required.projectId && principal.project !== required.projectId) {
      return false;
    }

    const requiredRoles = Array.isArray(required.roles) ? required.roles : [];
    const requiredScopes = Array.isArray(required.scopes) ? required.scopes : [];
    if (requiredRoles.length > 0 && !requiredRoles.some((role) => principal.roles.includes(role))) {
      return false;
    }
    if (requiredScopes.length > 0 && !requiredScopes.every((scope) => principal.scopes.includes(scope))) {
      return false;
    }

    return true;
  }
}

export { HmacIdentityVerifier as ManagedIdentityService, LocalIdentityProvider as ManagedIdentityProvider, LocalAuthorizationService as ManagedAuthorizationService };
