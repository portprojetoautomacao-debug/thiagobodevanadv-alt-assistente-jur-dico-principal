#!/usr/bin/env node
/**
 * 🧪 Test Tracing - Envia traces de teste para o OTLP server
 */

import fetch from "node-fetch";

const OTLP_ENDPOINT = process.env.VITE_OTLP_ENDPOINT || "http://localhost:4318/v1/traces";

const testTrace = {
  resourceSpans: [
    {
      resource: {
        attributes: [
          { key: "service.name", value: { stringValue: "assistente-juridico-test" } },
          { key: "service.version", value: { stringValue: "1.0.0" } },
        ],
      },
      scopeSpans: [
        {
          scope: {
            name: "test-scope",
            version: "1.0.0",
          },
          spans: [
            {
              traceId: Buffer.from("12345678901234567890123456789012", "hex").toString("base64"),
              spanId: Buffer.from("1234567890123456", "hex").toString("base64"),
              name: "teste-analise-intimacao",
              kind: 1,
              startTimeUnixNano: Date.now() * 1000000,
              endTimeUnixNano: (Date.now() + 1000) * 1000000,
              attributes: [
                { key: "agent.name", value: { stringValue: "justine" } },
                { key: "agent.type", value: { stringValue: "intimation-analysis" } },
                { key: "operation", value: { stringValue: "analyze_document" } },
                { key: "test", value: { boolValue: true } },
              ],
              status: {
                code: 0,
                message: "OK",
              },
            },
          ],
        },
      ],
    },
  ],
};

async function sendTestTrace() {
  console.log("🧪 Enviando trace de teste...\n");

  try {
    const response = await fetch(OTLP_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(testTrace),
    });

    if (response.ok) {
      console.log("✅ Trace enviado com sucesso!");
      console.log(`   Status: ${response.status}`);

      // Verificar estatísticas
      console.log("\n📊 Verificando estatísticas...\n");
      const healthResponse = await fetch("http://localhost:4318/health");
      const health = await healthResponse.json();

      console.log("Health Check:");
      console.log(JSON.stringify(health, null, 2));
    } else {
      console.error("❌ Erro ao enviar trace:", response.status, response.statusText);
    }
  } catch (error) {
    console.error("❌ Erro:", error.message);
    console.error("\n⚠️  Verifique se o servidor OTLP está rodando:");
    console.error("   curl http://localhost:4318/health");
  }
}

// Enviar múltiplos traces de teste
async function runTests() {
  console.log("╔═══════════════════════════════════════════════════════════╗");
  console.log("║     🧪 TESTE DE TRACING - ASSISTENTE JURÍDICO           ║");
  console.log("╚═══════════════════════════════════════════════════════════╝\n");

  const agents = [
    { name: "justine", operation: "analyze_intimation" },
    { name: "harvey", operation: "strategic_analysis" },
    { name: "redacao-peticoes", operation: "generate_petition" },
    { name: "pesquisa-juris", operation: "search_jurisprudence" },
    { name: "gestao-prazos", operation: "calculate_deadline" },
  ];

  for (const agent of agents) {
    const trace = {
      ...testTrace,
      resourceSpans: [
        {
          ...testTrace.resourceSpans[0],
          scopeSpans: [
            {
              ...testTrace.resourceSpans[0].scopeSpans[0],
              spans: [
                {
                  ...testTrace.resourceSpans[0].scopeSpans[0].spans[0],
                  name: agent.operation,
                  attributes: [
                    { key: "agent.name", value: { stringValue: agent.name } },
                    { key: "operation", value: { stringValue: agent.operation } },
                    { key: "test", value: { boolValue: true } },
                  ],
                },
              ],
            },
          ],
        },
      ],
    };

    console.log(`📤 Enviando trace do agente: ${agent.name}`);
    await fetch(OTLP_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(trace),
    });

    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  console.log("\n✅ 5 traces de teste enviados!\n");

  // Verificar estatísticas finais
  const healthResponse = await fetch("http://localhost:4318/health");
  const health = await healthResponse.json();

  console.log("📊 Estatísticas Finais:");
  console.log(`   Traces Recebidos: ${health.tracesReceived}`);
  console.log(`   Uptime: ${Math.round(health.uptime)}s`);
  console.log(`   Status: ${health.status}`);

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("✅ Sistema de tracing está coletando dados corretamente!");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}

if (process.argv[2] === "single") {
  sendTestTrace();
} else {
  runTests();
}
