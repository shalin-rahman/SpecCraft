import { appendFile, mkdir, readFile } from "node:fs/promises";
import { createHash, randomUUID } from "node:crypto";
import { dirname } from "node:path";
import { FileJobQueue, persistAtomically } from "./file-job-queue.js";

const ISO = () => new Date().toISOString();

function digest(value) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

export class DurableAuditLog {
  constructor(filePath) {
    this.filePath = filePath;
    this.lock = new FileJobQueue(filePath);
  }

  async append(entry) {
    return this.lock.withLock(async () => {
      const records = await this.list();
      const { sequence: ignoredSequence, previousHash: ignoredPreviousHash, hash: ignoredHash, ...fields } = entry;
      const record = {
        ...fields,
        sequence: records.length + 1,
        previousHash: records.at(-1)?.hash ?? null,
        createdAt: ISO()
      };
      record.hash = digest(record);
      await mkdir(dirname(this.filePath), { recursive: true });
      await appendFile(this.filePath, `${JSON.stringify(record)}\n`, "utf8");
      return record;
    });
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

export class FileCollaborationStore {
  constructor(filePath) {
    this.filePath = filePath;
    this.lock = new FileJobQueue(filePath);
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
    return this.lock.withLock(async () => {
      const current = await this.read();
      if (input.expectedRevision !== current.revision) throw new Error("Revision conflict");
      const next = {
        ...current,
        revision: current.revision + 1,
        proposals: [...current.proposals, { id: randomUUID(), ...input, status: "pending-review" }]
      };
      await persistAtomically(this.filePath, JSON.stringify(next));
      return next;
    });
  }
}

export class ProjectRepository {
  constructor(filePath) {
    this.filePath = filePath;
    this.lock = new FileJobQueue(filePath);
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
    await persistAtomically(this.filePath, JSON.stringify(state, null, 2));
  }

  async createProject({ id, name, owner, metadata = {} }) {
    return this.lock.withLock(async () => {
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
    });
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
    return this.lock.withLock(async () => {
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
    });
  }

  async proposeChange(projectId, input) {
    return this.lock.withLock(async () => {
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
    });
  }

  async appendAudit(projectId, entry) {
    return this.lock.withLock(async () => {
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
    });
  }
}

