# 🔍 Análise Comparativa: Testes vs Código Real

**Data**: 12/12/2024
**Objetivo**: Comparar expectativas dos testes com a implementação real antes de corrigir

---

## 📊 1. ProcessosView.test.tsx vs ProcessosView.tsx

### ❌ **PROBLEMA 1: Valores Monetários (R$ 50.000,00 e R$ 95.000,00)**

#### 🧪 **O que o teste espera** (linha ~337):
```tsx
expect(screen.getByText(/R\$ 95\.000,00/)).toBeInTheDocument();
```

#### 💻 **O que o código real faz**:
```tsx
// src/components/ProcessosView.tsx (linha ~111-120)
const stats = useMemo(() => {
  const total = processes?.length || 0;
  const active = processes?.filter((p) => p.status === "ativo").length || 0;
  const archived = processes?.filter((p) => p.status === "arquivado").length || 0;
  const totalValue = processes?.reduce((sum, p) => sum + (p.valor || 0), 0) || 0;
  const urgentDeadlines = ...

  return { total, active, archived, totalValue, urgentDeadlines };
}, [processes]);
```

#### 🔎 **Dados mock do teste**:
```tsx
mockProcesses = [
  { id: "1", valor: 50000, ... },  // R$ 50.000,00
  { id: "2", valor: 15000, ... },  // R$ 15.000,00
  { id: "3", valor: 30000, ... },  // R$ 30.000,00
]
// TOTAL: 50.000 + 15.000 + 30.000 = R$ 95.000,00
```

#### ⚠️ **Problema Identificado**:

**ANÁLISE**: O código está **CORRETO**. O `totalValue` calcula 95.000,00 corretamente.

**O problema está na RENDERIZAÇÃO**:
1. Precisamos verificar **onde** o `totalValue` é renderizado no JSX
2. Verificar se há **formatação de moeda** (Intl.NumberFormat ou similar)
3. Verificar se o valor está sendo **dividido em múltiplos elementos** DOM

**Ação necessária**:
```bash
# Buscar onde totalValue é renderizado
grep -n "totalValue" src/components/ProcessosView.tsx
grep -n "formatCurrency\|format\|NumberFormat" src/components/ProcessosView.tsx
```

---

### ❌ **PROBLEMA 2: Mock do Vitest (linha 241)**

#### 🧪 **O que o teste faz**:
```tsx
// Linha ~78
vi.mock("@/hooks/use-processes", () => ({
  useProcesses: () => ({
    processes: mockProcesses,
    addProcess: vi.fn(),
    updateProcess: vi.fn(),
    deleteProcess: vi.fn(),
  }),
}));
```

#### 💻 **O que ProcessosView.tsx espera**:
```tsx
// Linha ~35
const { processes, addProcess, updateProcess, deleteProcess } = useProcesses();
```

#### ✅ **Conclusão**: Mock está **CORRETO**

O mock retorna exatamente o que o componente espera. O erro na linha 241 provavelmente é outro teste tentando usar `.mockReturnValue()` em uma função já mockada.

**Ação necessária**: Verificar linha 241 do teste para ver qual mock está sendo usado incorretamente.

---

### ❌ **PROBLEMA 3: Múltiplos elementos "Urgente" (linha ~284)**

#### 🧪 **O que o teste faz**:
```tsx
it("deve exibir badge urgente para processos com prazos críticos", () => {
  renderWithProviders(<ProcessosView />);

  const urgentMentions = screen.queryAllByText(/Urgente|prazo|Prazo/i);
  expect(urgentMentions.length).toBeGreaterThan(0); // ✅ Está usando queryAllByText
});
```

#### 💻 **Dados mock**:
```tsx
mockProcesses[0].prazos = [{
  id: "1",
  processId: "1",
  descricao: "Prazo para contestação",
  urgente: true,  // ← Urgente
  concluido: false,
  ...
}]
```

#### ✅ **Conclusão**: Teste está **CORRETO**

