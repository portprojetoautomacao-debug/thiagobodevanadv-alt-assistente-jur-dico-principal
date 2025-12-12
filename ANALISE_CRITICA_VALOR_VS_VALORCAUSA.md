# 🔍 ANÁLISE CRÍTICA: `valor` vs `valorCausa` - Duplicação Intencional ou Bug?

**Data**: 12/12/2024 15:30
**Investigação**: Análise profunda do uso de campos duplicados
**Status**: ⚠️ **DUPLICAÇÃO INTENCIONAL - MAS COM INCONSISTÊNCIA**

---

## 🎯 RESUMO EXECUTIVO

### ✅ **CONCLUSÃO PRINCIPAL**

A duplicação **É INTENCIONAL**, mas há **INCONSISTÊNCIA DE USO** no código que pode causar problemas.

**Descoberta crítica**:
- `valorCausa` → Usado por **AGENTES IA** (análise de risco, cálculo de honorários)
- `valor` → Usado pela **UI/FRONTEND** (exibição, filtros, estatísticas)

**Problema**: Os dois campos não estão **sincronizados** - um processo pode ter `valor` mas não `valorCausa` ou vice-versa.

---

## 📊 ANÁLISE DETALHADA POR CONTEXTO

### 1️⃣ **Definição no Type `Process` (src/types.ts)**

```typescript
export interface Process {
  id: string;
  numeroCNJ: string;
  titulo: string;
  autor: string;
  reu: string;
  comarca: string;
  vara: string;
  status: "ativo" | "suspenso" | "arquivado" | "concluido";
  fase?: string;
  valor?: number;  // ← Apenas 'valor', sem 'valorCausa'
  dataDistribuicao: string;
  dataUltimaMovimentacao: string;
  notas?: string;
  prazos: Prazo[];
  createdAt: string;
  updatedAt: string;
  ...
}
```

**Observação**: O tipo `Process` define **APENAS `valor`**, não `valorCausa`!

---

### 2️⃣ **Definição no Schema Zod (src/schemas/process.schema.ts)**

```typescript
export const processSchema = z.object({
  id: z.string(),
  numeroCNJ: numeroCNJSchema,
  titulo: z.string()...,
  autor: z.string()...,
  reu: z.string()...,
  status: z.enum(["ativo", "suspenso", "concluido", "arquivado"]),
  valorCausa: z.number().min(0, "Valor da causa deve ser positivo").optional(),  // ← Campo 1
  comarca: z.string().min(3, "Comarca inválida").optional(),
  vara: z.string().min(3, "Vara inválida").optional(),
  prazos: z.array(prazoSchema).default([]),
  ...
  valor: z.number().min(0).optional(),  // ← Campo 2 (34 linhas depois!)
  notas: z.string().optional(),
  ...
});
```

**Observação**: O schema Zod define **AMBOS** `valorCausa` E `valor`!

---

### 3️⃣ **Uso no Frontend (src/components/ProcessDialog.tsx)**

```typescript
function createInitialFormData(process?: Process) {
  if (process) {
    return {
      numeroCNJ: process.numeroCNJ,
      titulo: process.titulo,
      autor: process.autor,
      reu: process.reu,
      comarca: process.comarca,
      vara: process.vara,
      status: process.status,
      valor: process.valor?.toString() || "",  // ← USA 'valor'
      dataDistribuicao: process.dataDistribuicao,
      notas: process.notas || "",
    };
  }
  ...
}

const processData: Process = {
  id: process?.id || `proc_${Date.now()}`,
  numeroCNJ: formatarNumeroCNJ(formData.numeroCNJ),
  ...
  valor: formData.valor ? Number.parseFloat(formData.valor) : undefined,  // ← USA 'valor'
  ...
};
```

**Observação**: O formulário de criação/edição usa **APENAS `valor`**!

---

### 4️⃣ **Uso nos Agentes IA (src/agents/analise-risco/analise_risco_graph.ts)**

