# Copilot Instructions for Assistente Jurídico PJe

This repository contains a legal management system built with React, TypeScript, and Vite. These instructions guide GitHub Copilot on how to work effectively with this codebase.

## Project Overview

**Assistente Jurídico PJe** is an intelligent legal management system for law offices, featuring:
- AI-powered legal assistant (Harvey Specter chatbot)
- Process management with Kanban board
- Deadline calculator for legal proceedings
- Google Calendar integration
- DJEN/DataJud integration for publication monitoring
- Financial management
- 7 autonomous AI agents working 24/7

## Autonomous Agents System

The system includes 7 autonomous AI agents that work continuously:

### Active Agents (4/7 Connected)
- **assistente-juridico-agent**: Main agent with remote development and CI/CD
- **agente-cluster**: Cluster management agent
- **agenterevisor**: Code review agent
- **agenterevisor2**: Second code review agent

### Pending Agents (3/7)
- **agente-desenvolvimento**: Development environment with debug and hot reload
- **agente-qa**: QA environment with automated tests and security
- **agente-producao**: Production environment with HA and backup

### Infrastructure
- **Kubernetes**: Isolated namespaces (desenvolvimento, qa, production)
- **RBAC**: ClusterRoles and ServiceAccounts configured
- **Network Policies**: Isolation between environments
- **GitLab Integration**: Agents connected to GitLab for CI/CD automation

## 🤖 Sistema de 15 Agentes IA

O sistema inclui 15 agentes de IA especializados, cada um com funções específicas para automação jurídica:

### 🌟 Agentes Principais (Ativos 24/7)

#### 1. Harvey Specter (`harvey`)
**Estrategista-chefe do escritório**
- **Função**: Análise estratégica macro, monitoramento de performance, identificação de riscos
- **Capacidades**: strategic-analysis, performance-monitoring, risk-identification, data-analysis
- **Uso**: Visão geral do escritório, recomendações estratégicas

#### 2. Mrs. Justin-e (`justine`)
**Especialista em intimações e prazos**
- **Função**: Análise automática de intimações, identificação de prazos, geração de tarefas
- **Capacidades**: intimation-analysis, deadline-identification, task-generation, priority-assessment
- **Uso**: Processar intimações, criar tarefas com deadlines

#### 3. Análise Documental (`analise-documental`)
**Analisador de documentos 24/7**
- **Função**: Análise automática de expedientes, intimações e documentos do PJe
- **Capacidades**: document-analysis, text-extraction, entity-recognition, classification
- **Uso**: Processar documentos, extrair informações estruturadas

#### 4. Monitor DJEN (`monitor-djen`)
**Monitoramento de publicações**
- **Função**: Monitoramento contínuo do Diário de Justiça Eletrônico Nacional
- **Capacidades**: djen-monitoring, publication-detection, notification, datajud-integration
- **Uso**: Monitorar publicações diárias, detectar intimações novas

#### 5. Gestão de Prazos (`gestao-prazos`)
**Calculadora e gestor de prazos**
- **Função**: Cálculo e acompanhamento de prazos processuais, geração de alertas
- **Capacidades**: deadline-calculation, business-days, holiday-detection, alert-generation
- **Uso**: Calcular prazos, gerar alertas de vencimento

### 🎯 Agentes Especializados (Ativar quando necessário)

#### 6. Redação de Petições (`redacao-peticoes`)
**Redator jurídico profissional**
- **Função**: Criação de petições e documentos jurídicos
- **Capacidades**: document-drafting, legal-writing, template-generation, precedent-integration
- **Uso**: Redigir petições, elaborar recursos

#### 7. Organização de Arquivos (`organizacao-arquivos`)
**Organizador e arquivista digital**
- **Função**: Organização e categorização de documentos
- **Capacidades**: file-organization, categorization, indexing, duplicate-detection
- **Uso**: Organizar documentos por processo, criar índices

