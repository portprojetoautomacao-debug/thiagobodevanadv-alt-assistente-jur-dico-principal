# Test Debugging Skill

## Description
Debug e correção de testes no Assistente Jurídico PJe

## Usage
Use quando testes falharem ou precisar criar/modificar testes

## Instructions

### 1. Anatomia dos Testes do Projeto

**Estrutura:**
```
tests/
├── api/              # Testes de API (Vitest)
├── agents/           # Testes de agentes
├── hooks/            # Testes de hooks React
├── services/         # Testes de services
└── integration/      # Testes de integração

chrome-extension-pje/tests/  # Testes da extensão
tests/e2e/                    # Testes Playwright E2E
```

**Frameworks:**
- Vitest (unit/integration)
- React Testing Library (components)
- Playwright (E2E)

### 2. Comandos de Teste

```bash
# Frontend
npm run test              # Watch mode
npm run test:run          # Run once
npm run test:coverage     # Com coverage
npm run test:ui           # UI interativa

# API
npm run test:api

# Chrome Extension
cd chrome-extension-pje && npm test

# E2E
npm run test:e2e
npm run test:e2e:headed   # Com browser visível
npm run test:e2e:debug    # Debug interativo

# Teste específico
npm run test:run tests/hooks/use-processes.test.ts

# Com filtro
npm run test:run -t "should create process"
```

### 3. Debugging de Testes

#### Teste Falha - Primeira Ação
```bash
# 1. Rodar só esse teste
npm run test:run tests/path/to/test.test.ts

# 2. Ver output detalhado
npm run test:run -- --reporter=verbose

# 3. Ver diff completo
npm run test:run -- --no-coverage
```

#### Debugging Interativo (Vitest UI)
```bash
npm run test:ui
# Abre browser com UI interativa
# Permite ver state, re-run, ver código
```

#### Debugging com Console
```typescript
test('should work', () => {
  console.log('Estado atual:', state);
  console.log('Props:', props);
  console.table(items); // Formato tabela

  expect(result).toBe(expected);
});
```

### 4. Erros Comuns em Testes

#### "Cannot find module '@/...'"
```typescript
// vitest.config.ts
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
});
```

#### "ReferenceError: process is not defined"
```typescript
// Configurar globals no vitest.config.ts
test: {
  globals: true,
  environment: 'jsdom',
}
```

#### "act() warning"
```typescript
// Envolver mudanças de estado em act()
import { act } from '@testing-library/react';

await act(async () => {
  fireEvent.click(button);
});
```

#### "Test timeout exceeded"
```typescript
// Aumentar timeout do teste
test('async test', async () => {
  // código
}, { timeout: 10000 }); // 10 segundos
```

### 5. Mocking

#### Mock de Módulo
```typescript
vi.mock('@/lib/gemini-service', () => ({
  streamGeminiResponse: vi.fn().mockResolvedValue('response')
}));
```

#### Mock de Hook
```typescript
vi.mock('@/hooks/use-processes', () => ({
  useProcesses: vi.fn(() => ({
    processes: mockProcesses,
    loading: false
  }))
}));
```

#### Mock de API
```typescript
global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    json: async () => ({ success: true })
  })
);
```

### 6. Testes de Integração

```typescript
describe('Fluxo completo', () => {
  it('deve processar intimação até gerar minuta', async () => {
    // 1. Setup
    const expediente = createMockExpediente();

    // 2. Executar fluxo
    const { result } = renderHook(() => useAutonomousAgents());

    // 3. Aguardar processamento
    await waitFor(() => {
      expect(result.current.tasks).toHaveLength(1);
    });

    // 4. Validar resultado
    const minuta = result.current.minutas[0];
    expect(minuta.status).toBe('gerada');
  });
});
```

### 7. Testes E2E (Playwright)

#### Rodar testes E2E
```bash
# Headless
npm run test:e2e

# Com browser visível
npm run test:e2e:headed

# Debug step-by-step
npm run test:e2e:debug
```

#### Debugging E2E
```typescript
test('should login', async ({ page }) => {
  // Pausar execução
  await page.pause();

  // Screenshot
  await page.screenshot({ path: 'debug.png' });

  // Logs
  page.on('console', msg => console.log(msg.text()));

  // Wait for selector
  await page.waitForSelector('[data-testid="login-button"]', {
    timeout: 5000
  });
});
```

### 8. Coverage Analysis

```bash
# Gerar coverage
npm run test:coverage

# Ver relatório
open coverage/index.html

# Coverage mínimo (70%)
npm run check:coverage
```

### 9. Testes Quebrados Após Mudança

**Estratégia:**
1. Identificar quantos testes quebraram
2. Verificar se é problema do teste ou do código
3. Atualizar snapshots se necessário
4. Ajustar mocks se API mudou

```bash
# Atualizar snapshots
npm run test:update-snapshots

# Rodar só testes relacionados
npm run test:run tests/related/

# Ver diff
git diff tests/
```

### 10. Performance de Testes

#### Testes Lentos
```bash
# Identificar testes lentos
npm run test:run -- --reporter=verbose | grep -E "[0-9]+ms"

# Rodar em paralelo (se não estiver)
# vitest.config.ts
test: {
  pool: 'threads',
  poolOptions: {
    threads: {
      maxThreads: 4
    }
  }
}
```

### 11. Fixture e Mocks

**Criar dados de teste reutilizáveis:**
```typescript
// tests/fixtures/process.fixture.ts
export const mockProcess = (): Process => ({
  id: 'test-123',
  numero: '0001234-56.2024.8.02.0001',
  partes: ['João Silva', 'Maria Oliveira'],
  status: 'ativo',
  dataAbertura: new Date('2024-01-01'),
  valor: 50000,
  tribunal: 'TJAL',
  vara: '1ª Vara Cível'
});

// Usar no teste
import { mockProcess } from '@/tests/fixtures/process.fixture';

test('should process', () => {
  const process = mockProcess();
  // usar process
});
```

### 12. CI/CD Debugging

#### Teste Passa Local, Falha no CI
```bash
# Rodar com mesmas condições do CI
NODE_ENV=test npm run test:run

# Verificar timeout
# CI pode ser mais lento - aumentar timeouts

# Verificar env vars
# CI pode não ter todas as variáveis
```

### 13. Checklist de Teste

**Antes de commitar:**
- [ ] `npm run type-check` ✅
- [ ] `npm run lint` ✅
- [ ] `npm run test:run` ✅
- [ ] `npm run test:api` ✅
- [ ] `npm run build` ✅
- [ ] Coverage acima de 70%
- [ ] Sem console.log/debugger no código
- [ ] Snapshots atualizados se necessário

### 14. Recursos Úteis

**Logs de Teste:**
```bash
# Salvar output
npm run test:run 2>&1 | tee test-output.log

# Ver só falhas
npm run test:run | grep -A20 "FAIL"

# Contar testes
npm run test:run | grep -E "Test Files|Tests"
```

**Debugging Avançado:**
```bash
# Node inspector
node --inspect-brk node_modules/.bin/vitest run

# Depois abrir chrome://inspect
```

### 15. Problemas Específicos do Projeto

#### Agentes não executam em testes
```typescript
// Mock de Gemini
vi.mock('@/lib/gemini-service', () => ({
  streamGeminiResponse: vi.fn(async function* () {
    yield 'Resposta mockada';
  })
}));
```

#### KV/Redis mock
```typescript
vi.mock('@/lib/kv', () => ({
  kv: {
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn()
  }
}));
```

#### Chrome Extension testes
```bash
cd chrome-extension-pje

# Rodar testes
npm test

# Debug
npm test -- --watch
```
