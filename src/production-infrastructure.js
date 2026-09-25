import { appendFile, mkdir, readFile, rename, writeFile } from "node:fs/promises";
import {
  createHash,
  createHmac,
  createPublicKey,
  randomUUID,
  timingSafeEqual,
  verify as verifySignature
} from "node:crypto";
import { dirname } from "node:path";

const ISO = () => new Date().toISOString();

function digest(value) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

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

export class DurableAuditLog {
  constructor(filePath) {
    this.filePath = filePath;
  }

  async append(entry) {
    const records = await this.list();
    const record = {
      sequence: records.length + 1,
      previousHash: records.at(-1)?.hash ?? null,
      ...entry,
      createdAt: ISO()
    };
    record.hash = digest(record);
    await mkdir(dirname(this.filePath), { recursive: true });
    await appendFile(this.filePath, `${JSON.stringify(record)}\n`, "utf8");
    return record;
  }

  async list() {
    try {
      const raw = await readFile(this.filePath, "utf8");
      return raw.trim() ? raw.trim().split("\n").map((line) => JSON.parse(line)).filter(Boolean) : [];
    } catch (error) {
      if (error.code === "ENOENT") return [];
      throw error;
    }
  }

  async verify() {
    let previousHash = null;
    for (const record of await this.list()) {
      const { hash, ...withoutHash } = record;
      if (record.previousHash !== previousHash || digest(withoutHash) !== hash) return false;
      previousHash = hash;
    }
    return true;
  }
}

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

export class FileCollaborationStore {
  constructor(filePath) {
    this.filePath = filePath;
  }

  async read() {
    try {
      return JSON.parse(await readFile(this.filePath, "utf8"));
    } catch (error) {
      if (error.code === "ENOENT") return { revision: 0, state: {}, proposals: [] };
      throw error;
    }
  }

  async propose(input) {
    const current = await this.read();
    if (input.expectedRevision !== current.revision) throw new Error("Revision conflict");
    const next = {
      ...current,
      revision: current.revision + 1,
      proposals: [...current.proposals, { id: randomUUID(), ...input, status: "pending-review" }]
    };
    await mkdir(dirname(this.filePath), { recursive: true });
    const temporary = `${this.filePath}.tmp`;
    await writeFile(temporary, JSON.stringify(next), "utf8");
    await rename(temporary, this.filePath);
    return next;
  }
}

export class FileJobQueue {
  constructor(filePath, options = {}) {
    this.filePath = filePath;
    this.maxAttempts = options.maxAttempts ?? 5;
    this.leaseMs = options.leaseMs ?? 60_000;
  }

  async list() {
    try {
      const raw = await readFile(this.filePath, "utf8");
      return raw.trim() ? raw.trim().split("\n").map((line) => JSON.parse(line)).filter(Boolean) : [];
    } catch (error) {
      if (error.code === "ENOENT") return [];
      throw error;
    }
  }

  async persist(records) {
    await mkdir(dirname(this.filePath), { recursive: true });
    const temporary = `${this.filePath}.tmp`;
    const content = records.map((record) => JSON.stringify(record)).join("\n") + (records.length ? "\n" : "");
    await writeFile(temporary, content, "utf8");
    await rename(temporary, this.filePath);
  }

  async enqueue(type, payload, idempotencyKey = randomUUID()) {
    const records = await this.list();
    const existing = records.find((record) => record.idempotencyKey === idempotencyKey);
    if (existing) {
      return existing;
    }

    const record = {
      id: randomUUID(),
      type,
      payload,
      idempotencyKey,
      status: "queued",
      attempts: 0,
      createdAt: ISO(),
      updatedAt: ISO()
    };
    records.push(record);
    await this.persist(records);
    return record;
  }

  async claimNext(workerId) {
    const records = await this.list();
    const now = Date.now();
    const candidate = records.find((record) => {
      const expiredLease = record.status === "running" && Number(record.leaseUntil ?? 0) <= now;
      return record.status === "queued" || record.status === "retrying" || expiredLease;
    });
    if (!candidate) return null;

    candidate.status = "running";
    candidate.workerId = workerId;
    candidate.attempts = (candidate.attempts ?? 0) + 1;
    candidate.leaseUntil = now + this.leaseMs;
    candidate.updatedAt = ISO();
    await this.persist(records);
    return candidate;
  }

