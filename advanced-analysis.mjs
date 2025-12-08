#!/usr/bin/env node
/**
 * Análise Avançada Simplificada usando API SonarCloud
 * (Alternativa ao MCP que tem protocolo complexo stdio/jsonrpc)
 */

const SONAR_CONFIG = {
  url: "https://sonarcloud.io",
  token: "405bd014cbac226c756dcff6e201e0fdfde36e23",
  projectKey: "thiagobodevan-a11y_assistente-juridico-p",
  organization: "thiagobodevan-a11y",
};

console.log("╔══════════════════════════════════════════════════════╗");
console.log("║   📊 ANÁLISE AVANÇADA SONARCLOUD                    ║");
console.log("╚══════════════════════════════════════════════════════╝\n");

async function fetch(url, options = {}) {
  const { default: nodeFetch } = await import("node-fetch");
  return nodeFetch(url, options);
}

function createAuthHeader() {
  return "Basic " + Buffer.from(`${SONAR_CONFIG.token}:`).toString("base64");
}

async function apiCall(endpoint, params = {}) {
  const url = new URL(`${SONAR_CONFIG.url}/api/${endpoint}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.append(key, value);
    }
  });

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: createAuthHeader(),
    },
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}

async function analyzeMetrics() {
  console.log("📊 1. MÉTRICAS DO PROJETO");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  const metrics = await apiCall("measures/component", {
    component: SONAR_CONFIG.projectKey,
    metricKeys: [
      "bugs",
      "vulnerabilities",
      "code_smells",
      "coverage",
      "duplicated_lines_density",
      "ncloc",
      "complexity",
      "cognitive_complexity",
      "security_hotspots",
      "reliability_rating",
      "security_rating",
      "sqale_rating",
    ].join(","),
  });

  console.log(`📦 Projeto: ${metrics.component.name}`);
  console.log(`🔑 Key: ${metrics.component.key}`);
  console.log(`📏 Qualifier: ${metrics.component.qualifier}\n`);

  console.log("📈 Métricas:");
  metrics.component.measures.forEach((m) => {
    const labels = {
      bugs: "🐛 Bugs",
      vulnerabilities: "🔒 Vulnerabilidades",
      code_smells: "👃 Code Smells",
      coverage: "📊 Cobertura",
      duplicated_lines_density: "📋 Duplicação",
      ncloc: "📄 Linhas de Código",
      complexity: "🔀 Complexidade",
      cognitive_complexity: "🧠 Complexidade Cognitiva",
      security_hotspots: "🔥 Security Hotspots",
      reliability_rating: "⭐ Confiabilidade",
      security_rating: "🔐 Segurança",
      sqale_rating: "🏆 Manutenibilidade",
    };
    console.log(`  ${labels[m.metric] || m.metric}: ${m.value}`);
  });
  console.log();
}

async function analyzeCriticalIssues() {
  console.log("🐛 2. ISSUES CRÍTICOS");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  const issues = await apiCall("issues/search", {
    componentKeys: SONAR_CONFIG.projectKey,
    severities: "CRITICAL,BLOCKER",
    resolved: "false",
    ps: 10,
  });

  console.log(`📊 Total de issues críticos: ${issues.total}`);
  console.log(`📄 Exibindo: ${issues.issues.length}\n`);

  issues.issues.forEach((issue, idx) => {
    const file = issue.component.split(":")[1];
    console.log(`${idx + 1}. ${issue.severity} - ${issue.type}`);
    console.log(`   📁 ${file}:${issue.line || "N/A"}`);
    console.log(`   💬 ${issue.message}`);
    console.log(`   🏷️  Rule: ${issue.rule}`);
    console.log();
  });
}

async function analyzeSecurityHotspots() {
  console.log("🔥 3. SECURITY HOTSPOTS");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  const hotspots = await apiCall("hotspots/search", {
    projectKey: SONAR_CONFIG.projectKey,
    ps: 10,
  });

  console.log(`📊 Total de security hotspots: ${hotspots.paging.total}`);
  console.log(`📄 Exibindo: ${hotspots.hotspots.length}\n`);

  hotspots.hotspots.forEach((hotspot, idx) => {
    const file = hotspot.component.split(":")[1];
    console.log(`${idx + 1}. ${hotspot.vulnerabilityProbability} - ${hotspot.securityCategory}`);
    console.log(`   📁 ${file}:${hotspot.line}`);
    console.log(`   💬 ${hotspot.message}`);
    console.log(`   🏷️  Rule: ${hotspot.ruleKey}`);
    console.log();
  });
}

async function analyzeQualityGate() {
  console.log("🚪 4. QUALITY GATE");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  const qualityGate = await apiCall("qualitygates/project_status", {
    projectKey: SONAR_CONFIG.projectKey,
  });

  const status = qualityGate.projectStatus.status;
  const emoji = status === "OK" ? "✅" : status === "WARN" ? "⚠️" : "❌";

  console.log(`${emoji} Status: ${status}\n`);

  if (qualityGate.projectStatus.conditions) {
    console.log("📋 Condições:");
    qualityGate.projectStatus.conditions.forEach((cond) => {
      const condEmoji = cond.status === "OK" ? "✅" : cond.status === "WARN" ? "⚠️" : "❌";
      console.log(
        `  ${condEmoji} ${cond.metricKey}: ${cond.actualValue} (limite: ${cond.errorThreshold || cond.warningThreshold})`
      );
    });
  }
  console.log();
}

async function analyzeTechnicalDebt() {
  console.log("💰 5. DÍVIDA TÉCNICA");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  const debt = await apiCall("measures/component", {
    component: SONAR_CONFIG.projectKey,
    metricKeys: "sqale_index,sqale_debt_ratio,effort_to_reach_maintainability_rating_a",
  });

  debt.component.measures.forEach((m) => {
    if (m.metric === "sqale_index") {
      const minutes = parseInt(m.value);
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 8);
      console.log(`⏱️  Dívida Técnica Total: ${minutes}min (${hours}h ou ${days} dias úteis)`);
    }
    if (m.metric === "sqale_debt_ratio") {
      console.log(`📊 Razão de Dívida: ${m.value}%`);
    }
    if (m.metric === "effort_to_reach_maintainability_rating_a") {
      console.log(`🎯 Esforço para Rating A: ${m.value}min`);
    }
  });
  console.log();
}

async function runFullAnalysis() {
  try {
    await analyzeMetrics();
    await analyzeCriticalIssues();
    await analyzeSecurityHotspots();
    await analyzeQualityGate();
    await analyzeTechnicalDebt();

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("✅ Análise completa finalizada!");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  } catch (error) {
    console.error("\n❌ Erro na análise:", error.message);
    process.exit(1);
  }
}

runFullAnalysis();
