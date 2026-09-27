export class InMemoryRateLimiter {
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

export { InMemoryRateLimiter as DistributedRateLimiter };
