# Code Search Skill

## Description
Pesquisa de código e linguagem de programação no projeto Assistente Jurídico PJe

## Usage
Use quando precisar encontrar código, entender implementações ou pesquisar padrões

## Instructions

### 1. Estratégias de Busca

#### Busca por Função/Método
```bash
# Encontrar definição de função
grep -r "function nomeFuncao" src/

# Encontrar uso de função
grep -r "nomeFuncao(" src/

# Busca com contexto (3 linhas antes/depois)
grep -r -A3 -B3 "nomeFuncao" src/
```

#### Busca por Tipo/Interface
```bash
# Encontrar tipo
grep -r "interface ProcessInfo" src/

# Encontrar uso do tipo
grep -r ": ProcessInfo" src/
```

#### Busca por Import
```bash
# Quem importa este módulo?
grep -r "from '@/lib/agents'" src/

# Onde está definido?
find src/ -name "agents.ts"
```

### 2. Ferramentas de Busca

#### grep (Rápido, texto literal)
```bash
# Case insensitive
grep -ri "searchterm" src/

# Apenas nomes de arquivo
grep -rl "searchterm" src/

# Excluir diretórios
grep -r "searchterm" src/ --exclude-dir=node_modules
```

#### ripgrep/rg (Mais rápido, ignore automático)
```bash
# Busca simples
rg "searchterm" src/

# Com tipo de arquivo
rg "searchterm" -t ts -t tsx

# Com contexto
rg "searchterm" -C 5
```

#### VS Code Search (Visual)
```
Ctrl+Shift+F - Search em todos os arquivos
Ctrl+P - Quick Open por nome de arquivo
Ctrl+T - Busca de símbolos (funções, classes)
```

### 3. Padrões do Projeto

#### Agentes IA
```bash
# Lista de agentes
cat TODOS_OS_15_AGENTES.md

# Implementação de agente
ls src/agents/*/

# Configuração de agentes
cat src/lib/agents.ts
```

#### Hooks React
```bash
# Listar hooks
find src/hooks/ -name "*.ts"

# Hook específico
cat src/hooks/use-processes.ts
```

#### APIs
```bash
# Listar endpoints
find api/ -name "*.ts" | grep -v test

# Endpoint específico
cat api/agents.ts
```

### 4. Compreensão de Arquitetura

**Fluxo de dados:**
```
Chrome Extension → /api/pje-sync → Upstash KV → use-processes → UI
DJEN/DataJud → /api/djen-sync → use-expedientes → Agentes IA
```

**Principais arquivos:**
- `src/types.ts` - Todos os tipos
- `src/lib/agents.ts` - Configuração de agentes
- `src/lib/config.ts` - Configurações globais
- `api/kv.ts` - Cliente Redis/KV

### 5. Pesquisa por Feature

#### Como encontrar implementação de uma feature?

**Exemplo: "Como funciona análise de intimações?"**

1. **Buscar no código:**
```bash
grep -ri "intimação" src/ | grep -v test
grep -ri "analise.*intimacao" src/
```

2. **Verificar documentação:**
```bash
find docs/ -name "*.md" -exec grep -l "intimação" {} \;
```

3. **Ver agente responsável:**
```bash
# Mrs. Justin-e é responsável
cat TODOS_OS_15_AGENTES.md | grep -A20 "justine"
```

4. **Ver hook relacionado:**
```bash
cat src/hooks/use-autonomous-agents.ts | grep -A10 "intimacao"
```

### 6. Debugging de Código

**Adicionar breakpoints:**
```typescript
// Para debugar
debugger; // Pausa execução no browser

// Logging estruturado
console.log('[Component]', { state, props });
```

**React DevTools:**
```
F12 → Components tab
Ver state, props, hooks de qualquer componente
```

**Network requests:**
```
F12 → Network tab
Filtrar por XHR/Fetch para ver APIs
```

### 7. Comandos Úteis

```bash
# Encontrar TODOs no código
grep -r "TODO\|FIXME\|XXX" src/ --exclude-dir=node_modules

# Arquivos modificados recentemente
git log --name-only --oneline -n 20

# Arquivos maiores
find src/ -type f -exec wc -l {} \; | sort -rn | head -10

# Dependências de um arquivo
npx madge --extensions ts,tsx src/App.tsx

# Complexidade ciclomática
npx complexity-report src/
```

### 8. Pesquisa Semântica

**Quando busca literal não funcionar, use descrição:**
```
@workspace Como funciona o fluxo de criação de minutas automáticas?
@workspace Onde está implementada a sincronização com Google Calendar?
@workspace Quem chama a função streamGeminiResponse?
```

### 9. Referências Rápidas

**Estrutura do Projeto:**
```
src/
├── components/     # React components
├── hooks/          # Custom hooks
├── lib/            # Utilities e services
├── services/       # Business logic
├── agents/         # LangGraph agents
└── types.ts        # TypeScript types

api/
├── agents.ts       # API de agentes
├── djen-sync.ts    # DJEN integration
└── pje-sync.ts     # PJe integration
```

**Documentação:**
```
docs/               # Documentação técnica
.github/            # Copilot instructions
TODOS_OS_15_AGENTES.md  # Lista completa de agentes
README.md           # Visão geral
```