```typescript
export class AnaliseRiscoAgent extends LangGraphAgent {
  protected async run(state: AgentState, _signal: AbortSignal): Promise<AgentState> {
    // Extrair dados do caso
    const tipoCaso = (state.data?.tipoCaso as string) || "trabalhista";
    const valorCausa = (state.data?.valorCausa as number) || 0;  // ← USA 'valorCausa'
    const complexidade = (state.data?.complexidade as string) || "média";

    span?.setAttribute("risco.valor_causa", valorCausa);  // ← USA 'valorCausa'

    // Usar LLM para análise de risco
    const analiseRisco = await createChatSpan(
      {
        agentName: "Análise de Risco",
        system: "gemini",
        model: "gemini-2.5-pro",
        temperature: 0.3,
      },
      [
        {
          role: "user",
          content: `Analise o risco processual:
Tipo: ${tipoCaso}
Valor: R$ ${valorCausa.toLocaleString("pt-BR")}  // ← USA 'valorCausa'
Complexidade: ${complexidade}
...`,
        },
      ],
      ...
    );

    // Ajustar por valor da causa
    if (valorCausa > 100000) riskScore += 0.1;  // ← USA 'valorCausa'
  }
}
```

**Observação**: O agente de análise de risco usa **APENAS `valorCausa`**!

---

### 5️⃣ **Uso em Schemas de Agentes (src/lib/agent-schemas.ts)**

```typescript
/**
 * Schema para análise de risco
 */
export const RiskAnalysisInputSchema = z.object({
  processNumber: z.string().optional(),
  description: z.string().min(20),
  area: z.enum(["civel", "trabalhista", "previdenciario", "penal", "tributario", "outro"]).default("civel"),
  valorCausa: z.number().optional(),  // ← USA 'valorCausa'
  precedents: z.array(z.string()).optional(),
});
```

**Observação**: Schemas de input de agentes usam **`valorCausa`**!

---

### 6️⃣ **Uso em Testes**

#### Testes de UI (ProcessosView.test.tsx):
```typescript
mockProcesses = [
  { id: "1", valor: 50000, ... },  // ← USA 'valor'
  { id: "2", valor: 15000, ... },  // ← USA 'valor'
  { id: "3", valor: 30000, ... },  // ← USA 'valor'
]
```

#### Testes de Schema (process.schema.test.ts):
```typescript
const validProcess = {
  id: "proc_123",
  numeroCNJ: "1234567-89.2024.5.02.0999",
  titulo: "Ação Trabalhista",
  ...
  valorCausa: 50000,  // ← USA 'valorCausa'
  ...
};
```

**Observação**: Testes usam **AMBOS** dependendo do contexto!

---

### 7️⃣ **Uso em Crawlers (Chrome Extension PJe)**

```typescript
// chrome-extension-pje/src/content/crawler/page-navigator.ts
{
  valorCausa: '[id*="valor"], .valor-causa',  // ← Busca 'valorCausa' no HTML
}
```

**Observação**: A extensão Chrome extrai como **`valorCausa`**!

---

## 🐛 PROBLEMAS IDENTIFICADOS

### ❌ **Problema 1: Inconsistência Type vs Schema**

**Type `Process`**:
```typescript
valor?: number;  // ✅ Tem 'valor'
// ❌ NÃO tem 'valorCausa'
```

**Schema `processSchema`**:
```typescript
valorCausa: z.number().min(0).optional(),  // ✅ Tem 'valorCausa'
valor: z.number().min(0).optional(),        // ✅ Tem 'valor'
```

**Impacto**: TypeScript não detecta quando código usa `valorCausa` porque o tipo não define esse campo!

---

### ❌ **Problema 2: Dados Não Sincronizados**

**Cenário A - Processo criado via UI**:
```typescript
// ProcessDialog.tsx salva apenas 'valor'
const processo = {
  id: "1",
  numeroCNJ: "...",
  valor: 50000,  // ✅ Definido
  // valorCausa: undefined  // ❌ NÃO definido
}
```

**Cenário B - Agente tenta usar `valorCausa`**:
```typescript
// AnaliseRiscoAgent.ts lê 'valorCausa'
const valorCausa = (state.data?.valorCausa as number) || 0;  // ← Retorna 0!
```

**Resultado**: Agente calcula risco errado porque não tem o valor correto!

---

### ❌ **Problema 3: Chrome Extension Extrai mas UI Não Usa**

**Chrome Extension PJe**:
```typescript
// Extrai do PJe como 'valorCausa'
{
  numeroCNJ: "1234567-89.2024.5.02.0999",
  valorCausa: 75000,  // ← Extraído do PJe
}
```

