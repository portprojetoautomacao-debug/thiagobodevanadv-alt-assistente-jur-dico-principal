#!/usr/bin/env node

/**
 * Script de Validação da Integração Azure
 * 
 * Valida que todos os componentes do Azure estão configurados corretamente:
 * - Application Insights
 * - Azure Pipelines
 * - Load Testing
 * - Azure Monitor Dashboard
 */

import { appInsights } from '../src/lib/azure-insights.ts';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Cores para console
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function header(title) {
  console.log('\n' + '='.repeat(60));
  log(title, colors.bright + colors.cyan);
  console.log('='.repeat(60) + '\n');
}

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function test(name, fn) {
  totalTests++;
  try {
    fn();
    log(`✅ ${name}`, colors.green);
    passedTests++;
    return true;
  } catch (error) {
    log(`❌ ${name}`, colors.red);
    log(`   Error: ${error.message}`, colors.yellow);
    failedTests++;
    return false;
  }
}

// ==========================================
// VALIDAÇÃO 1: ARQUIVOS DE CONFIGURAÇÃO
// ==========================================
header('1️⃣  Validando Arquivos de Configuração');

test('azure-pipelines.yml existe', () => {
  if (!fs.existsSync('azure-pipelines.yml')) {
    throw new Error('Arquivo azure-pipelines.yml não encontrado');
  }
});

test('azure-load-testing.yaml existe', () => {
  if (!fs.existsSync('azure-load-testing.yaml')) {
    throw new Error('Arquivo azure-load-testing.yaml não encontrado');
  }
});

test('azure-dashboard-template.json existe', () => {
  if (!fs.existsSync('azure-dashboard-template.json')) {
    throw new Error('Arquivo azure-dashboard-template.json não encontrado');
  }
});

test('src/lib/azure-insights.ts existe', () => {
  if (!fs.existsSync('src/lib/azure-insights.ts')) {
    throw new Error('Arquivo azure-insights.ts não encontrado');
  }
});

test('scripts/deploy-azure-dashboard.ps1 existe', () => {
  if (!fs.existsSync('scripts/deploy-azure-dashboard.ps1')) {
    throw new Error('Script deploy-azure-dashboard.ps1 não encontrado');
  }
});

// ==========================================
// VALIDAÇÃO 2: VARIÁVEIS DE AMBIENTE
// ==========================================
header('2️⃣  Validando Variáveis de Ambiente');

test('VITE_AZURE_INSIGHTS_CONNECTION_STRING definida', () => {
  const connString = process.env.VITE_AZURE_INSIGHTS_CONNECTION_STRING;
  if (!connString) {
    throw new Error('Variável de ambiente não definida. Adicione ao .env.local');
  }
  if (!connString.includes('InstrumentationKey')) {
    throw new Error('Connection string inválida');
  }
});

test('Connection string tem formato correto', () => {
  const connString = process.env.VITE_AZURE_INSIGHTS_CONNECTION_STRING || '';
  const requiredParts = ['InstrumentationKey', 'IngestionEndpoint'];
  
  for (const part of requiredParts) {
    if (!connString.includes(part)) {
      throw new Error(`Connection string faltando parte: ${part}`);
    }
  }
});

// ==========================================
// VALIDAÇÃO 3: DEPENDÊNCIAS NPM
// ==========================================
header('3️⃣  Validando Dependências NPM');

test('@microsoft/applicationinsights-web instalado', () => {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  if (!packageJson.dependencies['@microsoft/applicationinsights-web']) {
    throw new Error('Dependência não encontrada em package.json');
  }
  
  const nodeModulesPath = path.join('node_modules', '@microsoft', 'applicationinsights-web');
  if (!fs.existsSync(nodeModulesPath)) {
    throw new Error('Dependência não instalada em node_modules. Execute: npm install');
  }
});

test('@microsoft/applicationinsights-react-js instalado', () => {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  if (!packageJson.dependencies['@microsoft/applicationinsights-react-js']) {
    throw new Error('Dependência não encontrada em package.json');
  }
});

test('history instalado', () => {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  if (!packageJson.dependencies['history']) {
    throw new Error('Dependência history não encontrada. Execute: npm install history');
  }
});

// ==========================================
// VALIDAÇÃO 4: AZURE CLI
// ==========================================
header('4️⃣  Validando Azure CLI');

test('Azure CLI instalado', () => {
  try {
    execSync('az --version', { stdio: 'pipe' });
  } catch {
    throw new Error('Azure CLI não instalado. Instale em: https://aka.ms/installazurecli');
  }
});

test('Azure CLI autenticado', () => {
  try {
    const account = execSync('az account show', { stdio: 'pipe' }).toString();
    const accountInfo = JSON.parse(account);
    log(`   Conta: ${accountInfo.user.name}`, colors.cyan);
    log(`   Subscription: ${accountInfo.name}`, colors.cyan);
  } catch {
    throw new Error('Não autenticado no Azure. Execute: az login');
  }
});

// ==========================================
// VALIDAÇÃO 5: RECURSOS AZURE
// ==========================================
header('5️⃣  Validando Recursos Azure (Opcional)');

