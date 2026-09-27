import { randomUUID } from "node:crypto";

const ISO = () => new Date().toISOString();

export class InMemoryDatabaseAdapter {
  constructor({ connectionString = process.env.DATABASE_URL, dialect = "postgresql", tableName = "spec_craft_projects" } = {}) {
    if (typeof connectionString !== "string" || connectionString.trim() === "") {
      throw new TypeError("A PostgreSQL connection string is required for migration planning");
    }
    this.connectionString = connectionString.trim();
    this.dialect = String(dialect);
    this.tableName = String(tableName);
    const parsed = new URL(this.connectionString);
    if (!parsed.hostname) {
      throw new Error("Database connection string must include a host");
    }
    if (!/^(postgres|postgresql)$/i.test(parsed.protocol.replace(":", ""))) {
      throw new Error("Only PostgreSQL-compatible connection strings are supported");
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

export { InMemoryDatabaseAdapter as ManagedDatabaseAdapter };
