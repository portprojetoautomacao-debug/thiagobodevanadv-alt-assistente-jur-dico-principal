# Troubleshooting: Chrome Debug Protocol Connection Error

## 🐛 Erro

```
Could not connect to debug target at http://localhost:9222:
Error: Cancelled GET http://localhost:9222/json/version
```

## 🔍 Causa

Este erro ocorre quando o Playwright tenta conectar ao Chrome Debug Protocol (porta 9222), mas:

1. O Chrome/Chromium não está rodando com debugging habilitado
2. Processos órfãos do Playwright/Chrome ainda estão em execução
3. O navegador crashou durante a última execução
4. O Chromium não está instalado corretamente

## ✅ Solução

### 1. Limpar Processos Órfãos

```bash
# Matar todos os processos do Chrome/Playwright
pkill -9 -f "chrome|chromium|playwright"

# Verificar se ainda há processos
ps aux | grep -E "chrome|chromium|playwright" | grep -v grep
```

### 2. Limpar Diretórios de Teste

```bash
# Remover resultados de testes anteriores
rm -rf test-results playwright-report .playwright
```

### 3. Reinstalar Chromium

```bash
# Reinstalar navegadores do Playwright
npx playwright install chromium --with-deps

# Verificar instalação
npx playwright --version
```

### 4. Executar Testes em Headless

```bash
# SEMPRE usar headless em dev containers/CI
npm run test:e2e

# Para debug local com interface gráfica (requer X11)
npx playwright test --headed --debug
```

## 📋 Configuração Recomendada

### playwright.config.ts

```typescript
export default defineConfig({
  use: {
    // ✅ SEMPRE headless em containers/CI
    headless: true,

    // Outras configurações úteis
    trace: "on-first-retry",
    video: "retain-on-failure",
    screenshot: "only-on-failure",
  },

  projects: [
    {
      name: "chromium",
      // ✅ Usar Chromium bundled pelo Playwright
      use: {
        ...devices["Desktop Chromium"],
        channel: "chromium",  // Não "chrome"
        headless: true  // Forçar headless
      },
    },
  ],
});
```

## 🚨 Erros Comuns

### Erro: `Error: browserType.launch: Executable doesn't exist`
**Solução**: Instalar navegadores do Playwright
```bash
npx playwright install
```

### Erro: `Error: X server required`
**Solução**: Forçar modo headless
```typescript
use: { headless: true }
```

### Erro: `Error: Browser closed unexpectedly`
**Solução**: Aumentar timeout e limpar processos
```typescript
timeout: 60_000,
expect: { timeout: 10_000 }
```

## 🔄 Script de Limpeza Automática

```bash
#!/bin/bash
# scripts/cleanup-playwright.sh

echo "🧹 Limpando processos Playwright..."
pkill -9 -f "chrome|chromium|playwright" 2>/dev/null

echo "🗑️  Removendo diretórios de teste..."
rm -rf test-results playwright-report .playwright

echo "✅ Limpeza concluída!"
```

## 📊 Status Atual

- ✅ Playwright 1.57.0 instalado
- ✅ Chromium Headless Shell 143.0.7499.4 instalado
- ✅ Configuração headless ativa
- ✅ Processos órfãos limpos
- ✅ Diretórios de teste limpos

## 🎯 Prevenção

1. **Sempre usar headless em CI/containers**
2. **Limpar processos após testes falharem**
3. **Não usar `--headed` em ambientes sem X11**
4. **Adicionar cleanup em hooks de teste**
5. **Usar `reuseExistingServer: true` no webServer**

---

**Última atualização**: 26/12/2025
**Playwright versão**: 1.57.0
**Status**: ✅ Resolvido