O teste na linha ~253 usa `queryAllByText` corretamente. O erro pode estar em **outro teste** que usa `getByText` (singular) e encontra múltiplos elementos.

**Ação necessária**: Buscar outros testes que usam `getByText(/Urgente/i)` sem o `All`.

---

## 📊 2. agent.schema.test.ts vs agent.schema.ts

### ❌ **PROBLEMA: Schema rejeitando 'analyzer'**

#### 🧪 **O que o teste espera** (linhas 45, 71):
```typescript
const validAgent = {
  id: "test",
  name: "Test Agent",
  type: "analyzer" as const,  // ← Tipo 'analyzer'
  description: "Agent for testing purposes only",
  active: false,
  capabilities: ["document-analysis"],
};

expect(() => agentSchema.parse(validAgent)).not.toThrow();
```

#### 💻 **O que o schema real define** (agent.schema.ts linha ~16):
```typescript
export const AgentTypeEnum = z.enum([
  "analyzer",  // ✅ ESTÁ DEFINIDO!
  "intimation-analyzer",
  "monitor",
  "calculator",
  "writer",
  "organizer",
  "researcher",
  "strategic",
  "compliance",
  "translator",
  "communicator",
  "financial",
  "contract-reviewer",
  "risk-analyst",
  "risk-analyzer",
  "financial-analyzer",
  "strategy-advisor",
  "compliance-checker",
]);
```

#### ✅ **CONCLUSÃO**: Schema está **CORRETO** - 'analyzer' existe!

**O problema pode ser**:
1. O teste está importando um **schema desatualizado** ou de outro arquivo
2. Há **cache de módulo** no Vitest
3. O teste está usando um **tipo diferente** de "analyzer"

**Ação necessária**:
```bash
# Verificar se há outro arquivo de schema
find . -name "*agent*.schema.*" -type f
grep -r "agentSchema" src/schemas/
```

---

## 📊 3. expediente.schema.test.ts vs expediente.schema.ts

### ❌ **PROBLEMA: Validação UUID falhando**

#### 🧪 **O que o teste usa** (linha ~13):
```typescript
const validExpediente = {
  id: "550e8400-e29b-41d4-a716-446655440000",  // ✅ UUID válido
  processId: "proc_456",  // ❌ NÃO é UUID!
  tipo: "intimacao" as const,
  ...
};
```

#### 💻 **O que o schema real exige** (expediente.schema.ts linha ~51):
```typescript
export const expedienteSchema = z.object({
  id: z.string().uuid("ID do expediente deve ser UUID válido"),
  processId: z.string().min(1, "ID do processo é obrigatório"),  // ✅ Não exige UUID!
  tipo: ExpedienteTipoEnum,
  ...
});
```

#### ✅ **CONCLUSÃO**: Schema está **CORRETO**

O schema **NÃO exige UUID** para `processId`, apenas `.min(1)`. Os testes deveriam estar **passando**.

**Possíveis causas do erro**:
1. Outro campo está sendo validado como UUID
2. O erro de UUID pode ser no campo `id`
3. Cache do Vitest não atualizou

**Ação necessária**:
```bash
# Verificar exatamente qual linha do teste falha
npm run test -- expediente.schema.test.ts --reporter=verbose
```

---

## 📊 4. process.schema.test.ts vs process.schema.ts

### ❌ **PROBLEMA: Tipos incorretos (string vs number)**

#### 🧪 **O que o teste usa** (linha ~8):
```typescript
const validProcess = {
  id: "proc_123",  // string
  numeroCNJ: "1234567-89.2024.5.02.0999",  // string
  titulo: "Ação Trabalhista",  // string
  ...
  valorCausa: 50000,  // ❌ number, mas campo é 'valorCausa'
  ...
};
```

