import { check } from "k6";
import http from "k6/http";

/**
 * K6 Load Test - Heavy Processor Microservice
 *
 * Baseado no artigo: "Aumentando o rendimento em 50x"
 * Testa a performance do microserviço com Virtual Threads
 */

export const options = {
  scenarios: {
    constant_request_rate: {
      executor: "constant-arrival-rate",
      rate: 1000, // 1000 requests
      timeUnit: "1s", // per second
      duration: "6s", // total duration
      preAllocatedVUs: 500,
      maxVUs: 1000,
    },
  },
  thresholds: {
    http_req_duration: ["p(95)<5000"], // 95% das requests em < 5s
    http_req_failed: ["rate<0.01"], // < 1% de falhas
  },
};

const BASE_URL = __ENV.HEAVY_PROCESSOR_URL || "http://localhost:8080";

export default function () {
  // Simula processamento de 10 expedientes em paralelo
  const payload = JSON.stringify({
    expedientes: generateExpedientes(10),
    operation: "bulk-analysis",
    options: {
      parallel: true,
      priority: "normal",
    },
  });

  const params = {
    headers: {
      "Content-Type": "application/json",
    },
    timeout: "30s",
  };

  const response = http.post(`${BASE_URL}/api/v1/process/batch`, payload, params);

  check(response, {
    "status is 200": (r) => r.status === 200,
    "response has success": (r) => {
      const body = JSON.parse(r.body);
      return body.success === true;
    },
    "response time < 5s": (r) => r.timings.duration < 5000,
    "has results": (r) => {
      const body = JSON.parse(r.body);
      return body.results && body.results.length > 0;
    },
  });
}

function generateExpedientes(count) {
  const expedientes = [];
  for (let i = 0; i < count; i++) {
    expedientes.push({
      id: `exp-${Date.now()}-${i}`,
      tipo: Math.random() > 0.5 ? "intimacao" : "documento",
      conteudo: generateRandomContent(),
      processId: `proc-${Math.floor(Math.random() * 1000)}`,
      dataRecebimento: new Date().toISOString(),
      urgente: Math.random() > 0.7,
    });
  }
  return expedientes;
}

function generateRandomContent() {
  const sentences = [
    "Intimação para apresentar recurso no prazo de 15 dias.",
    "Documento processual referente ao processo nº 0001234-56.2024.8.02.0001",
    "Citação do réu para apresentar defesa.",
    "Despacho determinando perícia técnica.",
    "Sentença de mérito transitada em julgado.",
  ];
  return sentences[Math.floor(Math.random() * sentences.length)];
}

// Teste de warmup
export function setup() {
  console.log("🔥 Warming up...");
  const warmup = http.get(`${BASE_URL}/actuator/health`);
  check(warmup, {
    "service is up": (r) => r.status === 200,
  });
}

// Relatório final
export function handleSummary(data) {
  console.log("📊 RESULTADOS DO TESTE\n");
  console.log(`Requests total: ${data.metrics.http_reqs.values.count}`);
  console.log(`Requests/s: ${data.metrics.http_reqs.values.rate.toFixed(2)}`);
  console.log(`Duração média: ${data.metrics.http_req_duration.values.avg.toFixed(2)}ms`);
  console.log(`p(95): ${data.metrics.http_req_duration.values["p(95)"].toFixed(2)}ms`);
  console.log(`p(99): ${data.metrics.http_req_duration.values["p(99)"].toFixed(2)}ms`);
  console.log(`Falhas: ${data.metrics.http_req_failed.values.rate * 100}%`);

  return {
    stdout: JSON.stringify(data, null, 2),
    "summary.json": JSON.stringify(data, null, 2),
  };
}