test('Resource Group existe', () => {
  try {
    const rg = execSync(
      'az group show --name assistente-juridico-rg --query "name" --output tsv',
      { stdio: 'pipe' }
    ).toString().trim();
    
    if (rg !== 'assistente-juridico-rg') {
      throw new Error('Resource Group não encontrado');
    }
  } catch {
    log('   ⚠️  Resource Group não encontrado (criar com: az group create)', colors.yellow);
    // Não falhar o teste, apenas avisar
  }
});

test('Application Insights existe', () => {
  try {
    const appInsights = execSync(
      'az monitor app-insights component show --app assistente-juridico-insights --resource-group assistente-juridico-rg --query "name" --output tsv',
      { stdio: 'pipe' }
    ).toString().trim();
    
    if (appInsights !== 'assistente-juridico-insights') {
      throw new Error('Application Insights não encontrado');
    }
    
    log('   ✅ Application Insights configurado', colors.green);
  } catch {
    log('   ⚠️  Application Insights não encontrado (criar com guia)', colors.yellow);
  }
});

// ==========================================
// VALIDAÇÃO 6: INTEGRAÇÃO COM CÓDIGO
// ==========================================
header('6️⃣  Validando Integração com Código');

test('azure-insights.ts importado em use-autonomous-agents.ts', () => {
  const hookContent = fs.readFileSync('src/hooks/use-autonomous-agents.ts', 'utf8');
  
  if (!hookContent.includes('azure-insights')) {
    throw new Error('azure-insights não importado no hook de agentes');
  }
  
  if (!hookContent.includes('trackAgentTask')) {
    throw new Error('trackAgentTask não utilizado no hook');
  }
});

test('Funções de tracking presentes em azure-insights.ts', () => {
  const insightsContent = fs.readFileSync('src/lib/azure-insights.ts', 'utf8');
  
  const requiredFunctions = [
    'trackAgentEvent',
    'trackAgentTask',
    'trackAgentPerformance',
    'trackAPICall',
    'trackError',
    'measurePerformance',
  ];
  
  for (const fn of requiredFunctions) {
    if (!insightsContent.includes(`export function ${fn}`)) {
      throw new Error(`Função ${fn} não encontrada`);
    }
  }
});

// ==========================================
// VALIDAÇÃO 7: AZURE PIPELINES YAML
// ==========================================
header('7️⃣  Validando Azure Pipelines YAML');

test('azure-pipelines.yml tem stages corretos', () => {
  const pipelineContent = fs.readFileSync('azure-pipelines.yml', 'utf8');
  
  const requiredStages = [
    'BuildAndTest',
    'SecurityScan',
    'DeployProduction',
    'PostDeploymentTests',
    'ConfigureMonitoring',
  ];
  
  for (const stage of requiredStages) {
    if (!pipelineContent.includes(stage)) {
      throw new Error(`Stage ${stage} não encontrado no pipeline`);
    }
  }
});

test('azure-pipelines.yml configura SonarCloud', () => {
  const pipelineContent = fs.readFileSync('azure-pipelines.yml', 'utf8');
  
  if (!pipelineContent.includes('SonarCloudPrepare')) {
    throw new Error('SonarCloud não configurado no pipeline');
  }
});

// ==========================================
// VALIDAÇÃO 8: LOAD TESTING CONFIG
// ==========================================
header('8️⃣  Validando Configuração de Load Testing');

test('azure-load-testing.yaml tem cenários corretos', () => {
  const loadTestContent = fs.readFileSync('azure-load-testing.yaml', 'utf8');
  
  const requiredScenarios = [
    'NormalLoad',
    'PeakLoad',
    'StressTest',
    'ResilienceTest',
    'SoakTest',
  ];
  
  for (const scenario of requiredScenarios) {
    if (!loadTestContent.includes(scenario)) {
      throw new Error(`Cenário ${scenario} não encontrado`);
    }
  }
});

test('azure-load-testing.yaml tem métricas de pass/fail', () => {
  const loadTestContent = fs.readFileSync('azure-load-testing.yaml', 'utf8');
  
  const requiredMetrics = [
    'response_time_95',
    'error_rate',
    'throughput',
  ];
  
  for (const metric of requiredMetrics) {
    if (!loadTestContent.includes(metric)) {
      throw new Error(`Métrica ${metric} não encontrada`);
    }
  }
});

// ==========================================
// RESUMO FINAL
// ==========================================
header('📊 Resumo da Validação');

console.log(`Total de testes: ${totalTests}`);
log(`✅ Passaram: ${passedTests}`, colors.green);
if (failedTests > 0) {
  log(`❌ Falharam: ${failedTests}`, colors.red);
}

console.log('');

if (failedTests === 0) {
  log('🎉 VALIDAÇÃO COMPLETA! Integração Azure configurada corretamente.', colors.bright + colors.green);
  console.log('');
  log('Próximos passos:', colors.cyan);
  console.log('  1. Criar recursos no Azure (se ainda não criados)');
  console.log('  2. Configurar Azure Pipelines no Azure DevOps');
  console.log('  3. Executar primeiro build no pipeline');
  console.log('  4. Deploy do dashboard: npm run azure:deploy-dashboard');
  console.log('  5. Executar load test: npm run azure:load-test');
  process.exit(0);
} else {
  log('⚠️  VALIDAÇÃO FALHOU! Corrija os erros acima antes de prosseguir.', colors.bright + colors.red);
  console.log('');
  log('Consulte o guia de migração:', colors.yellow);
  console.log('  docs/AZURE_MIGRATION_GUIDE.md');
  process.exit(1);
}
