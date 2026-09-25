export class PlatformAdapter {
  constructor(service) {
    this.service = service;
  }

  async getProjectSnapshot(root) {
    return this.service.analyze(root);
  }

  async getContext(analysis, query) {
    return this.service.context(analysis, query);
  }

  async getFindings(analysis) {
    return {
      candidates: this.service.reconstruct(analysis),
      drift: analysis.drift ?? null
    };
  }

  async submitProposal(proposal, expectedRevision, currentRevision) {
    if (expectedRevision !== currentRevision) {
      throw new Error("Revision conflict: refresh the project before applying this proposal");
    }
    return {
      ...proposal,
      status: "pending-review",
      expectedRevision,
      createdAt: new Date().toISOString()
    };
  }
}
