/**
 * Setup global de variáveis de ambiente para testes
 * Este arquivo é carregado automaticamente pelo Vitest antes de todos os testes
 */

// Mock de variáveis de ambiente essenciais
process.env.NODE_ENV = "test";

// API Keys (valores mock para testes)
process.env.RESEND_API_KEY = process.env.RESEND_API_KEY || "re_test_key_123";
process.env.GEMINI_API_KEY = process.env.GEMINI_API_KEY || "test-gemini-key";
process.env.AUTOGEN_API_KEY = process.env.AUTOGEN_API_KEY || "test-autogen-key";

// Hybrid Agents Configuration (necessário para testes de integração)
process.env.ENABLE_HYBRID_AGENTS = process.env.ENABLE_HYBRID_AGENTS || "true";
process.env.LANGGRAPH_API_URL = process.env.LANGGRAPH_API_URL || "http://localhost:8000";

// Redis (fallback para InMemory se não configurado)
process.env.UPSTASH_REDIS_REST_URL = process.env.UPSTASH_REDIS_REST_URL || "";
process.env.UPSTASH_REDIS_REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || "";

// DSPy Bridge (opcional para testes)
process.env.DSPY_BRIDGE_URL = process.env.DSPY_BRIDGE_URL || "";

// Qdrant (opcional para testes)
process.env.QDRANT_URL = process.env.QDRANT_URL || "";
process.env.QDRANT_API_KEY = process.env.QDRANT_API_KEY || "";

// Vercel (runtime)
process.env.VERCEL = process.env.VERCEL || "0";
process.env.VERCEL_ENV = process.env.VERCEL_ENV || "development";

// Log de ambiente para debug
if (process.env.DEBUG_TESTS === "true") {
  console.log("🧪 Test Environment Configured:");
  console.log("  NODE_ENV:", process.env.NODE_ENV);
  console.log("  RESEND_API_KEY:", process.env.RESEND_API_KEY?.substring(0, 10) + "...");
  console.log("  GEMINI_API_KEY:", process.env.GEMINI_API_KEY?.substring(0, 10) + "...");
  console.log("  Redis configured:", !!process.env.UPSTASH_REDIS_REST_URL);
  console.log("  DSPy configured:", !!process.env.DSPY_BRIDGE_URL);
  console.log("  Qdrant configured:", !!process.env.QDRANT_URL);
}
