# Code Fix Skill

## Description
Corrige bugs e erros de código no Assistente Jurídico PJe

## Usage
Use quando houver erros de compilação, runtime, ou bugs reportados

## Instructions

### 1. Diagnóstico Sistemático

**Checklist de Diagnóstico:**
- [ ] Ler mensagem de erro completa
- [ ] Identificar arquivo e linha
- [ ] Verificar contexto (imports, tipos, dependências)
- [ ] Reproduzir o erro (se possível)
- [ ] Identificar causa raiz

### 2. Erros Comuns e Soluções

#### TypeScript Errors

**Erro: `Module not found: Can't resolve '@/...'`**
```typescript
// ❌ Problema
import { Process } from '../../../types';

// ✅ Solução
import { Process } from '@/types';

// Verificar tsconfig.json tem:
"paths": { "@/*": ["./src/*"] }
```

**Erro: `Type 'X' is not assignable to type 'Y'`**
```typescript
// ❌ Problema
const result: string = fetchData(); // retorna Promise<string>

// ✅ Solução
const result: string = await fetchData();
```

**Erro: `Property 'X' does not exist on type 'Y'`**
```typescript
// ❌ Problema
interface Props {
  name: string;
}
function Component({ name, age }: Props) {} // age não existe

// ✅ Solução
interface Props {
  name: string;
  age?: number; // Adicionar propriedade
}
```

#### Runtime Errors

**Erro: `Cannot read property 'X' of undefined`**
```typescript
// ❌ Problema
const name = user.profile.name;

// ✅ Solução
const name = user?.profile?.name ?? 'Desconhecido';
```

**Erro: `Maximum update depth exceeded`**
```typescript
// ❌ Problema
useEffect(() => {
  setState(newValue); // Sem dependências
});

// ✅ Solução
useEffect(() => {
  setState(newValue);
}, [dependency]); // Adicionar dependências
```

#### React Errors

**Erro: `Rendered more hooks than during the previous render`**
```typescript
// ❌ Problema
if (condition) {
  const [state] = useState(); // Hook condicional
}

// ✅ Solução
const [state] = useState();
if (condition) {
  // Usar state aqui
}
```

### 3. Processo de Correção

```bash
# 1. Ver o erro
npm run dev  # No console do browser

# 2. Type check
npm run type-check

# 3. Lint check
npm run lint

# 4. Testar correção
npm run test:run

# 5. Build final
npm run build
```

### 4. Padrões de Correção

**Ordem de verificação:**
1. **Tipos** - TypeScript errors primeiro
2. **Imports** - Resolver módulos não encontrados
3. **Lógica** - Corrigir bugs de lógica
4. **Performance** - Otimizar se necessário
5. **Testes** - Validar correção

### 5. Documentação de Bugs

Ao corrigir um bug, documente:
```markdown
## Bug: [Título curto]

**Sintoma:** [Descrição do problema]
**Causa:** [Causa raiz]
**Solução:** [O que foi feito]
**Arquivos:** [Lista de arquivos modificados]
**Testes:** [Como validar correção]
```

### 6. Correções Específicas do Projeto

#### Erros de Agentes
```typescript
// Se agente não responde, verificar:
- Gemini API Key configurada (VITE_GEMINI_API_KEY)
- Streaming funcionando (use-autonomous-agents.ts)
- Timeout não muito curto (default: 30s)
```

#### Erros de Build Vercel
```bash
# Verificar:
- Dependências em dependencies (não devDependencies)
- Imports dinâmicos corretos
- Environment variables configuradas no Vercel Dashboard
```

#### Erros de Testes
```bash
# Limpar cache e rodar novamente
npm run test:run -- --clearCache
npm run test:run
```

### 7. Comandos Úteis

```bash
# Limpar tudo e rebuildar
rm -rf node_modules dist .vite .eslintcache
npm install
npm run build

# Ver logs detalhados
npm run dev 2>&1 | tee dev.log

# Debug específico
NODE_OPTIONS='--inspect' npm run dev
```