#### 8. Pesquisa Jurisprudencial (`pesquisa-juris`)
**Pesquisador de precedentes**
- **Função**: Busca e análise de precedentes e jurisprudências
- **Capacidades**: jurisprudence-search, precedent-analysis, case-law-research, trend-analysis
- **Uso**: Buscar precedentes STF/STJ, fundamentar petições

#### 9. Análise de Risco (`analise-risco`)
**Avaliador de riscos processuais**
- **Função**: Avaliação de riscos processuais e financeiros
- **Capacidades**: risk-assessment, probability-analysis, financial-impact, mitigation-strategies
- **Uso**: Avaliar viabilidade de casos, estimar probabilidade de sucesso

#### 10. Revisão Contratual (`revisao-contratual`)
**Revisor de contratos**
- **Função**: Análise de contratos, identificação de cláusulas problemáticas
- **Capacidades**: contract-analysis, clause-review, compliance-check, risk-identification
- **Uso**: Revisar contratos, identificar cláusulas abusivas

#### 11. Comunicação com Clientes (`comunicacao-clientes`)
**Comunicador profissional**
- **Função**: Geração de comunicações personalizadas para clientes
- **Capacidades**: client-communication, report-generation, language-simplification, personalization
- **Uso**: Explicar andamentos, gerar relatórios periódicos

#### 12. Análise Financeira (`financeiro`)
**Analista financeiro**
- **Função**: Monitoramento de faturamento e rentabilidade
- **Capacidades**: financial-monitoring, profitability-analysis, receivables-tracking, metrics-calculation
- **Uso**: Monitorar honorários, analisar rentabilidade por caso

#### 13. Estratégia Processual (`estrategia-processual`)
**Consultor estratégico processual**
- **Função**: Sugestão de estratégias processuais baseadas em dados
- **Capacidades**: strategic-planning, option-analysis, cost-benefit, success-probability
- **Uso**: Definir estratégia processual, analisar custo vs benefício

#### 14. Tradução Jurídica (`traducao-juridica`)
**Tradutor jurídico**
- **Função**: Tradução de termos técnicos jurídicos
- **Capacidades**: legal-translation, term-explanation, glossary-creation, language-adaptation
- **Uso**: Explicar termos técnicos, criar glossários

#### 15. Compliance (`compliance`)
**Auditor de conformidade**
- **Função**: Verificação de conformidade com LGPD e normas
- **Capacidades**: compliance-check, lgpd-verification, ethics-review, regulatory-audit
- **Uso**: Verificar conformidade LGPD, revisar questões éticas

### 🔧 Como Usar os Agentes

#### Ativando/Desativando Agentes
```typescript
import { useAutonomousAgents } from '@/hooks/use-autonomous-agents'

const { agents, toggleAgent } = useAutonomousAgents()
// toggleAgent('harvey') - ativa/desativa o agente Harvey
```

#### Criando Tarefas para Agentes
```typescript
import { useAutonomousAgents } from '@/hooks/use-autonomous-agents'

const { addTask } = useAutonomousAgents()

const task = {
  id: crypto.randomUUID(),
  agentId: 'harvey',
  type: 'analyze-performance',
  priority: 'high',
  status: 'queued',
  data: { description: 'Analisar performance do escritório' }
}

addTask(task)
```

#### Status dos Agentes
- ✅ **5 agentes ativos** por padrão (Harvey, Justin-e, Análise Documental, Monitor DJEN, Gestão de Prazos)
- ⏸️ **10 agentes especializados** (ativar quando necessário)
- 📊 **100% implementados** e testados

## Technology Stack

- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite 6
- **Node Version**: 22.x (required)
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui v4, Radix UI
- **Icons**: Phosphor Icons, Lucide React
- **State Management**: Spark KV (useKV hook from @github/spark)
- **Forms**: React Hook Form + Zod validation
- **Charts**: Recharts
- **Animation**: Framer Motion
- **AI**: Spark LLM (GPT-4)
- **OAuth**: Google OAuth 2.0 for authentication
- **Database**: Upstash Redis (KV storage)
- **Monitoring**: Sentry (error tracking)
- **PWA**: vite-plugin-pwa
- **Testing**: Vitest + Playwright (E2E)
- **Deployment**: Vercel (with cron jobs and serverless functions)

