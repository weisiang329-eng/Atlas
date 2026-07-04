import { createServer } from "node:http";
import { loadConfig } from "./config.ts";
import { getHealth } from "./health.ts";

const config = loadConfig();

const server = createServer((request, response) => {
  if (request.method === "GET" && request.url === "/health") {
    response.writeHead(200, { "content-type": "application/json" });
    response.end(JSON.stringify(getHealth()));
    return;
  }

  response.writeHead(404, { "content-type": "application/json" });
  response.end(JSON.stringify({ error: "Not found" }));
});

server.listen(config.port, () => {
  console.log(`Atlas API listening on port ${config.port}`);
});
