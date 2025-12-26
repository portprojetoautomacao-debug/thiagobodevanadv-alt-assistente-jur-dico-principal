# Code Formatter Skill

## Description
Formata código TypeScript/JavaScript seguindo os padrões do projeto Assistente Jurídico PJe

## Usage
Use quando o usuário pedir para formatar código ou melhorar formatação

## Instructions

### Padrões de Formatação

1. **Prettier Configuration**
   - 2 espaços de indentação
   - Aspas duplas para strings
   - Ponto e vírgula sempre
   - Trailing comma em ES5
   - Print width: 100

2. **TypeScript/JavaScript**
   - Componentes React: function (não class)
   - Props tipadas com interface
   - Hooks no topo da função
   - Imports organizados: React → libs → @/ → relativos
   - Path alias `@/` para imports (nunca `../../../`)

3. **Naming Conventions**
   - Components: PascalCase (`ProcessList`)
   - Hooks: camelCase com `use` (`useProcesses`)
   - Types/Interfaces: PascalCase (`ProcessInfo`)
   - Funções: camelCase (`formatDate`)
   - Constantes: UPPER_SNAKE_CASE (`MAX_RETRIES`)
   - Arquivos: kebab-case (`process-list.tsx`)

4. **Organização de Imports**
```typescript
// 1. React imports
import { useState, useEffect } from 'react';

// 2. Third-party libraries
import { format } from 'date-fns';
import { z } from 'zod';

// 3. Absolute imports com @/
import { Process } from '@/types';
import { useProcesses } from '@/hooks/use-processes';
import { Button } from '@/components/ui/button';

// 4. Relative imports (só quando necessário)
import { helper } from './utils';
```

5. **Estrutura de Componentes React**
```typescript
interface ComponentProps {
  // Props tipadas
}

export function Component({ prop1, prop2 }: ComponentProps) {
  // 1. Hooks
  const [state, setState] = useState();
  const data = useCustomHook();

  // 2. Handlers
  const handleClick = () => { };

  // 3. Effects
  useEffect(() => { }, []);

  // 4. Early returns
  if (!data) return null;

  // 5. Render
  return <div>...</div>;
}
```

### Comandos de Formatação

```bash
# Formatar projeto inteiro
npm run format

# Formatar arquivo específico
npx prettier --write src/path/to/file.tsx

# Verificar formatação
npx prettier --check src/**/*.{ts,tsx}

# ESLint auto-fix
npm run lint:fix
```

### Checklist de Formatação

- [ ] Indentação consistente (2 espaços)
- [ ] Imports organizados
- [ ] Path aliases `@/` usados
- [ ] Props tipadas
- [ ] Funções documentadas (se públicas)
- [ ] Nomes seguem convenções
- [ ] Sem `any` (usar tipos específicos)
- [ ] Prettier aplicado
- [ ] ESLint sem warnings
