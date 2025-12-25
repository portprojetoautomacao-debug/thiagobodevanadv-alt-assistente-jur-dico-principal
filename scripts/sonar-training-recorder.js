#!/usr/bin/env node
/**
 * 🎓 Sonar Training Recorder
 * Registra padrões de correção do ESLint no sistema de training do Copilot
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TRAINING_DIR = path.join(__dirname, "..", ".sonar-copilot", "training");
const PATTERNS_DIR = path.join(TRAINING_DIR, "patterns");
const METADATA_FILE = path.join(TRAINING_DIR, "metadata.json");

// Criar diretórios se não existirem
if (!fs.existsSync(PATTERNS_DIR)) {
  fs.mkdirSync(PATTERNS_DIR, { recursive: true });
}

/**
 * Carrega metadata existente
 */
function loadMetadata() {
  if (fs.existsSync(METADATA_FILE)) {
    return JSON.parse(fs.readFileSync(METADATA_FILE, "utf8"));
  }
  return {
    version: "1.0.0",
    lastUpdated: new Date().toISOString(),
    totalPatterns: 0,
    approvedFixes: 0,
    rejectedFixes: 0,
    rules: {},
    files: {},
    authors: {},
    effectiveness: {
      autoFixSuccess: 0,
      manualReviewRequired: 0,
      rejected: 0,
    },
  };
}

/**
 * Salva metadata
 */
function saveMetadata(metadata) {
  metadata.lastUpdated = new Date().toISOString();
  fs.writeFileSync(METADATA_FILE, JSON.stringify(metadata, null, 2));
  console.log("✅ Metadata atualizado:", METADATA_FILE);
}

/**
 * Registra um padrão de correção
 */
function recordPattern(ruleId, filePath, before, after, context = {}) {
  const metadata = loadMetadata();

  // Sanitizar ruleId para nome de arquivo (remover caracteres especiais)
  const safeRuleId = ruleId.replace(/[^a-zA-Z0-9-_]/g, "-");

  // Criar arquivo de padrão para a regra
  const patternFile = path.join(PATTERNS_DIR, `${safeRuleId}.json`);
  let patterns = [];

  if (fs.existsSync(patternFile)) {
    patterns = JSON.parse(fs.readFileSync(patternFile, "utf8"));
  }

  // Adicionar novo padrão
  const pattern = {
    id: `${ruleId}-${Date.now()}`,
    ruleId,
    filePath,
    timestamp: new Date().toISOString(),
    before,
    after,
    context,
    effectiveness: "pending",
  };

  patterns.push(pattern);
  fs.writeFileSync(patternFile, JSON.stringify(patterns, null, 2));

  // Atualizar metadata
  metadata.totalPatterns++;
  metadata.approvedFixes++;

  if (!metadata.rules[ruleId]) {
    metadata.rules[ruleId] = { count: 0, files: [] };
  }
  metadata.rules[ruleId].count++;

  if (!metadata.rules[ruleId].files.includes(filePath)) {
    metadata.rules[ruleId].files.push(filePath);
  }

  if (!metadata.files[filePath]) {
    metadata.files[filePath] = { rules: [], fixes: 0 };
  }
  if (!metadata.files[filePath].rules.includes(ruleId)) {
    metadata.files[filePath].rules.push(ruleId);
  }
  metadata.files[filePath].fixes++;

  metadata.effectiveness.autoFixSuccess++;

  saveMetadata(metadata);

  console.log(`✅ Padrão registrado: ${ruleId} em ${filePath}`);
  return pattern;
}

/**
 * Analisa resultados do ESLint e registra correções
 */
function analyzeESLintResults(eslintOutput) {
  try {
    const results = JSON.parse(eslintOutput);
    let recorded = 0;

    results.forEach((result) => {
      if (result.messages && result.messages.length > 0) {
        result.messages.forEach((message) => {
          if (message.fix) {
            // Simular before/after baseado no fix
            const before = message.message;
            const after = "Fixed by ESLint";

            recordPattern(message.ruleId || "unknown", result.filePath, before, after, {
              severity: message.severity,
              line: message.line,
              column: message.column,
            });
            recorded++;
          }
        });
      }
    });

    console.log(`\n📊 Total de padrões registrados: ${recorded}`);
    return recorded;
  } catch (error) {
    console.error("❌ Erro ao analisar ESLint output:", error.message);
    return 0;
  }
}