**ProcessDialog.tsx**:
```typescript
// Formulário só mostra 'valor'
<Input
  id="valor"
  value={formData.valor}  // ← Não mostra 'valorCausa'!
  onChange={(e) => setFormData({ ...f, valor: e.target.value })}
/>
```

**Resultado**: Dados extraídos do PJe podem ser perdidos!

---

## 🔍 INTENÇÃO ORIGINAL (Dedução)

### **Hipótese 1: Separação Conceitual**

- **`valorCausa`**: Valor oficial da ação judicial (extraído de petição inicial)
- **`valor`**: Valor estimado/atualizado (pode mudar ao longo do processo)

**Suporte**:
- Terminologia jurídica usa "valor da causa" oficialmente
- Processos podem ter o valor atualizado (correção monetária, aditamento)

**Contra-argumento**:
- Código não implementa essa distinção claramente
- Ambos são opcionais e não há lógica de fallback

---

### **Hipótese 2: Migração Incompleta**

- **`valorCausa`**: Campo antigo (usado em schemas e crawlers)
- **`valor`**: Campo novo (usado em UI refatorada)

**Suporte**:
- Schema define `valorCausa` ANTES de `valor` (ordem cronológica?)
- Type `Process` tem apenas `valor` (mais recente)
- Chrome Extension usa `valorCausa` (código legado?)

**Contra-argumento**:
- Agentes IA usam `valorCausa` ativamente (não é código morto)

---

### **Hipótese 3: Contextos Diferentes**

- **`valorCausa`**: Usado por **IA/ML** (análise de risco, cálculo de honorários)
- **`valor`**: Usado por **UI/UX** (exibição, filtros, dashboards)

**Suporte**:
- `RiskAnalysisInputSchema` usa `valorCausa`
- `ProcessDialog.tsx` usa `valor`
- Documentação de Sentry menciona `risco.valor_causa`

**Contra-argumento**:
- Não há sincronização entre os dois campos

---

## ⚠️ IMPACTO REAL NA PRODUÇÃO

### 🔴 **Alto Risco: Agente de Análise de Risco**

**Código**:
```typescript
const valorCausa = (state.data?.valorCausa as number) || 0;
if (valorCausa > 100000) riskScore += 0.1;
```

**Problema**: Se processo criado via UI tem apenas `valor=150000`, mas não `valorCausa`, o agente:
1. Assume `valorCausa=0`
2. NÃO aumenta o risco apesar do alto valor
3. Gera **análise de risco incorreta**

**Severidade**: 🔴 **CRÍTICO** - Afeta tomada de decisão

---

### 🟡 **Médio Risco: Chrome Extension PJe Sync**

**Código**:
```typescript
// Extension extrai: { valorCausa: 75000 }
// UI só lê: process.valor
```

**Problema**: Valor extraído do PJe pode não aparecer na interface

**Severidade**: 🟡 **MÉDIO** - Perda de dados

---

### 🟢 **Baixo Risco: Testes**

**Problema**: Testes usam ambos de forma inconsistente, mas passam porque ambos são opcionais

**Severidade**: 🟢 **BAIXO** - Não afeta produção diretamente

---

## ✅ SOLUÇÕES RECOMENDADAS

### 🎯 **Solução 1: Sincronização Automática (RECOMENDADA)**

Manter ambos os campos, mas sincronizá-los automaticamente:

```typescript
// src/schemas/process.schema.ts
export const processSchema = z.object({
  ...
  valorCausa: z.number().min(0).optional(),
  valor: z.number().min(0).optional(),
}).transform((data) => {
  // Sincronização: se um está definido e o outro não, copiar
  if (data.valor !== undefined && data.valorCausa === undefined) {
    data.valorCausa = data.valor;
  } else if (data.valorCausa !== undefined && data.valor === undefined) {
    data.valor = data.valorCausa;
  }
  return data;
});
```

**Vantagens**:
- ✅ Mantém compatibilidade com código existente
- ✅ Garante que agentes sempre tenham o valor
- ✅ Dados de PJe e UI ficam sincronizados

**Desvantagens**:
- ⚠️ Se ambos estiverem definidos com valores diferentes, qual usar?

---

### 🎯 **Solução 2: Padronizar para `valor` (MAIS SIMPLES)**

Remover `valorCausa` completamente e usar apenas `valor`:

