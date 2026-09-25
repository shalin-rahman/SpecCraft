export class ParserRegistry {
  constructor(parsers = new Map()) {
    this.parsers = parsers;
  }

  register(language, parser) {
    if (!parser || typeof parser.parse !== "function") throw new TypeError("Parser must expose parse(file)");
    this.parsers.set(language, parser);
  }

  parse(file) {
    const parser = this.parsers.get(file.language);
    if (!parser) {
      return { symbols: [], diagnostics: [{ severity: "warning", message: `No parser registered for ${file.language}` }] };
    }
    return parser.parse(file);
  }
}
