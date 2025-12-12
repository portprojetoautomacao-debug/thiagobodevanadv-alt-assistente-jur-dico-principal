const { spawn } = require("child_process");
const path = require("path");

const host = process.env.HOST || "127.0.0.1";
const port = process.env.PORT || "5173";
const apiPort = process.env.DEV_API_PORT || "5252";

console.log(`Starting Vite dev server on ${host}:${port} and local API on ${apiPort}...`);

// Evita "npx" (que cria processos netos difíceis de encerrar). Rodamos o bin do Vite diretamente.
let viteBin;
try {
  viteBin = require.resolve("vite/bin/vite.js");
} catch (e) {
  console.error("Failed to resolve Vite binary. Is vite installed?");
  process.exit(1);
}

// Usar processos em grupos separados para conseguirmos encerrar toda a árvore no shutdown.
const vite = spawn(process.execPath, [viteBin, "--host", host, "--port", port], {
  stdio: "inherit",
  cwd: process.cwd(),
  env: { ...process.env, NODE_ENV: "development" },
  detached: true,
});

const api = spawn(process.execPath, [path.join(__dirname, "dev-api-server.cjs")], {
  stdio: "inherit",
  cwd: process.cwd(),
  env: { ...process.env, DEV_API_PORT: apiPort },
  detached: true,
});

function killProcessGroup(child, signal) {
  if (!child || !child.pid) return;
  try {
    // pid negativo -> envia sinal para o grupo do processo (requer detached: true).
    process.kill(-child.pid, signal);
  } catch (e) {
    try {
      child.kill(signal);
    } catch {
      // ignore
    }
  }
}

let shuttingDown = false;
function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;

  killProcessGroup(vite, "SIGTERM");
  killProcessGroup(api, "SIGTERM");

  // Se algo ficar travado, força encerramento após um pequeno grace period.
  setTimeout(() => {
    killProcessGroup(vite, "SIGKILL");
    killProcessGroup(api, "SIGKILL");
    process.exit(0);
  }, 1500).unref();
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("exit", () => {
  // Melhor esforço: não deixar processos órfãos se o parent morrer.
  try {
    killProcessGroup(vite, "SIGTERM");
    killProcessGroup(api, "SIGTERM");
  } catch {
    // ignore
  }
});
