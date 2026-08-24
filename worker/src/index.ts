import "dotenv/config";
import http from "http";

import "./workers/risk.worker";

const PORT = Number(process.env.PORT || 10000);

const server = http.createServer((_req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/plain",
  });

  res.end("AI Supply Chain Worker is running");
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Worker health server listening on port ${PORT}`);
});

console.log("AI Supply Chain Worker started");