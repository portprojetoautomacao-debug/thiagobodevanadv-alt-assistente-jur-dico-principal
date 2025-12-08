import { execFile } from "child_process";
import path from "path";
import { describe, it } from "vitest";

describe("local real integration tests (dev API)", () => {
  it(
    "should run the local dev server and validate extension-errors endpoints",
    async () => {
      const scriptPath = path.join(process.cwd(), "scripts", "run-local-real-tests.sh");
      await new Promise<void>((resolve, reject) => {
        const proc = execFile(
          "bash",
          [scriptPath],
          { cwd: process.cwd(), env: { ...process.env } },
          (err, stdout, stderr) => {
            // For debugging, we attach logs
            // eslint-disable-next-line no-console
            console.log("=== stdout ===\n" + stdout);
            // eslint-disable-next-line no-console
            console.error("=== stderr ===\n" + stderr);
            if (err) return reject(err);
            resolve();
          }
        );

        // Set a generous timeout (3 minutes) in case dev server takes more time locally
        const timer = setTimeout(
          () => {
            proc.kill("SIGTERM");
            reject(new Error("Local real test timed out"));
          },
          1000 * 60 * 3
        );
        proc.on("exit", () => clearTimeout(timer));
      });
    },
    1000 * 60 * 4
  );
});
