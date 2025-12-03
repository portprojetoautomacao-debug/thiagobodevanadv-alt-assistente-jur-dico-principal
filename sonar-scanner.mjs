// Minimal, robust ESM wrapper for 'sonarqube-scanner' supporting various exports
(async () => {
  const options = {
    serverUrl: "https://sonarcloud.io",
    token: process.env.SONAR_TOKEN,
    options: {
      "sonar.projectKey": "thiagobodevan-a11y_assistente-juridico-p",
      "sonar.organization": "thiagobodevan-a11y",
      "sonar.sources": "src",
      "sonar.tests": "src",
      "sonar.test.inclusions":
        "src/**/*.test.ts,src/**/*.test.tsx,src/**/*.spec.ts,src/**/*.spec.tsx",
      "sonar.typescript.lcov.reportPaths": "coverage-api/lcov.info",
      "sonar.javascript.lcov.reportPaths": "coverage-api/lcov.info",
      "sonar.exclusions": "coverage/**,dist/**,node_modules/**",
    },
  };

  try {
    const module = await import("sonarqube-scanner");
    // Module can export a promise-based 'scan' function or a callback-based default
    const scanPromise = module?.scan || module?.default?.scan;
    const callbackScanner =
      module?.default?.default || module?.default || module;

    if (typeof scanPromise === "function") {
      console.log("Using async scan function from module.scan");
      await scanPromise(options);
      console.log("Sonar scan finished (promise)");
      process.exit(0);
    }

    if (typeof callbackScanner === "function") {
      console.log("Using callback scanner function (callbackScanner)");
      callbackScanner(options, () => {
        console.log("Sonar scan finished (callback)");
        process.exit(0);
      });
      return;
    }

    console.error("No scanner function available in sonarqube-scanner module");
    process.exit(1);
  } catch (err) {
    console.error("Sonar scan failed", err);
    process.exit(1);
  }
})()(
  // Simple ESM wrapper for importing and invoking sonarqube-scanner
  async () => {
    try {
      const sm = await import("sonarqube-scanner");

      // Prefer the promise-based 'scan' export if available
      const scanPromise =
        sm.scan ||
        (sm.default && sm.default.scan) ||
        (sm.default && sm.default.default && sm.default.default.scan);

      const scannerCallback =
        (sm.default && sm.default.default) || sm.default || sm;

      const options = {
        serverUrl: "https://sonarcloud.io",
        token: process.env.SONAR_TOKEN,
        options: {
          "sonar.projectKey": "thiagobodevan-a11y_assistente-juridico-p",
          "sonar.organization": "thiagobodevan-a11y",
          "sonar.sources": "src",
          "sonar.tests": "src",
          "sonar.test.inclusions":
            "src/**/*.test.ts,src/**/*.test.tsx,src/**/*.spec.ts,src/**/*.spec.tsx",
          "sonar.typescript.lcov.reportPaths": "coverage-api/lcov.info",
          "sonar.javascript.lcov.reportPaths": "coverage-api/lcov.info",
          "sonar.exclusions": "coverage/**,dist/**,node_modules/**",
        },
      };

      if (typeof scanPromise === "function") {
        console.log("Using promise-based scan function");
        await scanPromise(options);
        console.log("Sonar scan finished (promise)");
        process.exit(0);
      }

      if (typeof scannerCallback === "function") {
        console.log("Using callback-based scanner");
        scannerCallback(options, () => {
          console.log("Sonar scan finished (callback)");
          process.exit(0);
        });
        return;
      }

      console.error(
        "Could not find a function to execute the Sonar scan in module exports"
      );
      process.exit(1);
    } catch (err) {
      console.error("Failed to import or run sonarqube-scanner", err);
      process.exit(1);
    }
  }
)()(
  // ESM wrapper to dynamically import the CommonJS 'sonarqube-scanner' package
  async function () {
    const scannerModule = await import("sonarqube-scanner");
    const scanFn =
      scannerModule.scan ||
      (scannerModule.default && scannerModule.default.default) ||
      scannerModule.default;

    try {
      await scanFn({
        serverUrl: "https://sonarcloud.io",
        token: process.env.SONAR_TOKEN,
        options: {
          "sonar.projectKey": "thiagobodevan-a11y_assistente-juridico-p",
          "sonar.organization": "thiagobodevan-a11y",
          "sonar.sources": "src",
          "sonar.tests": "src",
          "sonar.test.inclusions":
            "src/**/*.test.ts,src/**/*.test.tsx,src/**/*.spec.ts,src/**/*.spec.tsx",
          "sonar.typescript.lcov.reportPaths": "coverage-api/lcov.info",
          "sonar.javascript.lcov.reportPaths": "coverage-api/lcov.info",
          "sonar.exclusions": "coverage/**,dist/**,node_modules/**",
        },
      });
      console.log("Sonar scan finished");
      process.exit(0);
    } catch (err) {
      console.error("Sonar scan failed", err);
      process.exit(1);
    }
  }
)()(
  // ESM wrapper to dynamically import the CommonJS 'sonarqube-scanner' package
  async function () {
    const scannerModule = await import("sonarqube-scanner");
    const scanner = scannerModule.default || scannerModule;

    scanner(
      {
        serverUrl: "https://sonarcloud.io",
        token: process.env.SONAR_TOKEN,
        options: {
          "sonar.projectKey": "thiagobodevan-a11y_assistente-juridico-p",
          "sonar.organization": "thiagobodevan-a11y",
          "sonar.sources": "src",
          "sonar.tests": "src",
          "sonar.test.inclusions":
            "src/**/*.test.ts,src/**/*.test.tsx,src/**/*.spec.ts,src/**/*.spec.tsx",
          "sonar.typescript.lcov.reportPaths": "coverage-api/lcov.info",
          "sonar.javascript.lcov.reportPaths": "coverage-api/lcov.info",
          "sonar.exclusions": "coverage/**,dist/**,node_modules/**",
        },
      },
      () => {
        console.log("Sonar scan finished");
        process.exit();
      }
    );
  }
)();
import scanner from "sonarqube-scanner";

scanner(
  {
    serverUrl: "https://sonarcloud.io",
    token: process.env.SONAR_TOKEN,
    options: {
      "sonar.projectKey": "thiagobodevan-a11y_assistente-juridico-p",
      "sonar.organization": "thiagobodevan-a11y",
      "sonar.sources": "src",
      "sonar.tests": "src",
      "sonar.test.inclusions":
        "src/**/*.test.ts,src/**/*.test.tsx,src/**/*.spec.ts,src/**/*.spec.tsx",
      "sonar.typescript.lcov.reportPaths": "coverage-api/lcov.info",
      "sonar.javascript.lcov.reportPaths": "coverage-api/lcov.info",
      "sonar.exclusions": "coverage/**,dist/**,node_modules/**",
    },
  },
  () => {
    console.log("Sonar scan finished");
    process.exit();
  }
);
