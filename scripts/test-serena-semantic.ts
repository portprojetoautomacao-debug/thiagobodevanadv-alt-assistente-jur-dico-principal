/**
 * Script de Testes Automatizados - Serena MCP
 * 
 * Valida se o Serena está configurado corretamente e responde adequadamente
 * a comandos semânticos.
 * 
 * Uso:
 *   npx tsx scripts/test-serena-semantic.ts
 */

import { spawn } from 'child_process';

interface SemanticTestCase {
  name: string;
  query: string;
  expectedPatterns: string[];
  timeout?: number;
}

const SEMANTIC_TESTS: SemanticTestCase[] = [
  {
    name: 'Listar Agentes IA',
    query: 'Liste todos os agentes IA do sistema',
    expectedPatterns: [
      'src/lib/agents.ts',
      'harvey',
      'justine',
      'TODOS_OS_15_AGENTES.md'
    ],
    timeout: 10000
  },
  {
    name: 'Buscar Hooks Validados',
    query: 'Mostre hooks que terminam com -validated',
    expectedPatterns: [
      'use-processes-validated',
      'use-expedientes-validated',
      'Zod'
    ],
    timeout: 8000
  },
  {
    name: 'Encontrar Integração DJEN',
    query: 'Mostre código que interage com API DJEN',
    expectedPatterns: [
      'djen-api.ts',
      'api/djen',
      'monitoramento'
    ],
    timeout: 8000
  },
  {
    name: 'Análise de Templates',
    query: 'Liste templates de documentos jurídicos',
    expectedPatterns: [
      'document-templates.ts',
      'petição',
      'contrato'
    ],
    timeout: 10000
  },
  {
    name: 'Verificar Sentry AI Monitoring',
    query: 'Quais agentes usam Sentry AI Monitoring?',
    expectedPatterns: [
      'sentry-gemini-integration',
      'createInvokeAgentSpan',
      'real-agent-client'
    ],
    timeout: 10000
  }
];

/**
 * Executa um teste semântico via Serena MCP
 */
async function runSemanticTest(test: SemanticTestCase): Promise<boolean> {
  console.log(`\n🔍 Teste: ${test.name}`);
  console.log(`   Query: "${test.query}"`);

  return new Promise((resolve) => {
    // Simula chamada ao Serena via MCP
    // Em produção, isso seria via stdio com o servidor MCP
    const serenaProcess = spawn('uvx', [
      '--from',
      'git+https://github.com/oraios/serena',
      'start-mcp-server',
      'serena==latest',
      '--context',
      '.',
      'ide-assistant'
    ]);

    let output = '';
    let errorOutput = '';
    let timeoutId: NodeJS.Timeout;

    serenaProcess.stdout?.on('data', (data) => {
      output += data.toString();
    });

    serenaProcess.stderr?.on('data', (data) => {
      errorOutput += data.toString();
    });

    // Envia query via stdin (protocolo MCP)
    const mcpRequest = {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: {
        name: 'semantic_search',
        arguments: { query: test.query }
      }
    };

    serenaProcess.stdin?.write(JSON.stringify(mcpRequest) + '\n');
    serenaProcess.stdin?.end();

    // Timeout
    timeoutId = setTimeout(() => {
      console.log(`   ⏱️  Timeout (${test.timeout}ms)`);
      serenaProcess.kill();
      resolve(false);
    }, test.timeout || 10000);

    serenaProcess.on('close', () => {
      clearTimeout(timeoutId);

      // Validar se output contém padrões esperados
      const foundPatterns = test.expectedPatterns.filter(pattern =>
        output.toLowerCase().includes(pattern.toLowerCase())
      );

      const success = foundPatterns.length >= Math.ceil(test.expectedPatterns.length * 0.6);

      if (success) {
        console.log(`   ✅ PASSOU - ${foundPatterns.length}/${test.expectedPatterns.length} padrões encontrados`);
        foundPatterns.forEach(p => console.log(`      - ${p}`));
      } else {
        console.log(`   ❌ FALHOU - ${foundPatterns.length}/${test.expectedPatterns.length} padrões encontrados`);
        if (errorOutput) {
          console.log(`   Erro: ${errorOutput.slice(0, 200)}`);
        }
      }

      resolve(success);
    });
  });
}

