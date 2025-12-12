import { execFile } from "child_process";
import path from "path";
import { describe, it } from "vitest";

// Este teste sobe um servidor dev real e faz chamadas HTTP reais.
// Para manter estabilidade da suíte padrão (modo manutenção), ele é OPT-IN.
// Rode manualmente com: npm run test:integration:local-real
const RUN_LOCAL_REAL_TESTS = process.env.RUN_LOCAL_REAL_TESTS === "1";
const describeIf = RUN_LOCAL_REAL_TESTS ? describe : describe.skip;

describeIf("extension-errors local E2E", () => {
  it(
    "runs the local script and validates the flow",
    async () => {
      const scriptPath = path.join(process.cwd(), "scripts", "run-local-real-tests.sh");
      await new Promise<void>((resolve, reject) => {
        const proc = execFile(
          "bash",
          [scriptPath],
          { cwd: process.cwd(), env: { ...process.env } },
          (err, stdout, stderr) => {
            console.log(stdout);
            console.error(stderr);
            if (err) return reject(err);
            resolve();
          }
        );

        const timer = setTimeout(
          () => {
            proc.kill("SIGTERM");
            reject(new Error("E2E local test timed out"));
          },
          1000 * 60 * 3
        );
        proc.on("exit", () => clearTimeout(timer));
      });
    },
    1000 * 60 * 4
  );
});
