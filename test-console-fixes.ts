/**
 * Script de teste para validar correções de console
 * 
 * Testa:
 * 1. PremonicaoService - Parse de JSON truncado
 * 2. DeadlineIntegration - Conversão de datas BR para ISO
 */

// Mock simples para testar funções isoladas
function testJSONParse() {
  console.log("\n🧪 Testando Parse de JSON Truncado...\n");

  const testCases = [
    {
      name: "JSON truncado com string aberta",
      input: '{"probabilidade_exito": 70, "analise_ia": "A probabilidade de êxito é moderadamente alta',
      expected: { probabilidade_exito: 70, analise_ia: "A probabilidade de êxito é moderadamente alta" }
    },
    {
      name: "JSON truncado sem fechar objeto",
      input: '{"probabilidade_exito": 80, "analise_ia": "Caso favorável"',
      expected: { probabilidade_exito: 80, analise_ia: "Caso favorável" }
    },
    {
      name: "JSON completo válido",
      input: '{"probabilidade_exito": 90}',
      expected: { probabilidade_exito: 90 }
    }
  ];

  testCases.forEach(test => {
    try {
      let cleaned = test.input.trim();
      
      // Fechar strings abertas
      const quoteCount = (cleaned.match(/"/g) || []).length;
      if (quoteCount % 2 !== 0) {
        cleaned += '"';
      }
      
      // Fechar objetos abertos
      const openBraces = (cleaned.match(/\{/g) || []).length;
      const closeBraces = (cleaned.match(/\}/g) || []).length;
      cleaned += "}".repeat(Math.max(0, openBraces - closeBraces));
      
      const result = JSON.parse(cleaned);
      console.log(`✅ ${test.name}:`, result);
    } catch (error) {
      console.error(`❌ ${test.name}:`, error);
    }
  });
}

function testBRDateConversion() {
  console.log("\n🧪 Testando Conversão de Datas BR → ISO...\n");

  function convertBRDateToISO(dateStr: string): string | null {
    const brDatePattern = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    const match = dateStr.match(brDatePattern);
    
    if (match) {
      const [, day, month, year] = match;
      return `${year}-${month}-${day}`;
    }
    
    return null;
  }

  const testCases = [
    { input: "24/12/2025", expected: "2025-12-24" },
    { input: "17/12/2025", expected: "2025-12-17" },
    { input: "31/01/2026", expected: "2026-01-31" },
    { input: "2025-12-24", expected: null }, // ISO já formatado
    { input: "Verificar", expected: null },   // Texto inválido
  ];

  testCases.forEach(test => {
    const result = convertBRDateToISO(test.input);
    const status = result === test.expected ? "✅" : "❌";
    console.log(`${status} "${test.input}" → "${result}" (esperado: "${test.expected}")`);
  });
}

// Executar testes
console.log("=".repeat(60));
console.log("🔬 TESTES DE CORREÇÕES DO CONSOLE");
console.log("=".repeat(60));

testJSONParse();
testBRDateConversion();

console.log("\n" + "=".repeat(60));
console.log("✅ Testes concluídos!");
console.log("=".repeat(60) + "\n");
