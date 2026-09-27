# Quickstart: Verify local queue concurrency

Run `npm test`. The concurrency test races two queue instances against the same file, confirms distinct claims, lets a lease expire and be reclaimed, rejects stale completion/failure, and allows the new owner to complete. Queue and lock files live beneath an isolated temporary directory removed in `finally`.
