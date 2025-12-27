# 📋 Erros de Testes - Consolidado para Correção

**Data da Análise**: 12/12/2024 14:46
**Branch**: `feat/optimize-workflows-enterprise-grade`
**Total de Testes**: 332 passando | 12 skipped (346)
**Status Geral**: ✅ Testes rodando, mas com **ERROS CRÍTICOS** em 10+ arquivos

---

## 🔴 ERROS CRÍTICOS (Precisam de correção imediata)

### 1. **ProcessosView.test.tsx** - 6 Falhas

**Arquivo**: `src/components/__tests__/ProcessosView.test.tsx`

#### Erro 1.1: TestingLibraryElementError - Texto não encontrado
```
Unable to find an element with the text: /R\$ 50\.000,00/
Linhas: 211, 233, 337
```
**Causa**: Teste busca valores monetários formatados que não existem no DOM
**Correção**: Atualizar valores esperados ou formatter de moeda

#### Erro 1.2: TypeError - mockReturnValue is not a function
```
Linha: 241
TypeError: vi.mocked(...).mockReturnValue is not a function
```
**Causa**: Mock do Vitest configurado incorretamente
**Correção**: Usar `vi.mocked(funcao).mockImplementation()` ou `mockResolvedValue()`

#### Erro 1.3: Multiple elements found
```
Linha: 261
Found multiple elements with the text: /Urgente/i
```
**Causa**: Múltiplos badges "Urgente" renderizados
**Correção**: Usar `getAllByText()` ou query mais específica com `within()`

#### Erro 1.4: toBeInTheDocument() - received must be HTMLElement
```
Linha: 276
received value must be an HTMLElement or an SVGElement
```
**Causa**: Passando valor null ou undefined para assertion
**Correção**: Verificar se elemento existe antes: `expect(el).not.toBeNull()`

#### Erro 1.5: Unable to find button with role "grid"
```
Linha: 284
Unable to find an accessible element with the role "button" and name `/grid/i`
```
**Causa**: Botão de visualização grid não existe ou nome está errado
**Correção**: Verificar se botão renderiza e qual é o nome correto

#### Erro 1.6: Texto R$ 95.000,00 não encontrado
```
Linha: 337
Unable to find an element with the text: /R\$ 95\.000,00/
```
**Causa**: Similar ao erro 1.1 - formatação monetária
**Correção**: Verificar valores de teste e formatter

---

### 2. **agent.schema.test.ts** - 3 Falhas

**Arquivo**: `src/schemas/__tests__/agent.schema.test.ts`

#### Erro 2.1: Validação Zod falhando
```
Linhas: 13, 45, 71
AssertionError: expected [Function] to not throw an error but 'analyzer' was thrown
```
**Causa**: Schema Zod rejeitando valores válidos
**Correção**: Ajustar schema para aceitar `'analyzer'` como tipo de agente válido

**Detalhes**: O erro sugere que o campo `type` do agente não aceita `'analyzer'`

---

### 3. **expediente.schema.test.ts** - 4 Falhas

**Arquivo**: `src/schemas/__tests__/expediente.schema.test.ts`

#### Erro 3.1-3.4: UUID validation errors
```
Linhas: 18, 55, 70, 87, 104
validation: "uuid" errors
```
**Causa**: Schema Zod exigindo UUID mas teste passando outros formatos
**Correção**:
- Gerar UUIDs válidos nos testes: `crypto.randomUUID()`
- OU relaxar validação do schema para aceitar strings

---

### 4. **process.schema.test.ts** - 4 Falhas

**Arquivo**: `src/schemas/__tests__/process.schema.test.ts`

#### Erro 4.1-4.4: invalid_type errors
```
Linhas: 22, 49, 78, 89, 113
code: "invalid_type"
```
**Causa**: Tipos incorretos sendo passados para o schema
**Correção**: Verificar tipos esperados vs fornecidos em cada teste

---

### 5. **pii-filtering.test.ts** - 1 Falha

**Arquivo**: `src/services/__tests__/pii-filtering.test.ts`

#### Erro 5.1: Telefone não detectado
```
Linha: 59
expected [] to include 'telefone'
```
**Causa**: Regex de detecção de PII não encontrando número de telefone
**Correção**: Verificar regex em `pii-filtering.ts` e formato do telefone no teste

---

## ⚠️ AVISOS (Não bloqueantes mas precisam atenção)

### TodoistAgent - Erros esperados (em testes)

