export class RevisionConflictError extends Error {
  constructor(expected, actual) {
    super(`Revision conflict: expected ${expected}, found ${actual}`);
    this.name = "RevisionConflictError";
  }
}

export class KnowledgeStore {
  constructor(initialState = {}) {
    this.state = structuredClone(initialState);
    this.revision = 0;
    this.events = [];
  }

  snapshot() {
    return {
      revision: this.revision,
      state: structuredClone(this.state),
      events: structuredClone(this.events)
    };
  }

  apply(proposal) {
    if (!proposal || typeof proposal !== "object") {
      throw new TypeError("A synchronization proposal is required");
    }
    if (proposal.expectedRevision !== this.revision) {
      throw new RevisionConflictError(proposal.expectedRevision, this.revision);
    }
    const operation = proposal.operation;
    if (!operation || typeof operation !== "object" || operation.type !== "append" ||
        typeof operation.path !== "string" || !Object.hasOwn(this.state, operation.path) ||
        !Array.isArray(this.state[operation.path])) {
      throw new TypeError("A typed append operation is required");
    }

    const nextState = structuredClone(this.state);
    nextState[operation.path] = [...nextState[operation.path], structuredClone(operation.value)];
    if (!nextState || typeof nextState !== "object") {
      throw new TypeError("A proposal must return a state object");
    }

    this.state = nextState;
    this.revision += 1;
    this.events.push({
      revision: this.revision,
      type: proposal.type ?? "knowledge.update",
      actor: proposal.actor ?? "unknown",
      evidence: Array.isArray(proposal.evidence) ? [...proposal.evidence] : [],
      createdAt: new Date().toISOString()
    });
    return this.snapshot();
  }
}
