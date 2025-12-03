import { createRequire } from "module";
const require = createRequire(import.meta.url);
const scanner = require("sonarqube-scanner");
const scannerFn =
  typeof scanner === "function"
    ? scanner
    : scanner.default || scanner.scan || scanner;

// Run SonarQube scanner using CommonJS module import
function runSonarScan() {
  scannerFn(
    {
      serverUrl: "https://sonarcloud.io",
      token: process.env.SONAR_TOKEN,
      options: {
            "sonar.projectKey": "thiagobodevan-a11y_assistente-juridico-p",
            "sonar.organization": "thiagobodevan-a11y-assistente-juridico-p",
        "sonar.sources": "src",
        "sonar.tests": "src",
        "sonar.test.inclusions":
          "src/**/*.test.ts,src/**/*.test.tsx,src/**/*.spec.ts,src/**/*.spec.tsx",
        "sonar.typescript.lcov.reportPaths": "coverage-api/lcov.info",
        "sonar.javascript.lcov.reportPaths": "coverage-api/lcov.info",
        "sonar.exclusions": "coverage/**,dist/**,node_modules/**",
      },
    },
    (err) => {
      if (err) {
        console.error("Sonar scan failed:", err);
        process.exit(1);
      }
      console.log("Sonar scan finished successfully");
      process.exit(0);
    }
  );
}

// Execute
runSonarScan();
