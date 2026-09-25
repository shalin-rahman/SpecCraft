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
  constructor({ limit = 30, windowMs = 60_000, maxEntries = 10_000 } = {}) {
    if (!Number.isSafeInteger(limit) || limit < 1 ||
        !Number.isSafeInteger(windowMs) || windowMs < 1 ||
        !Number.isSafeInteger(maxEntries) || maxEntries < 1) {
      throw new RangeError("Rate limiter limits must be positive safe integers");
    }
    this.limit = limit;
    this.windowMs = windowMs;
    this.maxEntries = maxEntries;
    this.buckets = new Map();
  }

  allow(key, now = Date.now()) {
    if (typeof key !== "string" || key.length === 0 || key.length > 256 || !Number.isFinite(now)) {
      return false;
    }

    const bucket = this.buckets.get(key);
    if (bucket && now - bucket.startedAt < this.windowMs) {
      if (bucket.count >= this.limit) return false;
      bucket.count += 1;
      return true;
    }

    if (this.buckets.size >= this.maxEntries) {
      for (const [expiredKey, expiredBucket] of this.buckets) {
        if (now - expiredBucket.startedAt >= this.windowMs) this.buckets.delete(expiredKey);
      }
      if (this.buckets.size >= this.maxEntries && !bucket) return false;
    }

    this.buckets.set(key, { startedAt: now, count: 1 });
    return true;
  }
}
