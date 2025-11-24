#!/usr/bin/env node

/**
 * Script de Backup Automatizado para Agendamentos
 * Uso: node scripts/backup.js --type=daily --retention=7
 */

const fs = require('fs');
const path = require('path');

function main() {
  const args = process.argv.slice(2);
  const type = args.find(arg => arg.startsWith('--type='))?.split('=')[1] || 'daily';
  const retention = parseInt(args.find(arg => arg.startsWith('--retention='))?.split('=')[1] || '7');

  console.log(`🔄 Iniciando backup ${type}...`);
  console.log(`📅 Retenção: ${retention} dias`);

  const timestamp = new Date().toISOString();
  const backupDir = path.join(__dirname, '..', 'backups');
  const backupFile = path.join(backupDir, `backup-${type}-${timestamp.replace(/[:.]/g, '-')}.json`);

  // Criar diretório se não existir
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  // Dados de exemplo para backup
  const backupData = {
    timestamp,
    type,
    version: process.env.npm_package_version || '1.0.0',
    data: {
      // Aqui você adicionaria dados reais do seu sistema
      agents: [],
      processes: [],
      settings: {}
    }
  };

  // Salvar backup
  fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2));
  console.log(`💾 Backup salvo: ${backupFile}`);

  // Limpar backups antigos
  cleanupOldBackups(backupDir, retention);

  console.log('✅ Backup concluído!');
}

function cleanupOldBackups(backupDir, retentionDays) {
  const files = fs.readdirSync(backupDir)
    .filter(file => file.startsWith('backup-'))
    .map(file => ({
      name: file,
      path: path.join(backupDir, file),
      mtime: fs.statSync(path.join(backupDir, file)).mtime
    }))
    .sort((a, b) => b.mtime - a.mtime);

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

  files.forEach(file => {
    if (file.mtime < cutoffDate) {
      fs.unlinkSync(file.path);
      console.log(`🗑️ Backup antigo removido: ${file.name}`);
    }
  });
}

if (require.main === module) {
  main();
}