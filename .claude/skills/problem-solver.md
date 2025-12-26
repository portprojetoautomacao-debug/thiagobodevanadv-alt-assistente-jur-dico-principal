# Technical Problem Solver Skill

## Description
Resolve problemas técnicos durante desenvolvimento e testes no Assistente Jurídico PJe

## Usage
Use quando houver erros em testes, build, runtime ou deploy

## Instructions

### 1. Metodologia de Resolução

**Framework 5-Step:**
1. **Identificar** - Qual é o problema exato?
2. **Reproduzir** - Consigo reproduzir localmente?
3. **Isolar** - Qual componente/função está falhando?
4. **Resolver** - Aplicar correção cirúrgica
5. **Validar** - Testes passam? Não quebrou nada?

### 2. Problemas em Testes

#### Teste Falha com Timeout
```bash
# Problema: Test timeout exceeded
# Solução 1: Aumentar timeout
vi.setConfig({ testTimeout: 10000 });

# Solução 2: Usar waitFor
await waitFor(() => {
  expect(element).toBeInTheDocument();
}, { timeout: 5000 });

# Solução 3: Mock de APIs lentas
vi.mock('@/lib/gemini-service', () => ({
  streamGeminiResponse: vi.fn()
}));
```

#### Teste Falha com "Cannot find module"
```bash
# Verificar path alias no vitest.config.ts
resolve: {
  alias: {
    '@': path.resolve(__dirname, './src')
  }
}
```

#### Teste Falha Intermitentemente
```typescript
// Problema: Race condition
// Solução: Usar act() do React Testing Library
import { act } from '@testing-library/react';

await act(async () => {
  await user.click(button);
});
```

### 3. Problemas de Build

#### Build Vercel Falha
```bash
# 1. Testar build localmente
npm run build

# 2. Se passa local mas falha Vercel:
# - Verificar env vars no Vercel Dashboard
# - Verificar dependências (não devDependencies)
# - Verificar imports dinâmicos

# 3. Ver logs
vercel logs <deployment-url>
```

#### TypeScript Errors no Build
```bash
# Verificar tipos
npm run type-check

# Ver erros detalhados
npx tsc --noEmit --pretty

# Ignorar temporariamente (não recomendado)
// @ts-ignore
```

#### Vite Build Lento
```typescript
// vite.config.ts - Otimizar chunks
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        'react-vendor': ['react', 'react-dom'],
        'ui-vendor': ['@radix-ui/react-*']
      }
    }
  }
}
```

### 4. Problemas de Runtime

#### Infinite Loop
```typescript
// Problema: useEffect sem dependências corretas
useEffect(() => {
  setState(value); // value muda → re-render → infinite loop
}, []); // ❌ Faltou 'value' nas dependências

// Solução:
useEffect(() => {
  setState(value);
}, [value]); // ✅ Dependências corretas
```

#### Memory Leak
```typescript
// Problema: Subscription não cancelada
useEffect(() => {
  const subscription = subscribe();
  // ❌ Não limpa subscription
}, []);

// Solução:
useEffect(() => {
  const subscription = subscribe();
  return () => subscription.unsubscribe(); // ✅ Cleanup
}, []);
```

#### Estado não Atualiza
```typescript
// Problema: Mutação direta do estado
const [items, setItems] = useState([]);
items.push(newItem); // ❌ Mutação direta

// Solução: Imutabilidade
setItems([...items, newItem]); // ✅ Novo array
```

### 5. Problemas de Integração

#### API Não Responde
```bash
# 1. Verificar endpoint
curl -v http://localhost:5173/api/health

# 2. Ver logs
tail -f api/logs/*.log

# 3. Verificar env vars
node scripts/check-env-vars.js

# 4. Testar API isoladamente
npm run test:api
```

#### Gemini API Rate Limit
```typescript
// Implementar retry com backoff
async function callGeminiWithRetry(prompt: string, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await callGemini(prompt);
    } catch (err) {
      if (err.status === 429 && i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        continue;
      }
      throw err;
    }
  }
}
```

#### Chrome Extension Não Sincroniza
```bash
# 1. Verificar API Key
chrome://extensions → PJe Sync → Popup → API Key

# 2. Testar endpoint
curl -X POST http://localhost:5173/api/pje-sync \
  -H "X-API-Key: sua-api-key" \
  -H "Content-Type: application/json" \
  -d '{"source":"test"}'

# 3. Ver logs da extensão
chrome://extensions → PJe Sync → Inspect views: background page
```

### 6. Problemas de Deploy

#### Deploy Falha no Vercel
```bash
# 1. Ver logs
vercel logs --follow

# 2. Verificar variáveis
vercel env ls

# 3. Testar localmente com env do Vercel
vercel dev

# 4. Rollback se necessário
vercel rollback
```

### 7. Ferramentas de Diagnóstico

```bash
# Analisar bundle size
npm run build
npx vite-bundle-visualizer

# Analisar dependências
npm list --depth=0

# Detectar dependências não usadas
npx depcheck

# Audit de segurança
npm audit

# Performance profiling
NODE_OPTIONS='--prof' npm test
node --prof-process isolate-*.log > processed.txt
```

### 8. Checklist de Troubleshooting

**Antes de pedir ajuda, verificar:**
- [ ] Erro reproduzível localmente?
- [ ] Mensagem de erro completa copiada?
- [ ] `npm run type-check` passa?
- [ ] `npm run lint` passa?
- [ ] `npm run test:run` passa?
- [ ] Versões corretas (Node 22, npm 10)?
- [ ] Dependências atualizadas (`npm install`)?
- [ ] Cache limpo?
- [ ] `.env` configurado corretamente?

### 9. Modo DEBUG

**Habilitar logs detalhados:**
```bash
# .env.local
VITE_LOG_LEVEL=debug
VITE_DEBUG=true
NODE_ENV=development
DEBUG=*

# Rodar com debug
npm run dev
```

### 10. Recursos de Ajuda

**Documentação do Projeto:**
- `README.md` - Setup e overview
- `docs/` - Documentação técnica
- `.github/copilot-instructions.md` - Guia completo do Copilot
- `TODOS_OS_15_AGENTES.md` - Sistema de agentes

**Comandos Úteis:**
```bash
# Ver estrutura
tree -L 3 -I node_modules

# Ver tamanho dos arquivos
du -sh src/* | sort -h

# Ver commits recentes
git log --oneline -n 20

# Ver branches
git branch -a
```
