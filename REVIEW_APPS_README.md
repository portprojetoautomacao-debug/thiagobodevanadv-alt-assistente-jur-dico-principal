# Review Apps - Aplicativos de Avaliação

## 📋 O que são Review Apps?

Review Apps são ambientes de teste temporários criados automaticamente para cada branch ou merge request. Eles permitem visualizar e validar mudanças sem precisar configurar um ambiente de desenvolvimento local.

## 🚀 Funcionalidades Configuradas

### ✅ Recursos Implementados
- **Deploy automático** para merge requests
- **Deploy automático** para branches `feature/*` e `review/*`
- **URL dinâmica** baseada no nome da branch
- **Auto-stop** após 1 semana de inatividade
- **Stop manual** via botão no GitLab
- **Route Maps** para navegação direta de arquivos para URLs
- **Integração com Vercel** para hosting

### 🔧 Configuração Técnica

#### Jobs Configurados
- `deploy-review`: Faz deploy do Review App
- `stop-review`: Para o Review App manualmente

#### Environment Dinâmico
- **Nome**: `review/$CI_COMMIT_REF_SLUG`
- **URL**: `https://$CI_COMMIT_REF_SLUG-assistente-juridico-p.vercel.app`
- **Auto-stop**: 1 semana

#### Triggers
- Merge Requests (automático)
- Branches `feature/*` (automático)
- Branches `review/*` (automático)

## 🎯 Como Usar

### 1. Criar uma Branch Feature
```bash
git checkout -b feature/minha-nova-feature
```

### 2. Fazer Alterações
Implemente suas mudanças normalmente.

### 3. Commit e Push
```bash
git add .
git commit -m "feat: implementa nova funcionalidade"
git push origin feature/minha-nova-feature
```

### 4. Criar Merge Request
No GitLab, crie um Merge Request para a branch.

### 5. Aguardar Deploy
O pipeline irá executar automaticamente e criar o Review App.

### 6. Visualizar
- Na aba **"Environments"** do Merge Request, clique em **"View app"**
- Ou acesse diretamente: `https://feature-minha-nova-feature-assistente-juridico-p.vercel.app`

## 🛑 Como Parar um Review App

### Método 1: Automático
O Review App para automaticamente após 1 semana de inatividade.

### Método 2: Manual
1. Vá para o pipeline do Merge Request
2. No job `stop-review`, clique no botão **"Play"** (▶️)
3. O Review App será removido do Vercel

## 🗺️ Route Maps

Os Route Maps permitem navegar diretamente de arquivos do código para suas páginas correspondentes no Review App.

### Mapeamentos Configurados

| Arquivo | URL no Review App |
|---------|-------------------|
| `src/App.tsx` | `/` |
| `src/components/Dashboard.tsx` | `/dashboard` |
| `src/components/ProcessCRM.tsx` | `/processos` |
| `src/components/AIAgents.tsx` | `/agentes` |
| `README.md` | `/docs` |

### Como Usar Route Maps

1. No Merge Request, vá para a aba **"Changes"**
2. Clique em **"View file"** em qualquer arquivo
3. No canto superior direito, clique em **"View on [environment-name]"**

## 🔧 Configuração Avançada

### Personalizar URL
Para alterar o padrão da URL, modifique no `.gitlab-ci.yml`:
```yaml
environment:
  url: https://$CI_COMMIT_REF_SLUG-meu-dominio.vercel.app
```

### Alterar Tempo de Auto-stop
```yaml
environment:
  auto_stop_in: 3 days  # ou 1 week, 1 month, etc.
```

### Adicionar Novos Route Maps
Edite o arquivo `.gitlab/route-map.yml`:
```yaml
- source: 'src/components/NovoComponente.tsx'
  public: '/novo-componente'
```

## 🐛 Troubleshooting

### Review App não aparece
- Verifique se o pipeline executou com sucesso
- Confirme se a branch segue o padrão (`feature/*`, `review/*`) ou é um MR
- Verifique os logs do job `deploy-review`

### URL não funciona
- Aguarde alguns minutos após o deploy
- Verifique se o Vercel token está válido
- Confirme se o projeto existe no Vercel

### Route Maps não funcionam
- Verifique se o arquivo `.gitlab/route-map.yml` existe
- Confirme se o padrão do source está correto
- Teste com arquivos que existem no repositório

## 📊 Monitoramento

### Ver Environments
- Vá para **Operate > Environments** no GitLab
- Veja todos os Review Apps ativos
- Pare environments manualmente se necessário

### Logs do Pipeline
- Em cada pipeline, veja os logs dos jobs `deploy-review` e `stop-review`
- URLs dos Review Apps são exibidas nos logs

## 🔒 Segurança

- Review Apps são temporários e isolados
- Dados sensíveis não são expostos
- Auto-stop previne custos desnecessários
- Apenas membros do projeto podem acessar

## 📚 Referências

- [Documentação GitLab - Review Apps](https://docs.gitlab.com/ee/ci/review_apps/)
- [Route Maps](https://docs.gitlab.com/ee/ci/review_apps/#route-maps)
- [Environments](https://docs.gitlab.com/ee/ci/environments/)