## Project Structure

```
src/
├── components/          # React components
│   ├── ui/             # shadcn UI components (DO NOT MODIFY - generated)
│   ├── Dashboard.tsx   # Main dashboard
│   ├── ProcessCRM.tsx  # Kanban process management
│   ├── AIAgents.tsx    # AI agents panel
│   ├── GoogleAuth.tsx  # Google OAuth authentication
│   └── ...             # Other feature components
├── hooks/              # Custom React hooks
│   └── use-autonomous-agents.ts  # AI agents logic
├── lib/
│   ├── config.ts       # Centralized configuration (environment variables)
│   ├── utils.ts        # Utility functions
│   └── djen-api.test.ts # API tests
├── types.ts            # TypeScript type definitions
├── App.tsx             # Main application component
└── main.tsx            # Application entry point
```

## Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev              # Runs on http://localhost:5173

# Build for production
npm run build            # TypeScript compilation + Vite build

# Preview production build
npm run preview

# Lint code
npm run lint             # Run ESLint

# Optimize dependencies
npm run optimize

# Testing
npm run test             # Run unit tests (Vitest)
npm run test:ui          # Run tests with UI
npm run test:run         # Run tests once
npm run test:coverage    # Run tests with coverage
npm run test:api         # Run API tests
npm run test:all         # Run all tests
npm run test:e2e         # Run E2E tests (Playwright)

# Formatting
npm run format           # Format code with Prettier
```

## Code Style and Conventions

### TypeScript
- **Strict null checks enabled** - Always handle null/undefined cases
- Use type inference where possible, explicit types for function parameters and return values
- Prefer interfaces over types for object shapes
- Use const assertions for literal types

### React
- **Functional components only** - No class components
- Use React hooks (useState, useEffect, useCallback, useMemo, etc.)
- Custom hooks should start with `use` prefix
- Component file names in PascalCase matching component name
- Props interfaces named with `Props` suffix (e.g., `DashboardProps`)

### Naming Conventions
- **Components**: PascalCase (e.g., `ProcessCRM.tsx`, `AIAgents.tsx`)
- **Hooks**: camelCase with `use` prefix (e.g., `use-autonomous-agents.ts`)
- **Utilities**: camelCase (e.g., `utils.ts`)
- **Types/Interfaces**: PascalCase (e.g., `ProcessData`, `UserProfile`)
- **Constants**: UPPER_SNAKE_CASE

### Component Structure
```tsx
// Imports
import { useState } from 'react';
import { Button } from '@/components/ui/button';

// Types/Interfaces
interface MyComponentProps {
  title: string;
  onAction?: () => void;
}

