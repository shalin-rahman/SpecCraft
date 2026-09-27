import { mkdir, open, readFile, rename, rm, stat, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { dirname } from "node:path";
import { setTimeout as delay } from "node:timers/promises";

const ISO = () => new Date().toISOString();

export async function persistAtomically(filePath, content) {
  await mkdir(dirname(filePath), { recursive: true });
  const temporary = `${filePath}.${process.pid}.${randomUUID()}.tmp`;
  try {
    await writeFile(temporary, content, { encoding: "utf8", flag: "wx" });
    await rename(temporary, filePath);
  } finally {
    await rm(temporary, { force: true }).catch(() => {});
  }
}

export class FileJobQueue {
  constructor(filePath, options = {}) {
    this.filePath = filePath;
    this.maxAttempts = options.maxAttempts ?? 5;
    this.leaseMs = options.leaseMs ?? 60_000;
    this.lockStaleMs = options.lockStaleMs ?? 30_000;
    this.lockTimeoutMs = options.lockTimeoutMs ?? 60_000;
    if (!Number.isSafeInteger(this.lockStaleMs) || this.lockStaleMs < 1 ||
        !Number.isSafeInteger(this.lockTimeoutMs) || this.lockTimeoutMs < this.lockStaleMs) {
      throw new RangeError("Queue lock timeouts must be positive and lockTimeoutMs must cover lockStaleMs");
    }
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
    const content = records.map((record) => JSON.stringify(record)).join("\n") + (records.length ? "\n" : "");
    await persistAtomically(this.filePath, content);
  }

  async withLock(operation) {
    const lockPath = `${this.filePath}.lock`;
    const lockToken = randomUUID();
    const startedAt = Date.now();
    await mkdir(dirname(this.filePath), { recursive: true });

    while (true) {
      let handle;
      try {
        handle = await open(lockPath, "wx");
        await handle.writeFile(JSON.stringify({ pid: process.pid, token: lockToken }), "utf8");
      } catch (error) {
        await handle?.close().catch(() => {});
        if (error.code !== "EEXIST") throw error;
        try {
          const metadata = await stat(lockPath);
          if (Date.now() - metadata.mtimeMs > this.lockStaleMs) {
            const reaped = await this.reapStaleLock(lockPath);
            if (reaped) continue;
          }
        } catch (statError) {
          if (statError.code !== "ENOENT") throw statError;
        }
        if (Date.now() - startedAt >= this.lockTimeoutMs) {
          throw new Error("Timed out waiting for the queue lock");
        }
        await delay(10);
        continue;
      }

      try {
        return await operation();
      } finally {
        await handle.close().catch(() => {});
        try {
          const lock = JSON.parse(await readFile(lockPath, "utf8"));
          if (lock.token === lockToken) await rm(lockPath, { force: true });
        } catch (error) {
          if (error.code !== "ENOENT") throw error;
        }
      }
    }
  }

  async reapStaleLock(lockPath) {
    const reaperPath = `${lockPath}.reaper`;
    const reaperToken = randomUUID();
    let reaper;
    try {
      reaper = await open(reaperPath, "wx");
      await reaper.writeFile(reaperToken, "utf8");
    } catch (error) {
      await reaper?.close().catch(() => {});
      if (error.code === "EEXIST") return false;
      throw error;
    }

    try {
      let metadata;
      let lockContents;
      let owner = null;
      try {
        metadata = await stat(lockPath);
        lockContents = await readFile(lockPath, "utf8");
        try {
          owner = JSON.parse(lockContents);
        } catch (error) {
          if (!(error instanceof SyntaxError)) throw error;
        }
      } catch (error) {
        if (error.code === "ENOENT") return true;
        throw error;
      }
      if (!metadata || Date.now() - metadata.mtimeMs <= this.lockStaleMs) return false;

      let ownerAlive = false;
      if (Number.isInteger(owner?.pid) && owner.pid > 0) {
        try {
          process.kill(owner.pid, 0);
          ownerAlive = true;
        } catch (error) {
          ownerAlive = error.code === "EPERM";
        }
      }
      if (ownerAlive) return false;

      let current;
      try {
        const currentMetadata = await stat(lockPath);
        const currentContents = await readFile(lockPath, "utf8");
        if (currentContents !== lockContents || currentMetadata.dev !== metadata.dev ||
            currentMetadata.ino !== metadata.ino || currentMetadata.mtimeMs !== metadata.mtimeMs) return false;
        try {
          current = JSON.parse(currentContents);
        } catch (error) {
          if (!(error instanceof SyntaxError)) throw error;
        }
      } catch (error) {
        if (error.code === "ENOENT") return true;
        throw error;
      }
      if (owner && current?.token !== owner.token) return false;
      await rm(lockPath, { force: true });
      return true;
    } finally {
      await reaper.close().catch(() => {});
      try {
        if ((await readFile(reaperPath, "utf8")) === reaperToken) await rm(reaperPath, { force: true });
      } catch (error) {
        if (error.code !== "ENOENT") throw error;
      }
    }
  }

  async enqueue(type, payload, idempotencyKey = randomUUID()) {
    return this.withLock(async () => {
      const records = await this.list();
      const existing = records.find((record) => record.idempotencyKey === idempotencyKey);
      if (existing) return existing;
      const record = {
        id: randomUUID(), type, payload, idempotencyKey, status: "queued", attempts: 0,
        createdAt: ISO(), updatedAt: ISO()
      };
      records.push(record);
      await this.persist(records);
      return record;
    });
  }

  async claimNext(workerId, { excludeIds = [] } = {}) {
    return this.withLock(async () => {
      const records = await this.list();
      const now = Date.now();
      const excluded = new Set(excludeIds);
      const candidate = records.find((record) => {
        const expiredLease = record.status === "running" && Number(record.leaseUntil ?? 0) <= now;
        return !excluded.has(record.id) && (record.status === "queued" || record.status === "retrying" || expiredLease);
      });
      if (!candidate) return null;
      candidate.status = "running";
      candidate.workerId = workerId;
      candidate.leaseToken = randomUUID();
      candidate.attempts = (candidate.attempts ?? 0) + 1;
      candidate.leaseUntil = now + this.leaseMs;
      candidate.updatedAt = ISO();
      await this.persist(records);
      return candidate;
    });
  }

  async complete(jobId, output, leaseToken) {
    return this.withLock(async () => {
      const records = await this.list();
      const record = records.find((item) => item.id === jobId);
      if (!record) throw new Error(`Unknown job: ${jobId}`);
      if (record.status !== "running" || !leaseToken || record.leaseToken !== leaseToken) {
        throw new Error(`Cannot complete job ${jobId}: stale lease`);
      }
      record.status = "completed";
      record.output = output;
      record.completedAt = ISO();
      record.updatedAt = ISO();
      record.leaseUntil = null;
      record.leaseToken = null;
      await this.persist(records);
      return record;
    });
  }

  async fail(jobId, errorMessage, leaseToken) {
    return this.withLock(async () => {
      const records = await this.list();
      const record = records.find((item) => item.id === jobId);
      if (!record) throw new Error(`Unknown job: ${jobId}`);
      if (record.status !== "running" || !leaseToken || record.leaseToken !== leaseToken) {
        throw new Error(`Cannot fail job ${jobId}: stale lease`);
      }
      const shouldRetry = (record.attempts ?? 0) < this.maxAttempts;
      record.status = shouldRetry ? "retrying" : "failed";
      record.lastError = String(errorMessage ?? "unknown");
      record.leaseUntil = null;
      record.leaseToken = null;
      record.deadLetter = !shouldRetry;
      record.updatedAt = ISO();
      await this.persist(records);
      return record;
    });
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

export class FileOutbox {
  constructor(filePath, options = {}) {
    this.queue = new FileJobQueue(filePath, options);
  }

  async publish(type, payload, idempotencyKey) {
    return this.queue.enqueue(type, payload, idempotencyKey ?? randomUUID());
  }

  async drain(handler) {
    const queued = await this.queue.list();
    const runnableCount = queued.filter((job) => job.status === "queued" || job.status === "retrying").length;
    const workerId = `outbox-${randomUUID()}`;
    const processedIds = new Set();
    for (let index = 0; index < runnableCount; index += 1) {
      const job = await this.queue.claimNext(workerId, { excludeIds: [...processedIds] });
      if (!job) break;
      processedIds.add(job.id);
      try {
        const result = await handler(job);
        await this.queue.complete(job.id, result, job.leaseToken);
      } catch (error) {
        await this.queue.fail(job.id, error instanceof Error ? error.message : String(error), job.leaseToken);
      }
    }
    return this.queue.list();
  }
}

export { FileOutbox as ManagedOutbox };