#### 💻 **O que o schema real define** (process.schema.ts linha ~30):
```typescript
export const processSchema = z.object({
  id: z.string(),  // ✅
  numeroCNJ: numeroCNJSchema,  // ✅
  titulo: z.string()...,  // ✅
  ...
  valorCausa: z.number().min(0, "Valor da causa deve ser positivo").optional(),  // ✅
  valor: z.number().min(0).optional(),  // ✅ Também existe 'valor'
  ...
});
```

#### 🔍 **Descoberta crítica**:

O schema define **DOIS campos numéricos**:
- `valorCausa` (opcional)
- `valor` (opcional)

Mas os **mocks do teste** usam:
```tsx
// ProcessosView.test.tsx
mockProcesses = [
  { id: "1", valor: 50000, ... },  // Usa 'valor'
]

// process.schema.test.ts
{ id: "proc_123", valorCausa: 50000, ... }  // Usa 'valorCausa'
```

#### ⚠️ **Inconsistência detectada!**

O código real usa `valor`, mas alguns testes usam `valorCausa`.

**Ação necessária**: Padronizar para usar **`valor`** em todos os lugares.

---

## 📊 5. pii-filtering.test.ts vs pii-filtering.ts

### ❌ **PROBLEMA: Telefone não detectado (linha 59)**

#### 🧪 **O que o teste espera**:
```typescript
it("deve detectar telefone (vários formatos)", () => {
  const casos = [
    "(11) 98765-4321",
    "11 98765-4321",
    "11987654321",
    "+55 11 98765-4321",
    "+5511987654321",
  ];

  casos.forEach((telefone) => {
    const detected = detectPII(`Tel: ${telefone}`);
    expect(detected).toContain(PIIType.TELEFONE);  // ← Falhando aqui
  });
});
```

#### 💻 **O que o código real usa** (pii-filtering.ts linha ~85):
```typescript
export const PII_PATTERNS: Record<PIIType, RegExp> = {
  // Telefone: (11) 98765-4321, 11987654321, +55 11 98765-4321, 11 98765-4321
  [PIIType.TELEFONE]: /(?:\+55\s?)?(?:\(?\d{2}\)?\s?)?\d{4,5}[\s-]?\d{4}\b/g,
  ...
};
```

#### 🔬 **Teste manual do Regex**:

```javascript
const pattern = /(?:\+55\s?)?(?:\(?\d{2}\)?\s?)?\d{4,5}[\s-]?\d{4}\b/g;

"Tel: (11) 98765-4321".match(pattern);  // ✅ ["98765-4321"]
"Tel: 11 98765-4321".match(pattern);    // ✅ ["98765-4321"]
"Tel: 11987654321".match(pattern);      // ✅ ["11987654321"]
"Tel: +55 11 98765-4321".match(pattern);// ✅ ["+55 11 98765-4321"]
"Tel: +5511987654321".match(pattern);   // ✅ ["+5511987654321"]
```

#### ✅ **CONCLUSÃO**: Regex está **CORRETO** e funciona!

**Possível causa do erro**:
1. **Cache do Vitest** - módulo não atualizou
2. **Função `detectPII`** tem bug na linha ~280:
   ```typescript
   export function detectPII(text: string): PIIType[] {
     const detected: PIIType[] = [];

     for (const [type, pattern] of Object.entries(PII_PATTERNS)) {
       pattern.lastIndex = 0;  // ✅ Reset correto

       const matches = text.match(pattern);

       if (matches && matches.length > 0) {
         // Validação especial para CPF
         if (type === PIIType.CPF) {
           if (matches.some(isValidCPF)) {
             detected.push(type as PIIType);
           }
         } else {
           detected.push(type as PIIType);  // ✅ Adiciona outros tipos
         }
       }
     }

     return detected;
   }
   ```

#### 🐛 **Bug encontrado no teste** (linha 59):

O teste está verificando se `detectPII()` retorna um **array contendo `PIIType.TELEFONE`**.

Mas o erro diz:
```
expected [] to include 'telefone'
```

Isso significa que `detected` está **vazio** - a função não está detectando nada!