// Component
export function MyComponent({ title, onAction }: MyComponentProps) {
  // Hooks
  const [state, setState] = useState();
  
  // Handlers
  const handleClick = () => {
    // logic
  };
  
  // Render
  return (
    <div>
      {/* JSX */}
    </div>
  );
}
```

### Path Aliases
- Use `@/` for imports from `src/` directory
- Example: `import { Button } from '@/components/ui/button'`

## Security Requirements

⚠️ **CRITICAL SECURITY RULES** - Never violate these:

1. **Never commit credentials or secrets**
   - OAuth credentials go in `.env` (already in `.gitignore`)
   - Never hardcode API keys, client IDs, or secrets
   - Use environment variables via `src/lib/config.ts`

2. **Environment Variables**
   - Prefix with `VITE_` for client-side access
   - Reference example: `.env.example`
   - Required variables:
     ```
     VITE_GOOGLE_CLIENT_ID=
     VITE_GOOGLE_API_KEY=
     VITE_REDIRECT_URI=
     VITE_APP_ENV=
     ```

3. **OAuth Security**
   - Different credentials for dev/production
   - Never share credentials in comments, documentation, or code
   - See `OAUTH_SETUP.md` for setup instructions

4. **Dependency Security**
   - Run `npm audit` before adding dependencies
   - Keep dependencies updated
   - Review package permissions

## Testing

### Test Structure
- Test files use `.test.ts` or `.test.tsx` extension
- Place tests adjacent to the code they test
- Example: `src/lib/djen-api.test.ts`

### Running Tests
- **Unit Tests**: Vitest with coverage reporting
- **API Tests**: Separate config for backend functions
- **E2E Tests**: Playwright for browser automation
- **UI Tests**: Vitest UI for interactive testing

### Test Commands
```bash
npm run test:all         # Run complete test suite
npm run test:coverage    # Generate coverage reports
npm run test:e2e         # End-to-end browser tests
```

## Building and Linting

### Build Process
1. TypeScript compilation: `tsc -b --noCheck`
2. Vite build: `vite build`
3. Output: `dist/` directory (ignored by git)

### Linting
- ESLint 9 with flat config
- React hooks rules enforced
- React refresh rules enforced
- Run before committing: `npm run lint`

### Type Checking
- TypeScript strict null checks enabled
- Module resolution: bundler mode
- No emit (Vite handles compilation)

## State Management

### Spark KV Storage
- Use `useKV` hook from `@github/spark` for persistent state
- Client-side storage for processes, user data, settings
- No backend required for basic features

### Example Usage
```tsx
import { useKV } from '@github/spark';

const [processes, setProcesses] = useKV('processes', []);
```

## UI Components

### shadcn/ui Components
- Located in `src/components/ui/`
- **DO NOT modify** these files directly
- Regenerate using shadcn CLI if needed
- Customize via Tailwind classes in parent components

### Tailwind CSS
- Version 4 with `@tailwindcss/vite` plugin
- Custom theme in `tailwind.config.js`
- Use utility classes, avoid custom CSS when possible
- Responsive design: mobile-first approach

## Common Patterns

### Form Validation
```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  field: z.string().min(1, 'Required'),
});

const form = useForm({
  resolver: zodResolver(schema),
});
```

### API Calls
- Use `fetch` API or libraries compatible with Vite
- Handle loading, error, and success states
- Use React Query for complex data fetching

### Error Handling
- Use Error Boundaries for component errors
- See `ErrorFallback.tsx` for reference
- Provide user-friendly error messages
- Log errors for debugging

## Integration Points

### Google OAuth
- Authentication via `GoogleAuth.tsx`
- Config in `src/lib/config.ts`
- Documentation: `OAUTH_SETUP.md`

### Google Calendar
- Bidirectional sync
- Documentation: `GOOGLE_CALENDAR_INTEGRATION.md`

### DJEN/DataJud
- Legal publication monitoring
- Documentation: `DJEN_DOCUMENTATION.md`

### AI Features
- Spark LLM integration for chatbot
- Autonomous agents system
- See `AIAgents.tsx` and `use-autonomous-agents.ts`

## Deployment & Integrations

### Vercel Deployment
- **Region**: São Paulo (gru1) for Brazil compliance
- **Functions**: Serverless API routes with custom timeouts
- **Cron Jobs**: Automated DJEN monitoring (daily at 11:00 BRT)
- **Security Headers**: HSTS, CSP, CORS configured
- **Environment**: Production builds optimized

### GitLab CI/CD
- **Agents**: 7 autonomous agents for development workflow
- **Kubernetes**: Minikube cluster with RBAC
- **Auto DevOps**: Automated pipelines and deployments
- **Security Scanning**: Integrated vulnerability checks

### External APIs
- **DJEN/DataJud**: CNJ public API for legal publications
- **Google Calendar**: Bidirectional synchronization
- **Upstash Redis**: Serverless KV storage
- **Sentry**: Error tracking and monitoring

### Environment Variables
Required for full functionality:
```env
# Core
VITE_GOOGLE_CLIENT_ID=
VITE_GOOGLE_API_KEY=
VITE_REDIRECT_URI=

