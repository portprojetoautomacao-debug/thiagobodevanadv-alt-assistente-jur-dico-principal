# GitHub Actions Workflows

This directory contains all CI/CD workflows for the Assistente Jurídico PJe project.

## Workflows Overview

### 1. CI Workflow (`ci.yml`)
**Triggers:** Push to `main`, `develop`, `copilot/**` branches; Pull requests to `main`, `develop`

**Jobs:**
- **build-and-test**: Builds and tests on Node.js 18.x and 20.x
  - Runs linter
  - Builds application
  - Runs tests
  - Uploads build artifacts
  
- **lint-security**: Security and quality checks
  - npm audit
  - Dependency check
  - ESLint with SARIF output for GitHub Code Scanning
  
- **build-matrix-status**: Aggregates status of all jobs

**Features:**
- Matrix testing across multiple Node.js versions
- Artifact retention for 7 days
- Caching for faster builds
- SARIF integration for security findings

### 2. Pull Request Workflow (`pr.yml`)
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