  async complete(jobId, output) {
    const records = await this.list();
    const record = records.find((item) => item.id === jobId);
    if (!record) throw new Error(`Unknown job: ${jobId}`);
    record.status = "completed";
    record.output = output;
    record.completedAt = ISO();
    record.updatedAt = ISO();
    record.leaseUntil = null;
    await this.persist(records);
    return record;
  }

  async fail(jobId, errorMessage) {
    const records = await this.list();
    const record = records.find((item) => item.id === jobId);
    if (!record) throw new Error(`Unknown job: ${jobId}`);
    const shouldRetry = (record.attempts ?? 0) < this.maxAttempts;
    record.status = shouldRetry ? "retrying" : "failed";
    record.lastError = String(errorMessage ?? "unknown");
    record.leaseUntil = null;
    record.deadLetter = !shouldRetry;
    record.updatedAt = ISO();
    await this.persist(records);
    return record;
  }
}

export class Outbox {
  constructor(filePath) {
    this.queue = new FileJobQueue(filePath);
  }

  publish(type, payload, idempotencyKey) {
    return this.queue.enqueue(type, payload, idempotencyKey);
  }
}

export class ProjectRepository {
  constructor(filePath) {
    this.filePath = filePath;
  }

  async read() {
    try {
      return JSON.parse(await readFile(this.filePath, "utf8"));
    } catch (error) {
      if (error.code === "ENOENT") {
        return {
          version: 1,
          projects: {},
          revisions: []
        };
      }
      throw error;
    }
  }

  async write(state) {
    await mkdir(dirname(this.filePath), { recursive: true });
    const temporary = `${this.filePath}.tmp`;
    await writeFile(temporary, JSON.stringify(state, null, 2), "utf8");
    await rename(temporary, this.filePath);
  }

  async createProject({ id, name, owner, metadata = {} }) {
    const state = await this.read();
    if (!id || state.projects[id]) {
      throw new Error("Project id must be unique and present");
    }

    const project = {
      id,
      name: name ?? id,
      owner: owner ?? "unknown",
      metadata,
      createdAt: ISO(),
      updatedAt: ISO(),
      currentRevision: 0,
      revisions: [],
      proposals: [],
      audit: []
    };

    state.projects[id] = project;
    await this.write(state);
    return project;
  }

  async getProject(projectId) {
    const state = await this.read();
    return state.projects[projectId] ?? null;
  }

  async listProjects() {
    const state = await this.read();
    return Object.values(state.projects);
  }

  async saveRevision(projectId, entry) {
    const state = await this.read();
    const project = state.projects[projectId];
    if (!project) throw new Error(`Project not found: ${projectId}`);
    const revision = {
      id: randomUUID(),
      revisionId: project.currentRevision + 1,
      createdAt: ISO(),
      ...entry
    };
    project.currentRevision = revision.revisionId;
    project.revisions.push(revision);
    project.updatedAt = ISO();
    state.revisions.push({ projectId, ...revision });
    await this.write(state);
    return revision;
  }

  async proposeChange(projectId, input) {
    const state = await this.read();
    const project = state.projects[projectId];
    if (!project) throw new Error(`Project not found: ${projectId}`);
    if (input.expectedRevision !== project.currentRevision) throw new Error("Revision conflict");
    const proposal = {
      id: randomUUID(),
      expectedRevision: input.expectedRevision,
      actor: input.actor ?? "system",
      summary: input.summary ?? "proposal",
      payload: input.payload ?? {},
      status: "pending-review",
      createdAt: ISO()
    };
    project.proposals.push(proposal);
    project.updatedAt = ISO();
    await this.write(state);
    return proposal;
  }

  async appendAudit(projectId, entry) {
    const state = await this.read();
    const project = state.projects[projectId];
    if (!project) throw new Error(`Project not found: ${projectId}`);
    const record = {
      id: randomUUID(),
      createdAt: ISO(),
      ...entry
    };
    project.audit.push(record);
    project.updatedAt = ISO();
    await this.write(state);
    return record;
  }
}

