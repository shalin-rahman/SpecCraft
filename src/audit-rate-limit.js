export class AuditLog {
  constructor() {
    this.entries = [];
  }

  append(entry) {
    const safeEntry = {
      actor: String(entry.actor ?? "system"),
      action: String(entry.action ?? "unknown"),
      project: String(entry.project ?? "unknown"),
      revision: entry.revision ?? null,
      result: String(entry.result ?? "unknown"),
      createdAt: new Date().toISOString()
    };
    this.entries.push(Object.freeze(safeEntry));
    return safeEntry;
  }

  list() {
    return this.entries.map((entry) => ({ ...entry }));
  }
}

export class RateLimiter {
  constructor({ limit = 30, windowMs = 60_000 } = {}) {
    this.limit = limit;
    this.windowMs = windowMs;
    this.buckets = new Map();
  }

  allow(key, now = Date.now()) {
    const bucket = this.buckets.get(key);
    if (!bucket || now - bucket.startedAt >= this.windowMs) {
      this.buckets.set(key, { startedAt: now, count: 1 });
      return true;
    }
    if (bucket.count >= this.limit) return false;
    bucket.count += 1;
    return true;
  }
}
