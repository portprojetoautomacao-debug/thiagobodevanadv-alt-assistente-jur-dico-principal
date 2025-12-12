import { execFile } from "child_process";
import path from "path";
import { describe, it } from "vitest";

// Este teste sobe um servidor dev real (Vite + API local) e faz chamadas HTTP reais.
// Para manter estabilidade da suíte padrão (modo manutenção), ele é OPT-IN.
// Rode manualmente com: RUN_LOCAL_REAL_TESTS=1 npm run test:run -- tests/integration/local-real.test.ts
const RUN_LOCAL_REAL_TESTS = process.env.RUN_LOCAL_REAL_TESTS === "1";
const describeIf = RUN_LOCAL_REAL_TESTS ? describe : describe.skip;

describeIf("local real integration tests (dev API)", () => {
  it(
    "should run the local dev server and validate extension-errors endpoints",
    async () => {
      const scriptPath = path.join(process.cwd(), "scripts", "run-local-real-tests.sh");

      // Garantir que variáveis de ambiente necessárias estejam definidas
      const testEnv = {
        ...process.env,
        TEST_PJE_API_KEY: process.env.TEST_PJE_API_KEY || "valid-test-api-key",
        DEV_API_PORT: process.env.DEV_API_PORT || "5252",
        VITE_PORT: process.env.VITE_PORT || "5173",
      };

      await new Promise<void>((resolve, reject) => {
        const proc = execFile(
          "bash",
          [scriptPath],
          {
            cwd: process.cwd(),
            env: testEnv,
            maxBuffer: 1024 * 1024 * 10, // 10MB buffer para logs
          },
          (err, stdout, stderr) => {
            // For debugging, we attach logs
            console.log("=== stdout ===\n" + stdout);
            console.error("=== stderr ===\n" + stderr);
            if (err) {
              console.error(`Process exited with code ${err.code || "unknown"}`);
              return reject(err);
            }
            resolve();
          }
        );

        // Set a generous timeout (8 minutes) in case dev server takes more time in CI
        const timer = setTimeout(
          () => {
            console.warn("Test timeout reached, killing process...");
            proc.kill("SIGKILL"); // Use SIGKILL para garantir que mata o processo
            reject(new Error("Local real test timed out after 8 minutes"));
          },
          1000 * 60 * 8
        );

        proc.on("exit", (code) => {
          clearTimeout(timer);
          if (code && code !== 0) {
            console.warn(`Process exited with non-zero code: ${code}`);
          }
        });
      });
    },
    1000 * 60 * 10 // 10 minutes test timeout (mais generoso que o timeout interno)
  );
});