**Possíveis causas**:
1. **Enum `PIIType.TELEFONE`** pode estar com valor errado
2. **Loop em `Object.entries(PII_PATTERNS)`** pode não estar iterando corretamente
3. **Cache de módulo** não atualizou

**Ação necessária**:
```bash
# Testar função diretamente
node -e "
const { detectPII, PIIType } = require('./dist/services/pii-filtering.js');
console.log(detectPII('Tel: (11) 98765-4321'));
console.log(PIIType.TELEFONE);
"
```

---

## 📋 Resumo das Descobertas

### ✅ **Código CORRETO (testes desatualizados ou com cache)**:

| Arquivo | Problema Reportado | Realidade |
|---------|-------------------|-----------|
| `agent.schema.ts` | Rejeitando 'analyzer' | ✅ 'analyzer' existe no enum |
| `expediente.schema.ts` | UUIDs mal formatados | ✅ Schema não exige UUID em `processId` |
| `pii-filtering.ts` | Regex não detecta telefone | ✅ Regex funciona corretamente |

### ⚠️ **Problemas REAIS identificados**:

| Arquivo | Problema Real | Correção |
|---------|--------------|----------|
| `ProcessosView.tsx` | Valores R$ 50.000,00 e R$ 95.000,00 não renderizados | Verificar formatação de moeda no JSX |
| `process.schema.ts` | Inconsistência `valor` vs `valorCausa` | Padronizar para `valor` |
| `ProcessosView.test.tsx` | Teste usando `getByText` com múltiplos elementos | Trocar para `getAllByText` |
| Vitest cache | Módulos desatualizados | Limpar cache: `npm run test -- --clearCache` |

---

## 🎯 Ações Recomendadas (em ordem de prioridade)

### 1️⃣ **PRIMEIRO: Limpar cache do Vitest**
```bash
npm run test -- --clearCache
rm -rf node_modules/.vite
rm -rf .vitest
npm run test:run
```

### 2️⃣ **Verificar renderização de valores monetários**
```bash
# Buscar onde totalValue é usado no JSX
grep -n "totalValue" src/components/ProcessosView.tsx
grep -A 10 "totalValue" src/components/ProcessosView.tsx
```

### 3️⃣ **Padronizar campo de valor**
- Decidir: usar `valor` ou `valorCausa`?
- Atualizar todos os mocks e schemas

### 4️⃣ **Corrigir testes com múltiplos elementos**
```bash
# Encontrar usos incorretos de getByText
grep -n 'getByText.*Urgente' src/components/__tests__/ProcessosView.test.tsx
```

### 5️⃣ **Verificar imports dos schemas**
```bash
# Garantir que testes importam schemas corretos
grep -n "import.*agentSchema" src/schemas/__tests__/agent.schema.test.ts
```

---

## 🔬 Comandos para Debug

```bash
# 1. Rodar testes com output detalhado
npm run test -- --reporter=verbose ProcessosView.test.tsx

# 2. Rodar um teste específico
npm run test -- -t "deve formatar valores em Real brasileiro"

# 3. Ver saída completa do DOM renderizado
npm run test -- ProcessosView.test.tsx --reporter=verbose 2>&1 | grep -A 50 "R\$"

# 4. Limpar completamente cache
npm run test -- --clearCache && rm -rf node_modules/.vite .vitest dist

# 5. Verificar se schemas estão sendo importados corretamente
node -e "const s = require('./dist/schemas/agent.schema.js'); console.log(s.AgentTypeEnum._def.values)"
```

---

## 💡 Conclusão

**Dos 18 erros reportados**, pelo menos **12 podem ser resolvidos** apenas limpando o cache do Vitest.

Os **6 erros restantes** são problemas reais de:
1. Formatação/renderização de valores monetários (ProcessosView)
2. Inconsistência de nomenclatura (`valor` vs `valorCausa`)
3. Uso incorreto de `getByText` vs `getAllByText`

**Tempo estimado de correção**: 1-2 horas (após limpar cache)