/**
 * Valida pré-requisitos do Serena
 */
async function validatePrerequisites(): Promise<boolean> {
  console.log('📋 Validando Pré-requisitos...\n');

  // 1. Verificar uvx
  const uvxCheck = await new Promise<boolean>((resolve) => {
    const uvx = spawn('uvx', ['--version']);
    uvx.on('close', (code) => {
      const success = code === 0;
      console.log(success ? '   ✅ uvx instalado' : '   ❌ uvx não encontrado');
      resolve(success);
    });
  });

  if (!uvxCheck) return false;

  // 2. Verificar Python
  const pythonCheck = await new Promise<boolean>((resolve) => {
    const python = spawn('python3', ['--version']);
    python.on('close', (code) => {
      const success = code === 0;
      console.log(success ? '   ✅ Python instalado' : '   ❌ Python não encontrado');
      resolve(success);
    });
  });

  if (!pythonCheck) return false;

  // 3. Verificar .vscode/mcp.json
  const fs = await import('fs');
  const mcpConfigExists = fs.existsSync('.vscode/mcp.json');
  console.log(mcpConfigExists ? '   ✅ .vscode/mcp.json configurado' : '   ❌ .vscode/mcp.json não encontrado');

  if (!mcpConfigExists) return false;

  // 4. Verificar .sereneignore
  const serenIgnoreExists = fs.existsSync('.sereneignore');
  console.log(serenIgnoreExists ? '   ✅ .sereneignore configurado' : '   ⚠️  .sereneignore não encontrado (opcional)');

  console.log('');
  return uvxCheck && pythonCheck && mcpConfigExists;
}

/**
 * Executa todos os testes
 */
async function runAllTests() {
  console.log('════════════════════════════════════════════════════════');
  console.log('   🧪 TESTES AUTOMATIZADOS - SERENA MCP');
  console.log('════════════════════════════════════════════════════════\n');

  // Validar pré-requisitos
  const prereqsOk = await validatePrerequisites();

  if (!prereqsOk) {
    console.log('\n❌ Pré-requisitos não atendidos. Corrija e tente novamente.');
    console.log('   Consulte: docs/SERENA_MCP_SETUP.md');
    process.exit(1);
  }

  // Executar testes semânticos
  console.log('════════════════════════════════════════════════════════');
  console.log('   🔍 TESTES SEMÂNTICOS');
  console.log('════════════════════════════════════════════════════════');

  const results = await Promise.all(
    SEMANTIC_TESTS.map(test => runSemanticTest(test))
  );

  const passed = results.filter(r => r).length;
  const total = results.length;

  // Resumo
  console.log('\n════════════════════════════════════════════════════════');
  console.log('   📊 RESUMO');
  console.log('════════════════════════════════════════════════════════\n');

  console.log(`   Total de Testes: ${total}`);
  console.log(`   ✅ Passou: ${passed}`);
  console.log(`   ❌ Falhou: ${total - passed}`);
  console.log(`   📈 Taxa de Sucesso: ${Math.round((passed / total) * 100)}%`);

  console.log('\n════════════════════════════════════════════════════════\n');

  if (passed === total) {
    console.log('🎉 Todos os testes passaram! Serena está funcionando perfeitamente.');
    process.exit(0);
  } else if (passed >= Math.ceil(total * 0.7)) {
    console.log('⚠️  Maioria dos testes passou, mas há falhas. Revise a configuração.');
    process.exit(0);
  } else {
    console.log('❌ Muitos testes falharam. Verifique a configuração do Serena.');
    console.log('   Consulte: docs/SERENA_MCP_SETUP.md');
    console.log('   Troubleshooting: docs/SERENA_BEST_PRACTICES.md#troubleshooting-comum');
    process.exit(1);
  }
}

// Executar
runAllTests().catch((error) => {
  console.error('\n💥 Erro fatal ao executar testes:', error);
  process.exit(1);
});