# Storage
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# AI (optional)
VITE_SPARK_API_KEY=

# Monitoring
SENTRY_DSN=

# Email (optional)
RESEND_API_KEY=
```

## Documentation Files

- `PRD.md` - Product requirements
- `README.md` - Setup and overview
- `SECURITY.md` - Security policies
- `OAUTH_SETUP.md` - OAuth configuration guide
- `GOOGLE_CALENDAR_INTEGRATION.md` - Calendar integration
- `DJEN_DOCUMENTATION.md` - DJEN API integration
- `GUIA_CONFIGURACAO_VERCEL.md` - Vercel deployment guide
- `GITLAB_DUO_SETUP_COMPLETE.md` - GitLab Duo configuration
- `QUICKSTART.md` - Quick start guide
- `VERCEL_DEPLOYMENT_GUIDE.md` - Vercel deployment details
- `TODOS_OS_15_AGENTES.md` - Complete agents documentation
- `AGENTS_SYSTEM.md` - Technical agents documentation
- `AGENTS_IMPROVEMENTS_SUMMARY.md` - Agents improvements summary

## Making Changes

### Before Starting
1. Read relevant documentation files
2. Understand the feature area
3. Check existing patterns in similar components
4. Review security requirements

### When Adding Features
1. Follow existing component structure
2. Use TypeScript strictly
3. Add proper error handling
4. Update types in `types.ts` if needed
5. Test in development mode
6. Ensure responsive design
7. Document complex logic

### When Fixing Bugs
1. Identify root cause
2. Add tests if missing
3. Fix with minimal changes
4. Verify fix doesn't break other features
5. Test edge cases

### When Refactoring
1. Maintain existing functionality
2. Keep changes focused and small
3. Update related documentation
4. Ensure types remain accurate
5. Test thoroughly

## Git Workflow

### Commits
- Clear, descriptive commit messages
- Reference issue numbers when applicable
- Keep commits focused and atomic

### Files to Ignore
Already in `.gitignore`:
- `node_modules/`
- `dist/`
- `.env`
- `*.local`
- Editor configs
- `packages/` (for workspaces)

### Files NOT to Commit
- Environment files (`.env`)
- Build artifacts (`dist/`, `dist-ssr/`)
- Dependency directories (`node_modules/`)
- Editor-specific files
- Credentials or secrets

## Performance Considerations

- Lazy load heavy components
- Use React.memo for expensive renders
- Optimize images and assets
- Keep bundle size minimal
- Use code splitting where appropriate

## Accessibility

- Use semantic HTML
- Include ARIA labels where needed
- Ensure keyboard navigation works
- Test with screen readers
- Maintain sufficient color contrast

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- ES2020 target
- No IE11 support required

## Questions or Issues?

- Check relevant documentation files first
- Review existing similar code
- Ensure security guidelines are followed
- Test changes thoroughly before committing

## Comunicação e Idioma (Português)

- Responda sempre em Português do Brasil (pt-BR) nas mensagens de resposta, instruções, comentários e planos — tanto no Copilot Chat quanto nas operações de revisão e sugestões automáticas.
- Use linguagem clara, objetiva e direta. Se for necessário usar termos técnicos em inglês, explique-os em português entre parênteses.
- Ao apresentar passos (ex.: rodar build, executar lint, corrigir erros), forneça instruções passo a passo em português.
- Para mensagens de commit sugeridas ou descrições de PR, gere o texto em português e, opcionalmente, inclua uma tradução curta em inglês somente se solicitado.

> Nota: Para que essas instruções sejam aplicadas automaticamente no Copilot Chat em VS Code, habilite nas configurações do VS Code: "GitHub > Copilot > Copilot Chat: Enable custom instructions to be loaded from .github/copilot-instructions.md files and added to requests".
