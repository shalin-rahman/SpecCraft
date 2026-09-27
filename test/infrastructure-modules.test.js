import assert from "node:assert/strict";
import test from "node:test";
import {
  DurableAuditLog,
  DistributedRateLimiter,
  EnvironmentSecretManager,
  EnvironmentSecretProvider,
  FileCollaborationStore,
  FileJobQueue,
  FileOutbox,
  HmacIdentityVerifier,
  InMemoryDatabaseAdapter,
  InMemoryRateLimiter,
  LocalAuthorizationService,
  LocalIdentityProvider,
  ProjectRepository,
  SecretManager,
  SecurityReviewRunner,
  VaultSecretProvider
} from "../src/production-infrastructure.js";
import {
  ManagedAuthorizationService,
  ManagedDatabaseAdapter,
  ManagedIdentityProvider,
  ManagedIdentityService,
  ManagedOutbox
} from "../src/production-infrastructure.js";
import { FileJobQueue as DirectFileJobQueue, FileOutbox as DirectFileOutbox, Outbox } from "../src/file-job-queue.js";
import { DurableAuditLog as DirectAuditLog, FileCollaborationStore as DirectCollaborationStore, ProjectRepository as DirectProjectRepository } from "../src/file-stores.js";
import { InMemoryDatabaseAdapter as DirectDatabaseAdapter } from "../src/in-memory-database.js";
import { HmacIdentityVerifier as DirectIdentityVerifier } from "../src/local-identity.js";
import { EnvironmentSecretManager as DirectEnvironmentSecretManager, EnvironmentSecretProvider as DirectEnvironmentSecretProvider, SecretManager as DirectSecretManager, VaultSecretProvider as DirectVaultSecretProvider } from "../src/local-secrets.js";
import { InMemoryRateLimiter as DirectRateLimiter } from "../src/in-memory-rate-limiter.js";
import { SecurityReviewRunner as DirectSecurityReviewRunner } from "../src/security-review.js";

test("infrastructure modules expose clear local names and compatible legacy aliases", () => {
  assert.equal(FileJobQueue, DirectFileJobQueue);
  assert.equal(FileOutbox, DirectFileOutbox);
  assert.equal(DurableAuditLog, DirectAuditLog);
  assert.equal(FileCollaborationStore, DirectCollaborationStore);
  assert.equal(ProjectRepository, DirectProjectRepository);
  assert.equal(InMemoryDatabaseAdapter, DirectDatabaseAdapter);
  assert.equal(HmacIdentityVerifier, DirectIdentityVerifier);
  assert.equal(InMemoryRateLimiter, DirectRateLimiter);
  assert.equal(DistributedRateLimiter, InMemoryRateLimiter);
  assert.equal(SecurityReviewRunner, DirectSecurityReviewRunner);
  assert.equal(SecretManager, DirectSecretManager);
  assert.equal(EnvironmentSecretManager, DirectEnvironmentSecretManager);
  assert.equal(EnvironmentSecretProvider, DirectEnvironmentSecretProvider);
  assert.equal(VaultSecretProvider, DirectVaultSecretProvider);
  assert.equal(typeof Outbox, "function");
  assert.equal(ManagedDatabaseAdapter, InMemoryDatabaseAdapter);
  assert.equal(ManagedIdentityService, HmacIdentityVerifier);
  assert.equal(ManagedIdentityProvider, LocalIdentityProvider);
  assert.equal(ManagedAuthorizationService, LocalAuthorizationService);
  assert.equal(ManagedOutbox, FileOutbox);
});