/**
 * Gera relatório de training
 */
function generateReport() {
  const metadata = loadMetadata();

  console.log("\n╔═══════════════════════════════════════════════════════════╗");
  console.log("║        📊 RELATÓRIO DE TRAINING - SONAR COPILOT         ║");
  console.log("╚═══════════════════════════════════════════════════════════╝\n");

  console.log(`📅 Última atualização: ${metadata.lastUpdated}`);
  console.log(`📦 Total de padrões: ${metadata.totalPatterns}`);
  console.log(`✅ Fixes aprovados: ${metadata.approvedFixes}`);
  console.log(`❌ Fixes rejeitados: ${metadata.rejectedFixes}`);
  console.log(`🎯 Taxa de sucesso: ${metadata.effectiveness.autoFixSuccess}\n`);

  console.log("📋 Regras com mais padrões:");
  const topRules = Object.entries(metadata.rules)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 10);

  topRules.forEach(([rule, data], index) => {
    console.log(`  ${index + 1}. ${rule}: ${data.count} padrões (${data.files.length} arquivos)`);
  });

  console.log("\n📁 Arquivos com mais correções:");
  const topFiles = Object.entries(metadata.files)
    .sort((a, b) => b[1].fixes - a[1].fixes)
    .slice(0, 10);

  topFiles.forEach(([file, data], index) => {
    const fileName = path.basename(file);
    console.log(
      `  ${index + 1}. ${fileName}: ${data.fixes} correções (${data.rules.length} regras)`
    );
  });
}

// CLI
const command = process.argv[2];

if (command === "record" && process.argv[3]) {
  // Registrar padrão manual
  const ruleId = process.argv[3];
  const filePath = process.argv[4] || "manual";
  const before = process.argv[5] || "Before code";
  const after = process.argv[6] || "After code";

  recordPattern(ruleId, filePath, before, after);
} else if (command === "analyze" && process.argv[3]) {
  // Analisar output do ESLint
  const eslintOutput = fs.readFileSync(process.argv[3], "utf8");
  analyzeESLintResults(eslintOutput);
} else if (command === "report") {
  // Gerar relatório
  generateReport();
} else if (command === "test") {
  // Teste rápido
  console.log("🧪 Testando sistema de training...\n");

  recordPattern(
    "typescript-S1481",
    "src/test.ts",
    "const unused = 1;",
    "// removed unused variable",
    { severity: 2, line: 10 }
  );

  recordPattern(
    "typescript-S1117",
    "src/components/Test.tsx",
    "let duplicate = 1; let duplicate = 2;",
    "let duplicate = 1; let duplicate2 = 2;",
    { severity: 2, line: 20 }
  );

  recordPattern(
    "@typescript-eslint/no-explicit-any",
    "src/utils.ts",
    "function test(param: any) {}",
    "function test(param: unknown) {}",
    { severity: 1, line: 5 }
  );

  console.log("\n✅ Teste concluído! 3 padrões registrados.\n");
  generateReport();
} else {
  console.log(`
🎓 Sonar Training Recorder

Uso:
  node sonar-training-recorder.js test
    → Testa o sistema com padrões de exemplo

  node sonar-training-recorder.js record <ruleId> <filePath> <before> <after>
    → Registra um padrão manualmente

  node sonar-training-recorder.js analyze <eslint-output.json>
    → Analisa output do ESLint e registra padrões

  node sonar-training-recorder.js report
    → Gera relatório de training

Exemplos:
  node sonar-training-recorder.js test
  node sonar-training-recorder.js report
  node sonar-training-recorder.js record typescript-S1481 src/test.ts "const x=1" "// removed"
`);
}
