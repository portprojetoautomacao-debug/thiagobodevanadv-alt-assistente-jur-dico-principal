import fs from 'fs';

const SUMMARY_PATH = process.env.SUMMARY_PATH || 'coverage/coverage-summary.json';
if (!fs.existsSync(SUMMARY_PATH)) {
  console.error(`Arquivo de resumo não encontrado: ${SUMMARY_PATH}`);
  process.exit(1);
}
const summary = JSON.parse(fs.readFileSync(SUMMARY_PATH, 'utf8'));
const total = summary.total;

console.log('\n📊 COBERTURA GERAL:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`Linhas:       ${total.lines.pct.toFixed(2)}% (${total.lines.covered}/${total.lines.total})`);
console.log(`Statements:   ${total.statements.pct.toFixed(2)}% (${total.statements.covered}/${total.statements.total})`);
console.log(`Funções:      ${total.functions.pct.toFixed(2)}% (${total.functions.covered}/${total.functions.total})`);
console.log(`Branches:     ${total.branches.pct.toFixed(2)}% (${total.branches.covered}/${total.branches.total})`);

// Verificar thresholds
const thresholds = {
  lines: 80,
  statements: 80,
  functions: 75,
  branches: 70
};

let failed = false;
console.log('\n🎯 VERIFICAÇÃO DE THRESHOLDS:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

Object.keys(thresholds).forEach(key => {
  const actual = total[key].pct;
  const threshold = thresholds[key];
  const status = actual >= threshold ? '✅' : '❌';
  console.log(`${status} ${key.padEnd(12)}: ${actual.toFixed(2)}% (threshold: ${threshold}%)`);
  if (actual < threshold) failed = true;
});

// Identificar arquivos com baixa cobertura
console.log('\n⚠️  ARQUIVOS COM BAIXA COBERTURA (<60%):');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

const lowCoverage = [];
Object.keys(summary).forEach(file => {
  if (file === 'total') return;
  const fileCov = summary[file];
  if (fileCov.lines.pct < 60) {
    lowCoverage.push({
      file,
      lines: fileCov.lines.pct,
      statements: fileCov.statements.pct,
      functions: fileCov.functions.pct,
      branches: fileCov.branches.pct
    });
  }
});

if (lowCoverage.length === 0) {
  console.log('✅ Nenhum arquivo com cobertura abaixo de 60%');
} else {
  lowCoverage.sort((a, b) => a.lines - b.lines).forEach(item => {
    console.log(`📄 ${item.file}`);
    console.log(`   Linhas: ${item.lines.toFixed(2)}%, Funções: ${item.functions.toFixed(2)}%`);
  });
  console.log(`\nTotal: ${lowCoverage.length} arquivo(s) com baixa cobertura`);
}

// Identificar arquivos sem testes
console.log('\n🔴 ARQUIVOS SEM TESTES (0% cobertura):');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

const untested = [];
Object.keys(summary).forEach(file => {
  if (file === 'total') return;
  const fileCov = summary[file];
  if (fileCov.lines.pct === 0 && fileCov.statements.total > 0) {
    untested.push(file);
  }
});

if (untested.length === 0) {
  console.log('✅ Todos os arquivos têm alguma cobertura');
} else {
  untested.forEach(file => console.log(`📄 ${file}`));
  console.log(`\nTotal: ${untested.length} arquivo(s) sem testes`);
}

process.exit(failed ? 1 : 0);
