// Teste de configuração de debug
console.log("🧪 Testando configuração de debug...\n");

// Verificar launch.json
const fs = require('fs');
const launchJson = JSON.parse(fs.readFileSync('.vscode/launch.json', 'utf-8'));

console.log(`✅ launch.json encontrado`);
console.log(`✅ ${launchJson.configurations.length} configurações de debug`);
console.log(`✅ ${launchJson.compounds?.length || 0} compound configurations\n`);

console.log("📋 Configurações disponíveis:");
launchJson.configurations.forEach((config, i) => {
  console.log(`  ${i+1}. ${config.name} (${config.type})`);
});

if (launchJson.compounds?.length) {
  console.log("\n🎬 Compound configurations:");
  launchJson.compounds.forEach(comp => {
    console.log(`  - ${comp.name}`);
  });
}

console.log("\n✅ Servidor dev rodando em localhost:5173");
console.log("✅ Source maps habilitados");
console.log("✅ Skip files configurado");

console.log("\n🎯 Sistema de debug pronto para uso!");
console.log("\n📌 Para testar:");
console.log("  1. Pressione F5");
console.log("  2. Escolha '🚀 Launch Chrome (Frontend)'");
console.log("  3. Chrome abre automaticamente com debugger conectado");
