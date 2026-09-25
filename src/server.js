import { createPlatformServer } from "./platform-http.js";

const port = Number(process.env.PORT ?? 8787);
const server = createPlatformServer();

server.listen(port, "127.0.0.1", () => {
  console.log(`SpecCraft platform listening on http://127.0.0.1:${port}`);
});
