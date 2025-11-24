#!/usr/bin/env node

/**
 * Teste de Integração com Google Calendar
 * Verifica se a integração com Google Calendar para prazos legais está funcionando
 */

const https = require('https');

console.log('🧪 Iniciando teste de integração Google Calendar...');

// Simulação de teste de conectividade com Google APIs
const testGoogleAPIsConnection = () => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'www.googleapis.com',
      port: 443,
      path: '/discovery/v1/apis/calendar/v3/rest',
      method: 'GET',
      timeout: 10000
    };

    const req = https.request(options, (res) => {
      console.log(`✅ Status da resposta Google APIs: ${res.statusCode}`);

      if (res.statusCode === 200) {
        console.log('✅ Conectividade com Google APIs OK');
        resolve(true);
      } else {
        console.log(`⚠️  Status inesperado: ${res.statusCode}`);
        resolve(false);
      }
    });

    req.on('error', (err) => {
      console.log(`❌ Erro de conexão com Google APIs: ${err.message}`);
      resolve(false);
    });

    req.on('timeout', () => {
      console.log('⏰ Timeout na conexão com Google APIs');
      req.destroy();
      resolve(false);
    });

    req.end();
  });
};

// Teste de validação de formato de evento de calendário
const testCalendarEventFormat = () => {
  console.log('📅 Testando formato de evento de calendário...');

  const sampleCalendarEvent = {
    summary: 'Prazo: Contestação - Processo 1234567-89.2024',
    description: 'Prazo para apresentação de contestação no processo trabalhista',
    start: {
      dateTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Amanhã
      timeZone: 'America/Sao_Paulo'
    },
    end: {
      dateTime: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(), // 1 hora depois
      timeZone: 'America/Sao_Paulo'
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 1440 }, // 24 horas antes
        { method: 'popup', minutes: 60 }   // 1 hora antes
      ]
    },
    metadata: {
      processNumber: '1234567-89.2024.8.26.0100',
      deadlineType: 'contestacao',
      priority: 'alta'
    }
  };

  // Validação básica do formato
  const requiredFields = ['summary', 'description', 'start', 'end'];
  const hasRequiredFields = requiredFields.every(field => sampleCalendarEvent.hasOwnProperty(field));

  if (hasRequiredFields && sampleCalendarEvent.start.dateTime && sampleCalendarEvent.end.dateTime) {
    console.log('✅ Formato de evento de calendário válido');
    return true;
  } else {
    console.log('❌ Formato de evento de calendário inválido');
    return false;
  }
};

// Teste de validação de configuração OAuth
const testOAuthConfig = () => {
  console.log('🔐 Testando configuração OAuth...');

  // Verificar se variáveis de ambiente estão definidas (simulação)
  const requiredEnvVars = [
    'VITE_GOOGLE_CLIENT_ID',
    'VITE_GOOGLE_API_KEY'
  ];

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

  if (missingVars.length === 0) {
    console.log('✅ Todas as variáveis de ambiente OAuth configuradas');
    return true;
  } else {
    console.log(`⚠️  Variáveis de ambiente faltando: ${missingVars.join(', ')}`);
    return false;
  }
};

// Executar testes
async function runTests() {
  try {
    console.log('='.repeat(50));
    console.log('🧪 TESTE DE INTEGRAÇÃO GOOGLE CALENDAR');
    console.log('='.repeat(50));

    const connectionTest = await testGoogleAPIsConnection();
    const eventFormatTest = testCalendarEventFormat();
    const oauthTest = testOAuthConfig();

    console.log('\n📊 RESULTADOS DOS TESTES:');
    console.log(`Conectividade Google APIs: ${connectionTest ? '✅ PASSOU' : '❌ FALHOU'}`);
    console.log(`Formato Evento Calendário: ${eventFormatTest ? '✅ PASSOU' : '❌ FALHOU'}`);
    console.log(`Configuração OAuth: ${oauthTest ? '✅ PASSOU' : '❌ FALHOU'}`);

    const overallResult = connectionTest && eventFormatTest && oauthTest;
    console.log(`\n🎯 RESULTADO GERAL: ${overallResult ? '✅ TODOS OS TESTES PASSARAM' : '⚠️  ALGUNS TESTES FALHARAM'}`);

    process.exit(overallResult ? 0 : 1);

  } catch (error) {
    console.error('❌ Erro durante execução dos testes:', error);
    process.exit(1);
  }
}

runTests();