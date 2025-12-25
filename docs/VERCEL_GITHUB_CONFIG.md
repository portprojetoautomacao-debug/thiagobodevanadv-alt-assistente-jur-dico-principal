# Configuração Vercel + GitHub

Este documento descreve apenas as configurações essenciais ativas para integração Vercel + GitHub.

## ✅ Configurações Ativas (vercel.json)

### 1. GitHub Integration

```json
"github": {
  "silent": true,              // Silencia comentários do bot Vercel em PRs
  "autoJobCancellation": true, // Cancela builds antigos automaticamente
  "deployment": true           // Habilita deployments via GitHub
}
```

**O que isso faz:**
- **silent**: Remove comentários repetitivos do bot Vercel em Pull Requests (reduz ruído)
- **autoJobCancellation**: Quando você faz múltiplos pushes seguidos, cancela builds antigos e mantém só o mais recente (economia de tempo/recursos)
- **deployment**: Mantém integração completa com GitHub (cada push = deploy automático)

### 2. Deploy Automático

- ✅ **Production**: Push na `main` → Deploy em `https://assistente-juridico-github.vercel.app/`
- ✅ **Preview**: Pull Request → URL única de preview (ex: `https://assistente-juridico-pr-123.vercel.app/`)
- ✅ **Rollback**: Reverter commit = rollback automático instantâneo

### 3. Variáveis de Ambiente Git

Estas variáveis são **auto-injetadas pelo Vercel** em cada deploy (não precisa configurar):

| Variável | Exemplo | Uso |
|----------|---------|-----|
| `VERCEL_GIT_PROVIDER` | `github` | Identificar provedor Git |
| `VERCEL_GIT_REPO_SLUG` | `assistente-jur-dico-principal` | Nome do repositório |
| `VERCEL_GIT_REPO_OWNER` | `thiagobodevanadv-alt` | Organização/usuário |
| `VERCEL_GIT_COMMIT_REF` | `main` ou `feat/nova-funcionalidade` | Branch atual |
| `VERCEL_GIT_COMMIT_SHA` | `fa1eade47b73...` | SHA do commit |
| `VERCEL_GIT_COMMIT_MESSAGE` | `fix: correção de bug` | Mensagem do commit |
| `VERCEL_GIT_COMMIT_AUTHOR_LOGIN` | `thiagobo` | Username GitHub |
| `VERCEL_GIT_PULL_REQUEST_ID` | `42` | Número do PR (se aplicável) |

**Como usar no código:**
```typescript
// Em qualquer serverless function (api/)
export default async function handler(req, res) {
  const branch = process.env.VERCEL_GIT_COMMIT_REF;
  const isProd = branch === 'main';

  if (!isProd) {
    console.log(`Preview deploy from branch: ${branch}`);
  }

  res.json({ branch, isProd });
}
```

## 🔒 Proteção de Forks

**Ativo por padrão** - PRs de forks externos exigem aprovação manual antes de deploy.

Protege contra:
- Vazamento de variáveis de ambiente (secrets)
- Execução de código malicioso
- Roubo do token OIDC

Para desativar (não recomendado): `Projeto → Settings → Security → Git Fork Protection`

## 📦 Cron Jobs Configurados

Crons executam em **horário de Brasília (GMT-3)**:

| Job | Horário | Frequência |
|-----|---------|------------|
| DJEN Monitor | 12:00, 20:00 | 2x/dia |
| DataJud Monitor | 16:00 | 1x/dia |
| Backup | 03:00 | 1x/dia |
| Process Agent Queue | A cada 15min | 96x/dia |
| Notifications | A cada 5min | 288x/dia |
| Calendar Sync | A cada 2h | 12x/dia |
| Deadline Alerts | 11:55 | 1x/dia |
| Watchdog | A cada 30min | 48x/dia |

## 🚀 Comandos Úteis

```bash
# Ver logs de produção
vercel logs https://assistente-juridico-github.vercel.app

# Ver logs de um PR específico
vercel logs https://assistente-juridico-pr-123.vercel.app

# Listar deployments
vercel ls

# Promover preview para produção
vercel promote <deployment-url>

# Rollback para deploy anterior
vercel rollback
```

## 📊 Permissões GitHub Concedidas

O Vercel possui as seguintes permissões no repositório:

### Repositório
- ✅ **Administration**: Criar repositórios de templates
- ✅ **Checks**: Adicionar verificações de build
- ✅ **Contents**: Ler/escrever código (templates)
- ✅ **Deployments**: Sincronizar status
- ✅ **Pull Requests**: Criar comentários e atualizações
- ✅ **Issues**: Interagir com PRs (GitHub requer ambos)
- ✅ **Metadata**: Ler metadados básicos
- ✅ **Webhooks**: Receber eventos Git
- ✅ **Commit Statuses**: Sincronizar status de commits

### Organização
- ✅ **Members** (read): Melhor UX de onboarding

### Usuário
- ✅ **Email addresses** (read): Associar email à conta

## 🔧 Troubleshooting

### Problema: "Repositório não aparece na lista"
**Solução**: Verifique se você tem permissão de **Colaborador** no repositório.

### Problema: "Deploy falha mas local funciona"
**Solução**: Verifique variáveis de ambiente no Vercel Dashboard (`Settings → Environment Variables`)

### Problema: "Comentários do bot Vercel aparecendo"
**Solução**: Já configurado `"silent": true` - comentários estão desabilitados.

### Problema: "Build cancelado automaticamente"
**Solução**: Comportamento esperado com `autoJobCancellation: true` - apenas o commit mais recente é buildado.

## 📚 Referências

- [Documentação Vercel + GitHub](https://vercel.com/docs/deployments/git/vercel-for-github)
- [Variáveis de Ambiente Git](https://vercel.com/docs/projects/environment-variables/system-environment-variables#system-environment-variables)
- [Configuração Git](https://vercel.com/docs/projects/project-configuration#git-configuration)

---

**Última atualização**: 24/12/2025