export class ManagedIdentityService {
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

export class ManagedDatabaseAdapter {
  constructor({ connectionString = process.env.DATABASE_URL, dialect = "postgresql", tableName = "spec_craft_projects" } = {}) {
    if (typeof connectionString !== "string" || connectionString.trim() === "") {
      throw new TypeError("A managed database connection string is required");
    }
    this.connectionString = connectionString.trim();
    this.dialect = String(dialect);
    this.tableName = String(tableName);
    const parsed = new URL(this.connectionString);
    if (!parsed.hostname) {
      throw new Error("Database connection string must include a host");
    }
    if (!/^(postgres|postgresql)$/i.test(parsed.protocol.replace(":", ""))) {
      throw new Error("Only PostgreSQL-compatible managed databases are supported");
    }
    this.projects = new Map();
  }

  normalizeProject(project = {}) {
    const id = String(project.id ?? "").trim();
    if (!id) {
      throw new Error("Project id is required");
    }
    return {
      id,
      name: String(project.name ?? id).trim(),
      owner: String(project.owner ?? "system").trim(),
      metadata: project.metadata ?? {},
      createdAt: ISO(),
      updatedAt: ISO(),
      status: project.status ?? "active",
      revision: Number(project.revision ?? 0),
      proposals: Array.isArray(project.proposals) ? project.proposals : [],
      audit: Array.isArray(project.audit) ? project.audit : []
    };
  }

  migrationPlan() {
    return {
      dialect: this.dialect,
      tableName: this.tableName,
      columns: ["id", "name", "owner", "metadata", "status", "created_at", "updated_at"],
      indexes: ["owner", "status", "created_at"],
      constraints: ["primary_key(id)", "foreign_key(owner)"],
      isolation: "read_committed",
      backfill: "required_before_launch"
    };
  }

  async createProject(project = {}) {
    const normalized = this.normalizeProject(project);
    if (this.projects.has(normalized.id)) {
      throw new Error(`Project already exists: ${normalized.id}`);
    }
    this.projects.set(normalized.id, normalized);
    return normalized;
  }

  async getProject(id) {
    return this.projects.get(String(id)) ?? null;
  }

  async saveRevision(projectId, entry = {}) {
    const project = this.projects.get(String(projectId));
    if (!project) {
      throw new Error(`Project not found: ${projectId}`);
    }
    const revision = {
      id: entry.id ?? randomUUID(),
      revisionId: (project.revision ?? 0) + 1,
      createdAt: ISO(),
      ...entry
    };
    project.revision = revision.revisionId;
    project.updatedAt = ISO();
    project.audit = Array.isArray(project.audit) ? project.audit : [];
    project.audit.push({ ...revision, type: entry.type ?? "revision" });
    return revision;
  }

  async withTransaction(handler) {
    const originalSnapshot = [...this.projects.entries()].map(([key, value]) => [key, JSON.parse(JSON.stringify(value))]);
    try {
      const result = await handler({
        createProject: (project) => this.createProject(project),
        getProject: (id) => this.getProject(id),
        saveRevision: (projectId, entry) => this.saveRevision(projectId, entry),
        listProjects: () => [...this.projects.values()]
      });
      return result;
    } catch (error) {
      this.projects.clear();
      for (const [key, value] of originalSnapshot) {
        this.projects.set(key, value);
      }
      throw error;
    }
  }
}

export class ManagedIdentityProvider extends ManagedIdentityService {
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
  }

