# Data Model: Fence file-backed queue work

Queue records keep their existing fields and add `leaseToken` while running. Each claim assigns a fresh opaque UUID token. A successful completion or failure requires the current token; either terminal transition out of the running state clears the token and lease timestamp. A reclaimed running job receives a new token and incremented attempt count.

Lock and temp files are transient siblings of the JSONL file. They are not queue records.