**Arquivo**: `src/lib/agents/todoist-agent.test.ts`

```
stderr: ❌ Erro ao chamar Gemini: Response undefined
stderr: Erro ao interpretar comando com IA: Error: LLM Error
stderr: ❌ Erro ao chamar Gemini: API quota exceeded
stderr: ❌ Erro ao fazer parse da resposta Gemini: SyntaxError
stderr: ❌ Resposta do Gemini em formato inválido
```

**Status**: ✅ Esperados - Testes de fallback/error handling
**Ação**: Nenhuma - comportamento correto

---

### Config.test.ts - Avisos informativos

**Arquivo**: `src/lib/config.test.ts`

```
GitHub OAuth Client Secret is not configured (optional)
GitLab OAuth Client ID is not configured (optional)
GitLab OAuth Client Secret is not configured (optional)
```

**Status**: ✅ Informativo - secrets opcionais
**Ação**: Nenhuma necessária

---

### GeminiClient - API key warning

**Arquivo**: `src/agents/agents-stubs.test.ts`

```
[GeminiClient] API key pode estar em formato inválido
```

**Status**: ⚠️ Verificar se mock está correto
**Ação**: Revisar mock da API key no teste

---

## 📊 Resumo Quantitativo

| Categoria | Quantidade | Prioridade |
|-----------|------------|------------|
| **Erros Críticos** | 18 | 🔴 Alta |
| **Avisos de Teste** | 8 | 🟡 Média |
| **Testes Passando** | 332 | ✅ OK |
| **Testes Skipped** | 12 | ⏸️ Revisar |

---

## 🎯 Plano de Correção Recomendado

### Prioridade 1 (Urgente) - Schemas Zod
```bash
# Corrigir validações de schema que estão bloqueando testes
1. src/schemas/__tests__/agent.schema.test.ts - Aceitar 'analyzer'
2. src/schemas/__tests__/expediente.schema.test.ts - UUIDs
3. src/schemas/__tests__/process.schema.test.ts - Tipos
```

### Prioridade 2 (Alta) - ProcessosView
```bash
# Corrigir testes de UI que estão falhando
1. src/components/__tests__/ProcessosView.test.tsx - 6 erros
   - Valores monetários
   - Mocks do Vitest
   - Seletores de elementos
```

### Prioridade 3 (Média) - PII Filtering
```bash
# Melhorar detecção de PII
1. src/services/__tests__/pii-filtering.test.ts - Regex telefone
```

---

## 🔧 Comandos Úteis para Correção

```bash
# Rodar apenas testes falhando
npm run test -- ProcessosView.test.tsx
npm run test -- agent.schema.test.ts
npm run test -- expediente.schema.test.ts

# Rodar com watch mode para feedback rápido
npm run test:watch -- ProcessosView.test.tsx

# Ver cobertura específica
npm run test:coverage -- --reporter=html

# Rodar todos os testes
npm run test:run
```

---

## 📝 Arquivos de Teste por Status

### ✅ Passando (100%)
- `src/lib/agents/todoist-agent.test.ts` (13/13)
- `src/components/AdvancedNLPDashboard.test.tsx` (17/17)
- `src/services/task-queue-service.test.ts` (16/16)
- `src/services/minuta-service.test.ts` (24/24)
- `src/lib/agents.test.ts` (15/15)
- `src/lib/djen-api.test.ts` (18/18)
- E mais 20+ arquivos...

### ⏸️ Skipped
- `src/lib/todoist-client.test.ts` (12 skipped)

### 🔴 Com Falhas
- `src/components/__tests__/ProcessosView.test.tsx` (6 erros)
- `src/schemas/__tests__/agent.schema.test.ts` (3 erros)
- `src/schemas/__tests__/expediente.schema.test.ts` (4 erros)
- `src/schemas/__tests__/process.schema.test.ts` (4 erros)
- `src/services/__tests__/pii-filtering.test.ts` (1 erro)

---

## 🚀 Próximos Passos

1. **Corrigir schemas Zod** - Mais impacto, 11 testes afetados
2. **Corrigir ProcessosView** - 6 testes afetados, UI crítica
3. **Revisar PII filtering** - 1 teste, funcionalidade de segurança
4. **Verificar testes skipped** - Entender por que estão desabilitados
5. **Rodar teste completo** - Validar todas as correções

**Tempo Estimado**: 2-3 horas para corrigir todos os erros críticos
