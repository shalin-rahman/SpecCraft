import { appendFile, mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { createHash, createHmac, randomUUID } from "node:crypto";
import { dirname } from "node:path";

const ISO = () => new Date().toISOString();

function digest(value) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function base64UrlDecode(value) {
  const normalized = String(value).replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
  return Buffer.from(normalized + padding, "base64").toString("utf8");
}

function decodeJsonWebToken(token) {
  const parts = String(token).split(".");
  if (parts.length !== 3) {
    throw new Error("Invalid JWT format");
  }
  const header = JSON.parse(base64UrlDecode(parts[0]));
  const payload = JSON.parse(base64UrlDecode(parts[1]));
  return {
    header,
    payload,
    signature: parts[2],
    signingInput: `${parts[0]}.${parts[1]}`
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
    const candidate = records.find((record) => record.status === "queued" || record.status === "retrying");
    if (!candidate) return null;

    candidate.status = "running";
    candidate.workerId = workerId;
    candidate.attempts = (candidate.attempts ?? 0) + 1;
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

    if (secret && decoded.header.alg && decoded.header.alg.startsWith("HS")) {
      const expected = createHmac("sha256", secret)
        .update(decoded.signingInput)
        .digest("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/g, "");
      if (expected !== decoded.signature) {
        throw new Error("Token signature verification failed");
      }
    }

    const now = Date.now();
    const payload = decoded.payload;
    const exp = Number(payload.exp ?? 0);
    const nbf = Number(payload.nbf ?? 0);
    if (exp && now > exp * 1000 + this.clockSkewMs) {
      throw new Error("Token expired");
    }
    if (nbf && now < nbf * 1000 - this.clockSkewMs) {
      throw new Error("Token not yet valid");
    }
    if (issuer && payload.iss !== issuer) {
      throw new Error("Token issuer mismatch");
    }

    const tokenAudience = Array.isArray(payload.aud) ? payload.aud : [payload.aud].filter(Boolean);
    if (audience && tokenAudience.length > 0 && !tokenAudience.includes(audience)) {
      throw new Error("Token audience mismatch");
    }
    if (audience && tokenAudience.length === 0) {
      throw new Error("Token audience missing");
    }

    const principal = {
      subject: payload.sub ?? "anonymous",
      issuer: payload.iss ?? issuer ?? "unknown",
      audience: tokenAudience,
      project: payload.project ?? null,
      tenant: payload.tenant ?? null,
      roles: Array.isArray(payload.roles) ? payload.roles : [],
      scopes: Array.isArray(payload.scopes) ? payload.scopes : [],
      claims: payload
    };
    return principal;
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
