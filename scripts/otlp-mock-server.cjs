#!/usr/bin/env node
/**
 * OTLP Mock Server - Servidor mock para desenvolvimento local
 * 
 * Aceita requisições OTLP HTTP mas não processa os traces.
 * Útil para desenvolvimento quando não há um coletor OTLP real disponível.
 * 
 * Uso:
 *   node scripts/otlp-mock-server.js
 *   
 * Porta: 4318 (padrão OTLP HTTP)
 * Endpoint: http://localhost:4318/v1/traces
 */

const http = require('http');

const PORT = process.env.OTLP_PORT || 4318;
const HOST = '0.0.0.0';

let tracesReceived = 0;
let lastTrace = null;

const server = http.createServer((req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Health check
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'healthy',
      tracesReceived,
      uptime: process.uptime(),
      lastTrace: lastTrace ? {
        timestamp: lastTrace.timestamp,
        size: lastTrace.size
      } : null
    }));
    return;
  }

  // Accept traces
  if (req.url === '/v1/traces' && req.method === 'POST') {
    let body = '';
    
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      tracesReceived++;
      lastTrace = {
        timestamp: new Date().toISOString(),
        size: body.length
      };
      
      console.log(`[${new Date().toISOString()}] ✅ Trace recebido (#${tracesReceived}) - ${body.length} bytes`);
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok', tracesReceived }));
    });
    
    return;
  }

  // Not found
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not found. Use POST /v1/traces to send traces.');
});

server.listen(PORT, HOST, () => {
  console.log('╔═══════════════════════════════════════════════════════╗');
  console.log('║   OTLP Mock Server - Tracing Habilitado              ║');
  console.log('╚═══════════════════════════════════════════════════════╝');
  console.log('');
  console.log(`✅ Servidor OTLP rodando em: http://${HOST}:${PORT}`);
  console.log(`📊 Endpoint de traces: http://localhost:${PORT}/v1/traces`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
  console.log('');
  console.log('🎯 Configure no .env:');
  console.log(`   VITE_OTLP_ENDPOINT=http://localhost:${PORT}/v1/traces`);
  console.log('   VITE_ENABLE_TRACING=true');
  console.log('');
  console.log('📝 Aguardando traces...');
  console.log('   (Ctrl+C para parar)');
  console.log('');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n📊 Estatísticas finais:');
  console.log(`   Total de traces recebidos: ${tracesReceived}`);
  console.log('   Encerrando servidor...');
  server.close(() => {
    console.log('   ✅ Servidor encerrado.');
    process.exit(0);
  });
});
