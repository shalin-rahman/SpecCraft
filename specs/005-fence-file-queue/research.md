# Research: Fence file-backed queue work

The current queue performs `list()` and `persist()` independently in enqueue, claim, complete, and fail. Two queue instances can read the same state and overwrite one another; concurrent claims can return the same job. All writers also use one `<queue>.tmp` path. Jobs have expiring timestamps but no fencing token, so an old worker can update a job after another worker reclaims it. `ManagedOutbox.drain` invokes handlers without claiming work.

The chosen boundary is cooperating processes on a local filesystem: exclusive lock-file creation serializes mutations, a bounded stale-lock recovery path avoids permanent deadlock after process exit, and unique temp files avoid collisions before atomic rename. Lease tokens guard ownership changes. Network filesystems and external writers are not covered.