  validateConfiguration() {
    if (!this.issuer || !this.audience) {
      throw new Error("Managed identity provider requires issuer and audience");
    }
    if (!this.jwksUrl && !this.signingSecret) {
      throw new Error("Managed identity provider requires JWKS or a shared signing secret");
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

export class ManagedAuthorizationService {
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

export class DistributedRateLimiter {
  constructor({ windowMs = 60_000, maxRequests = 100, store = new Map() } = {}) {
    if (!Number.isInteger(windowMs) || windowMs <= 0) {
      throw new TypeError("windowMs must be a positive integer");
    }
    if (!Number.isInteger(maxRequests) || maxRequests <= 0) {
      throw new TypeError("maxRequests must be a positive integer");
    }
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
    this.store = store;
  }

  allow(key, cost = 1, options = {}) {
    const bucketKey = String(key ?? "default");
    const units = Number.isInteger(cost) ? cost : 1;
    if (units < 1) {
      throw new TypeError("Rate-limit cost must be at least 1");
    }

    const now = Date.now();
    const existing = this.store.get(bucketKey);
    const windowStart = existing && existing.windowStart + this.windowMs > now ? existing.windowStart : now;
    const bucket = {
      windowStart,
      count: existing && existing.windowStart + this.windowMs > now ? existing.count : 0
    };

    const limit = options.limit ?? this.maxRequests;
    if (bucket.count + units > limit) {
      const retryAfterMs = Math.max(this.windowMs - (now - bucket.windowStart), 0);
      return { allowed: false, remaining: 0, retryAfterMs, limit };
    }

    bucket.count += units;
    this.store.set(bucketKey, bucket);
    return { allowed: true, remaining: Math.max(limit - bucket.count, 0), retryAfterMs: 0, limit };
  }

  peek(key, options = {}) {
    const bucketKey = String(key ?? "default");
    const existing = this.store.get(bucketKey);
    const now = Date.now();
    if (!existing || existing.windowStart + this.windowMs <= now) {
      return { allowed: true, remaining: options.limit ?? this.maxRequests, retryAfterMs: 0, limit: options.limit ?? this.maxRequests };
    }
    return { allowed: true, remaining: Math.max((options.limit ?? this.maxRequests) - existing.count, 0), retryAfterMs: Math.max(this.windowMs - (now - existing.windowStart), 0), limit: options.limit ?? this.maxRequests };
  }
}

export class ManagedOutbox {
  constructor(filePath, options = {}) {
    this.queue = new FileJobQueue(filePath, options);
  }

  async publish(type, payload, idempotencyKey) {
    return this.queue.enqueue(type, payload, idempotencyKey ?? randomUUID());
  }

  async drain(handler) {
    const queued = await this.queue.list();
    for (const job of queued) {
      if (job.status !== "queued" && job.status !== "retrying") continue;
      try {
        const result = await handler(job);
        await this.queue.complete(job.id, result);
      } catch (error) {
        await this.queue.fail(job.id, error instanceof Error ? error.message : String(error));
      }
    }
    return queued;
  }
}

export class SecurityReviewRunner {
  constructor(rules = []) {
    this.rules = [
      {
        id: "secret-literal",
        severity: "high",
        pattern: /(?:AKIA[0-9A-Z]{16}|AIza[0-9A-Za-z\-_]{35}|gh[pousr]_[A-Za-z0-9]{20,}|-----BEGIN [A-Z ]*PRIVATE KEY-----|token\s*[:=]\s*["'][^"']+["'])/i,
        summary: "Potential secret or credential literal present in code or config."
      },
      {
        id: "unsafe-sql",
        severity: "high",
        pattern: /SELECT\s+.*\s+FROM\s+.*\s+WHERE\s+.*\$\{|\bEXEC\s*\(|\bsp_executesql\b/i,
        summary: "Potential SQL injection or unsafe dynamic query pattern."
      },
      {
        id: "path-traversal",
        severity: "medium",
        pattern: /\.\.[\\/]|%2e%2e[\\/]/i,
        summary: "Path traversal or unsafe relative path pattern detected."
      },
      {
        id: "http-insecure",
        severity: "medium",
        pattern: /https?:\/\/(?!localhost|127\.0\.0\.1|0\.0\.0\.0)/i,
        summary: "Remote provider or service call is not restricted to HTTPS in a production configuration."
      },
      ...rules
    ];
  }

  scanText(text, context = "source") {
    const findings = [];
    for (const rule of this.rules) {
      const matches = text.match(rule.pattern);
      if (!matches) continue;
      findings.push({
        id: rule.id,
        severity: rule.severity,
        context,
        summary: rule.summary
      });
    }
    return {
      context,
      findings,
      passed: findings.length === 0,
      riskLevel: findings.some((finding) => finding.severity === "high") ? "high" : findings.length > 0 ? "medium" : "low"
    };
  }

  scanFiles(files) {
    return files.map(({ path, content }) => this.scanText(content, path));
  }
}
