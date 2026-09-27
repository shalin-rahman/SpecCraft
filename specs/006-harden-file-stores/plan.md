# Implementation Plan: Harden file-backed store writes

**Branch**: `006-harden-file-stores` | **Date**: 2026-09-27 | **Spec**: [spec.md](spec.md)

## Summary

Close the two final review findings in local file persistence: recover unchanged malformed stale queue locks, and use exclusive unique temporary files plus the existing queue lock protocol for collaboration and project state mutations.

## Technical Context

**Language/Version**: JavaScript ESM, Node.js 20+  
**Dependencies**: Node built-ins  
**Persistence**: Local JSON/JSONL files  
**Verification**: `npm test`, `git diff --check`

## Decisions

1. In stale queue recovery, take a byte-for-byte and stat snapshot before checking the owner, then recheck both under the reaper lock before removing it. Treat malformed metadata as abandoned only when unchanged and stale.
2. Factor atomic file replacement into one helper that uses `<path>.<pid>.<uuid>.tmp`, exclusive creation (`wx`), rename, and `finally` cleanup.
3. Use `FileJobQueue.withLock` to serialize each collaboration/project read-modify-write operation across store instances; keep reads lock-free and atomic.
4. Do not broaden this work into network filesystem or distributed locking guarantees.

## Affected Files

- `src/production-infrastructure.js`
- `test/production-infrastructure.test.js`
- `docs/platform-specification.md`
- `docs/production-readiness-specification.md`
- `docs/workspace-setup.md`

## Test Plan

- Regress empty and malformed stale lock recovery.
- Regress the previous predictable temporary filename and verify concurrent collaboration revision checks.
- Regress concurrent project updates through independent repository instances.
- Run the full test suite and whitespace validation.
