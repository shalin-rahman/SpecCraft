export class SecurityReviewRunner {
  constructor(rules = []) {
    this.rules = [
      {
        id: "secret-literal",
        severity: "high",
        pattern: /(?:AKIA[0-9A-Z]{16}|AIza[0-9A-Za-z\-_]{35}|gh[pousr]_[A-Za-z0-9]{20,}|-----BEGIN [A-Z ]*PRIVATE KEY-----|token\s*[:=]\s*["'][^"']+["'])/i,
        summary: "Potential secret or credential literal present in code or config."
      },
      {
        id: "unsafe-sql",
        severity: "high",
        pattern: /SELECT\s+.*\s+FROM\s+.*\s+WHERE\s+.*\$\{|\bEXEC\s*\(|\bsp_executesql\b/i,
        summary: "Potential SQL injection or unsafe dynamic query pattern."
      },
      {
        id: "path-traversal",
        severity: "medium",
        pattern: /\.\.[\\/]|%2e%2e[\\/]/i,
        summary: "Path traversal or unsafe relative path pattern detected."
      },
      {
        id: "http-insecure",
        severity: "medium",
        pattern: /https?:\/\/(?!localhost|127\.0\.0\.1|0\.0\.0\.0)/i,
        summary: "Remote provider or service call is not restricted to HTTPS in a production configuration."
      },
      ...rules
    ];
  }

  scanText(text, context = "source") {
    const findings = [];
    for (const rule of this.rules) {
      const matches = text.match(rule.pattern);
      if (!matches) continue;
      findings.push({
        id: rule.id,
        severity: rule.severity,
        context,
        summary: rule.summary
      });
    }
    return {
      context,
      findings,
      passed: findings.length === 0,
      riskLevel: findings.some((finding) => finding.severity === "high") ? "high" : findings.length > 0 ? "medium" : "low"
    };
  }

  scanFiles(files) {
    return files.map(({ path, content }) => this.scanText(content, path));
  }
}
