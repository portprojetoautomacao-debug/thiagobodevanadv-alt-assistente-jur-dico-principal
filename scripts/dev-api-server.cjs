#!/usr/bin/env node
// Simple local API server for E2E testing
// Serves minimal endpoints required by tests: /api/pje-sync, /api/expedientes, /api/kv

const http = require("http");
const url = require("url");
const { StringDecoder } = require("string_decoder");
const PORT = process.env.DEV_API_PORT || 5252;

// In-memory store
const store = new Map();
store.set("api-keys:valid", new Set([process.env.TEST_PJE_API_KEY || "valid-test-api-key"]));
store.set("expedientes", []);
store.set("processos", []);

function getRedisValue(key) {
  return store.get(key) ?? null;
}

function setRedisValue(key, value) {
  store.set(key, value);
}

const server = http.createServer((req, res) => {
  const parsed = url.parse(req.url, true);
  const method = req.method || "GET";
  const pathname = parsed.pathname || "/";

  // helper to send JSON
  function sendJson(status, body) {
    res.writeHead(status, { "Content-Type": "application/json" });
    res.end(JSON.stringify(body));
  }

  // Read body if present
  const decoder = new StringDecoder("utf8");
  let buffer = "";
  req.on("data", (chunk) => {
    buffer += decoder.write(chunk);
  });
  req.on("end", () => {
    buffer += decoder.end();
    let body = {};
    try {
      if (buffer) body = JSON.parse(buffer);
    } catch (e) {
      body = {};
    }

    if (method === "POST" && pathname === "/api/kv") {
      const { key, value } = body;
      setRedisValue(key, value);
      return sendJson(200, { success: true });
    }

    if (method === "GET" && pathname === "/api/expedientes") {
      const exps = store.get("expedientes") || [];
      return sendJson(200, { expedientes: exps });
    }

    if (method === "POST" && pathname === "/api/pje-sync") {
      const apiKey = req.headers["x-api-key"];
      const valid = (store.get("api-keys:valid") || new Set()).has(apiKey);
      if (!apiKey || !valid) {
        return sendJson(401, { success: false, error: "Unauthorized" });
      }

      const { type, data } = body;

      if (type === "SYNC_PROCESSOS") {
        const processos = data || [];
        let syncedCount = 0;
        for (const p of processos) {
          const key = `processo:${p.numero}`;
          const existing = getRedisValue(key);
          const hasChange =
            !existing || existing.ultimoMovimento?.timestamp !== p.ultimoMovimento.timestamp;
          if (hasChange) {
            setRedisValue(key, p);
            syncedCount++;
            if (existing) {
              const expediente = {
                id: String(Math.random()).slice(2),
                processNumber: p.numeroFormatado || p.numero,
                description: p.ultimoMovimento.descricao,
                type: "intimacao",
                createdAt: new Date(p.ultimoMovimento.timestamp).toISOString(),
                source: "pje-extension",
                metadata: {
                  vara: p.vara,
                  comarca: p.comarca,
                  timestamp: p.ultimoMovimento.timestamp,
                  previousMovement: existing.ultimoMovimento.descricao,
                },
              };
              const exps = store.get("expedientes") || [];
              exps.unshift(expediente);
              store.set("expedientes", exps);
            }
          }
        }
        setRedisValue("processos:last_sync", Date.now());
        setRedisValue("processos:pje-extension", processos);
        return sendJson(200, { success: true, synced: syncedCount });
      }

      if (type === "SYNC_EXPEDIENTES") {
        const expedientes = data || [];
        const exps = store.get("expedientes") || [];
        for (const exp of expedientes) exps.unshift(exp);
        store.set("expedientes", exps);
        return sendJson(200, { success: true, created: expedientes.length });
      }

      return sendJson(400, { success: false, error: "Invalid type" });
    }

    if (method === "POST" && pathname === "/api/extension-errors") {
      const apiKey = req.headers["x-api-key"];
      // If API key is configured in store, validate
      const validKeys =
        store.get("api-keys:valid") ||
        new Set([process.env.TEST_PJE_API_KEY || "valid-test-api-key"]);
      if (validKeys.size && !validKeys.has(apiKey)) {
        return sendJson(401, { ok: false, error: "Unauthorized" });
      }
      const errors = store.get("extension-errors") || [];
      errors.unshift(body);
      store.set("extension-errors", errors);
      return sendJson(200, { ok: true });
    }

    if (method === "GET" && pathname === "/api/extension-errors") {
      const errors = store.get("extension-errors") || [];
      return sendJson(200, { ok: true, errors });
    }

    sendJson(404, { success: false, error: "Not found" });
  });
});

server.listen(PORT, () => {
  console.log(`Dev API server listening on http://127.0.0.1:${PORT}`);
});