```typescript
// 1. Atualizar agentes
const valor = (state.data?.valor as number) || 0;

// 2. Atualizar Chrome Extension
{
  valor: '[id*="valor"], .valor-causa',  // Extrair como 'valor'
}

// 3. Remover do schema
export const processSchema = z.object({
  ...
  // valorCausa: z.number().min(0).optional(),  // ← REMOVER
  valor: z.number().min(0).optional(),
  ...
});
```

**Vantagens**:
- ✅ Código mais simples e consistente
- ✅ Elimina duplicação
- ✅ Tipo TypeScript e schema alinhados

**Desvantagens**:
- ⚠️ Perde a distinção conceitual (se houver)
- ⚠️ Requer refatoração em 4 arquivos

---

### 🎯 **Solução 3: Documentar Diferença (SE HOUVER)**

Se `valorCausa` e `valor` tiverem significados diferentes:

```typescript
export interface Process {
  ...
  /**
   * Valor oficial da causa conforme petição inicial (imutável)
   */
  valorCausa?: number;

  /**
   * Valor estimado/atualizado do processo (pode mudar ao longo do tempo)
   * Ex: após aditamento, correção monetária, acordo parcial
   */
  valor?: number;
  ...
}
```

**Implementar lógica**:
```typescript
// ProcessDialog.tsx
const valorExibicao = process.valor ?? process.valorCausa ?? 0;

// AnaliseRiscoAgent.ts
const valorParaAnalise = state.data?.valorCausa ?? state.data?.valor ?? 0;
```

**Vantagens**:
- ✅ Mantém distinção conceitual
- ✅ Usa fallback para compatibilidade

**Desvantagens**:
- ⚠️ Mais complexo
- ⚠️ Requer documentação clara

---

## 📊 RECOMENDAÇÃO FINAL

### 🏆 **IMPLEMENTAR SOLUÇÃO 1 (Sincronização Automática)**

**Por quê?**
1. ✅ **Máxima compatibilidade** - Não quebra código existente
2. ✅ **Resolve o bug** - Agentes sempre terão valor correto
3. ✅ **Mínimo esforço** - Apenas 1 mudança no schema
4. ✅ **Seguro** - Funciona tanto para dados novos quanto legados

**Implementação**:
```typescript
// src/schemas/process.schema.ts
export const processSchema = z.object({
  id: z.string(),
  numeroCNJ: numeroCNJSchema,
  ...
  valorCausa: z.number().min(0, "Valor da causa deve ser positivo").optional(),
  ...
  valor: z.number().min(0).optional(),
  ...
})
.transform((data) => {
  // Sincronização bidirecional
  if (data.valor !== undefined && data.valorCausa === undefined) {
    data.valorCausa = data.valor;
  } else if (data.valorCausa !== undefined && data.valor === undefined) {
    data.valor = data.valorCausa;
  }
  // Se ambos definidos, manter valores (assumir que são diferentes intencionalmente)
  return data;
});
```

**Tempo de implementação**: 15 minutos
**Risco**: 🟢 Baixo

---

## 🎯 CONCLUSÃO

### ✅ **Resposta à Pergunta Original**

**"Isso causa algum erro no app?"**

**SIM**, causa erro sutil mas **CRÍTICO**:

1. 🔴 **Agente de Análise de Risco calcula score errado** quando processo criado via UI
2. 🟡 **Dados do PJe podem ser perdidos** se extensão extrai `valorCausa` mas UI só mostra `valor`
3. 🟡 **Inconsistência entre Type e Schema** impede TypeScript de detectar bugs

**"Foi feito de propósito?"**

**PROVAVELMENTE SIM**, mas com **IMPLEMENTAÇÃO INCOMPLETA**:

- Intenção provável: Separar valor oficial (`valorCausa`) de valor estimado (`valor`)
- Problema: Falta sincronização entre os campos
- Resultado: Duplicação que causa bugs ao invés de ajudar

**"Impacto: NENHUM?"**

**NÃO**! Impacto é **MÉDIO a ALTO**:

- ❌ Análises de risco incorretas
- ❌ Perda potencial de dados
- ❌ Confusão para desenvolvedores
- ✅ Não causa crash (ambos opcionais)
- ✅ UI funciona normalmente (usa `valor`)

**Status**: 🟡 **BUG ATIVO - CORREÇÃO RECOMENDADA**
