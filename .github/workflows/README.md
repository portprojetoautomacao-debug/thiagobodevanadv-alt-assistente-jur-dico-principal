# GitHub Actions Workflows

Este diretório contém todos os workflows de CI/CD para o projeto Assistente Jurídico PJe.

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Workflows Principais](#workflows-principais)
- [Workflows de Qualidade](#workflows-de-qualidade)
- [Workflows de Segurança](#workflows-de-segurança)
- [Workflows de Automação](#workflows-de-automação)
- [Workflows dos Agentes AI](#workflows-dos-agentes-ai)
- [Configuração de Concurrency](#configuração-de-concurrency)
- [Secrets Necessários](#secrets-necessários)
- [Manutenção](#manutenção)

---

## Visão Geral

Todos os workflows foram atualizados com:
- ✅ **Concurrency groups** para evitar execuções duplicadas
- ✅ **Timeouts** em jobs críticos
- ✅ **Tratamento de erros** melhorado
- ✅ **Verificações de arquivos** antes de executar
- ✅ **Mensagens de erro** mais claras

---

## Workflows Principais

### 1. CI Workflow (`ci.yml`)
**Triggers:** Push to `main`, `develop`, `copilot/**` branches; Pull requests to `main`, `develop`

**Jobs:**
- **build-and-test**: Builds and tests on Node.js 22.x
  - Runs linter
  - Builds application
  - Runs tests
  - Uploads build artifacts
  - **✨ NEW:** Enhanced caching for faster builds
  - **✨ NEW:** Build artifact caching for incremental builds
  
- **lint-security**: Security and quality checks
  - npm audit
  - Dependency check
  - ESLint with SARIF output for GitHub Code Scanning
  
- **build-matrix-status**: Aggregates status of all jobs

**Features:**
- Optimized dependency caching with multiple restore keys
- Build artifact caching for faster rebuilds
- Enhanced build summary with performance metrics
- Artifact retention for 7 days
- Caching for faster builds
- SARIF integration for security findings
- **Concurrency:** Cancela execuções anteriores no mesmo branch
- **Melhorias:** Tratamento robusto de erros no SARIF, verificação de test scripts

---

### 2. Deploy Workflow (`deploy.yml`)
**Triggers:** Push to `main`; Pull requests; Manual workflow dispatch

**Jobs:**
- **deploy-vercel**: Deploys to Vercel
  - Valida secrets do Vercel
  - Verifica limite de 12 funções serverless (Hobby)
  - Valida arquivos dos agentes AI
  - Deploy com retry logic (3 tentativas)
  - Comenta URL no PR
  
- **e2e-tests**: Testes E2E após deploy
  - Verifica se Playwright está configurado
  - Upload de resultados mesmo em falha
  
- **deploy-notification**: Notificação de status

**Features:**
- Environment-based deployment (production/staging/preview)
- Automatic PR commenting with deployment URL
- **Concurrency:** NÃO cancela deploys em andamento
- **Timeout:** 30 minutos para E2E
- **Melhorias:** Verificação de Playwright config, melhor tratamento de falhas

**Required Secrets:**
- `VITE_GOOGLE_CLIENT_ID`, `VITE_GOOGLE_API_KEY`, `VITE_REDIRECT_URI`
- `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`
- `VERCEL_AUTOMATION_BYPASS_SECRET` (opcional)

---
**Triggers:** Pull request events (opened, synchronize, reopened, ready_for_review)

**Jobs:**
- **pr-validation**: Comprehensive PR checks
  - Merge conflict detection
  - Code linting
  - Build verification
  - Test execution
  - package.json/package-lock.json consistency check
  
- **pr-labeler**: Auto-labels PRs based on changed files
  
- **size-limit**: Bundle size monitoring
  - Checks main bundle size (500 KB limit)
  - Warns if exceeded

**Features:**
- Automated PR commenting with validation summary
- Skips draft PRs
- Bundle size warnings (non-blocking)

### 3. Code Quality Workflow (`code-quality.yml`)
**Triggers:** Push to `main`, `develop`; PRs to `main`, `develop`; Weekly on Monday

**Jobs:**
- **codeql-analysis**: GitHub CodeQL security scanning
  - JavaScript/TypeScript analysis
  - Security and quality queries
  
- **dependency-review**: Reviews dependency changes (PRs only)
  - Fails on moderate+ severity vulnerabilities
  
- **type-check**: TypeScript type checking
  
- **bundle-size**: Detailed bundle size analysis
  - Reports all JS/CSS file sizes
  - Shows gzipped sizes

**Features:**
- Automated security scanning
- Dependency vulnerability detection
- Type safety enforcement

### 4. Deploy Workflow (`deploy.yml`)
**Triggers:** Push to `main`; Manual workflow dispatch

**Jobs:**
- **deploy-vercel**: Deploys to Vercel
  - Builds application with production env vars
  - Deploys to production or staging
  - Comments deployment URL on PRs
  
- **deploy-notification**: Reports deployment status

**Features:**
- Environment-based deployment (production/staging)
- Automatic PR commenting with deployment URL
- Uses Vercel CLI for deployment

**Required Secrets:**
- `VITE_GOOGLE_CLIENT_ID`
- `VITE_GOOGLE_API_KEY`
- `VITE_REDIRECT_URI`
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

### 5. Release Workflow (`release.yml`)
**Triggers:** Git tags matching `v*.*.*`; Manual workflow dispatch

**Jobs:**
- **create-release**: Creates GitHub release
  - Builds production version
  - Creates release archive (ZIP)
  - Generates changelog from git history or CHANGELOG.md
  - Uploads build artifacts
  - Marks beta/alpha as prerelease
  
- **notify-release**: Reports release completion

**Features:**
- Automatic changelog generation
- Release archive creation
- Pre-release detection (beta/alpha tags)
- Production deployment trigger

### 6. Nightly Build Workflow (`nightly.yml`)
**Triggers:** Daily at 2:00 AM UTC; Manual workflow dispatch

**Jobs:**
- **nightly-build**: Comprehensive nightly checks
  - Security audit
  - Dependency updates check
  - Full build from `develop` branch
  - Tests with coverage
  - Build report with bundle sizes
  
- **dependency-update-check**: Checks for available updates
  - Uses npm-check-updates
  - Reports available minor updates

**Features:**
- Runs on `develop` branch
- 7-day artifact retention
- Detailed build reports in GitHub Summary
- Continues on errors to collect all information

### 7. GitHub Copilot Setup Steps (`copilot-setup-steps.yml`)
**Triggers:** Push/PR to the workflow file itself; Manual workflow dispatch

**Jobs:**
- **copilot-setup-steps**: Prepares the environment for GitHub Copilot coding agent
  - Checks out repository code
  - Sets up Node.js 20 with npm caching
  - Installs all project dependencies with `npm ci`

**Features:**
- Automatically runs when the workflow file is modified (for easy validation)
- Can be triggered manually via Actions tab
- Provides a pre-configured environment for the Copilot agent
- Enables Copilot to run builds, tests, and linters without setup delays
- Uses minimal permissions (contents: read)
- Runs on ubuntu-latest (required for Copilot compatibility)

**Purpose:**
This workflow is specifically designed for GitHub Copilot's coding agent. When Copilot starts working on a task, this workflow runs first to prepare the environment with all necessary tools and dependencies. This ensures:
- Faster agent startup (dependencies are pre-installed)
- Reliable builds and tests (consistent environment)
- Better agent performance (no trial-and-error for dependency installation)

**Note:** This workflow must be present in the default branch to be recognized by GitHub Copilot.

---

## 🆕 Novos Workflows (Adicionados em 2025-11-23)

### 8. Bundle Analysis (`bundle-analysis.yml`)
**Triggers:** Pull requests com mudanças no código; Execução manual

**Objetivo:** Analisar e monitorar o tamanho do bundle JavaScript

**Jobs:**
- **analyze-bundle**: Análise completa do bundle
  - Tamanhos de arquivos JS/CSS
  - Compressão gzip
  - Alertas de tamanho
  
- **compare-with-base**: Comparação com branch base
  - Diferença de tamanho
  - Percentual de mudança

**Features:**
- Relatório detalhado em comentários de PR
- Recomendações de otimização
- Limites configuráveis (500 KB padrão)

### 9. Auto Changelog (`changelog.yml`)
**Triggers:** Release published; Push em tags; Execução manual

**Objetivo:** Gerar e manter CHANGELOG.md automaticamente

**Features:**
- Categorização de commits (features, fixes, docs, maintenance, security)
- Geração automática de release notes
- Formato compatível com [Keep a Changelog](https://keepachangelog.com/)
- Atualização automática em releases

### 10. Status Badges (`badges.yml`)
**Triggers:** Conclusão de workflows principais (CI, Deploy, Security, Code Quality)

**Objetivo:** Manter badges de status atualizados

**Features:**
- Geração automática de badge JSON
- Atualização do README
- Suporte para múltiplos workflows

### 11. Dependency Health Check (`dependency-health.yml`)
**Triggers:** Semanalmente (segundas 9h UTC); PRs com mudanças em dependências; Execução manual

**Objetivo:** Monitorar saúde e segurança das dependências

**Jobs:**
- **check-dependencies**: Análise completa
  - Pacotes desatualizados
  - Vulnerabilidades de segurança
  - Verificação de licenças
  - Análise de tamanho
  - Dependências duplicadas
  
- **check-npm-scripts**: Validação de scripts
  - Verifica scripts essenciais
  - Lista todos os scripts disponíveis

**Features:**
- Relatórios detalhados em artifacts
- Comentários automáticos em PRs
- Recomendações de manutenção
- Análise top 10 maiores pacotes

---

## Workflow Dependencies

### Required npm packages
All workflows require these packages to be installed:
- `vitest` - Test runner
- `@vitest/coverage-v8` - Coverage provider
- `jsdom` - DOM environment for tests
- `@testing-library/react` - React testing utilities
- `@testing-library/jest-dom` - DOM matchers
- `@microsoft/eslint-formatter-sarif` - SARIF formatter for ESLint

### Environment Variables
Build-time environment variables (prefixed with `VITE_`):
- `VITE_GOOGLE_CLIENT_ID` - Google OAuth client ID
- `VITE_GOOGLE_API_KEY` - Google API key
- `VITE_REDIRECT_URI` - OAuth redirect URI
- `VITE_APP_ENV` - Environment (ci, production, staging, nightly, test)

## Secrets Configuration

### Repository Secrets
Configure these in GitHub Settings > Secrets and variables > Actions:

**Google OAuth:**
- `VITE_GOOGLE_CLIENT_ID`
- `VITE_GOOGLE_API_KEY`
- `VITE_REDIRECT_URI`

**Vercel Deployment:**
- `VERCEL_TOKEN` - Vercel authentication token
- `VERCEL_ORG_ID` - Vercel organization ID
- `VERCEL_PROJECT_ID` - Vercel project ID

## Caching Strategy

All workflows use multi-level caching:
1. **npm cache** - Built-in with `actions/setup-node@v4`
2. **node_modules cache** - Custom cache for faster installs
3. **Build artifacts** - Stored for 7 days

Cache keys based on:
- Operating system
- Node.js version
- `package-lock.json` hash

## Security Features

1. **CodeQL Analysis** - Automated code scanning
2. **Dependency Review** - Blocks PRs with vulnerable dependencies
3. **npm audit** - Checks for known vulnerabilities
4. **SARIF Integration** - ESLint findings in Security tab
5. **Minimal Permissions** - Each job has specific permissions

## Auto-Labeling

PRs are automatically labeled based on changed files:
- `documentation` - Markdown files
- `ui` - Components, styles
- `config` - Configuration files
- `dependencies` - package.json changes
- `types` - TypeScript files
- `api` - API/backend changes
- `testing` - Test files
- `ci-cd` - Workflow changes
- `security` - Security-related files

## Best Practices

1. **Always update package-lock.json** when changing package.json
2. **Use dummy values** for env vars in CI builds
3. **Keep secrets out of code** - use GitHub Secrets
4. **Test locally first** with `npm run lint && npm run build && npm test`
5. **Monitor bundle size** - keep main bundle under 500 KB
6. **Review security alerts** - check CodeQL and dependency review findings
7. **Keep copilot-setup-steps.yml updated** - ensure it matches your project's setup needs

## Troubleshooting

### Build Failures
1. Check the "build-and-test" job logs
2. Ensure all dependencies are installed
3. Verify environment variables are set correctly
4. Check for TypeScript errors

### Test Failures
1. Run tests locally: `npm test`
2. Check test setup in `src/test/setup.ts`
3. Ensure jsdom is installed for DOM tests
4. Review test environment variables

### Deployment Failures
1. Verify Vercel secrets are configured
2. Check build succeeds locally
3. Ensure production env vars are set
4. Review Vercel deployment logs

### SARIF Upload Issues
1. Ensure ESLint runs successfully
2. Check `eslint-results.sarif` is generated
3. Verify file exists before upload
4. Review CodeQL action logs

## Maintenance

### Weekly Tasks
- Review CodeQL findings
- Check dependency updates from nightly builds
- Monitor bundle size trends

### Monthly Tasks
- Update GitHub Actions versions (automated via Dependabot)
- Review and optimize caching strategy
- Update Node.js versions in matrix

### As Needed
- Add new workflows for new features
- Update deployment configuration
- Adjust bundle size limits
- Add new auto-labeling rules

## Related Documentation

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Vercel Deployment Guide](../VERCEL_DEPLOYMENT.md)
- [Security Policy](../SECURITY.md)
- [Contributing Guide](../README.md)
