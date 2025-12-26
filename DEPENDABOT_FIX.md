# 🔧 Correção do Dependabot - Problemas Resolvidos

## 📋 Problemas Identificados

### 1. ❌ Assignee Inválido
**Erro**: `portprojetoautomacao-debug` não pôde ser adicionado como responsável.

**Causa**: O usuário pode não existir ou não ter permissões no repositório.

**Solução**: Comentado a seção `assignees` no `dependabot.yml` até que o usuário seja adicionado ao repositório com permissões adequadas.

### 2. ❌ Labels Inexistentes
**Erro**: Labels não encontradas: `automated`, `automerge`, `npm`

**Causa**: As labels não foram criadas no repositório GitHub.

**Solução**:
- Comentadas as labels inexistentes no `dependabot.yml`
- Criado script automatizado para criar todas as labels necessárias

---

## ✅ Correções Aplicadas

### 1. Arquivo `.github/dependabot.yml` Atualizado

**Antes:**
```yaml
assignees:
  - "portprojetoautomacao-debug"
labels:
  - "dependencies"
  - "npm"
  - "automated"
  - "automerge"
```

**Depois:**
```yaml
# Assignees removido até que o usuário seja adicionado ao repositório
# assignees:
#   - "portprojetoautomacao-debug"
labels:
  - "dependencies"
  # Remova o comentário abaixo após criar as labels com scripts/create-github-labels.sh
  # - "npm"
  # - "automated"
  # - "automerge"
```

### 2. Script de Criação de Labels

Criado: `scripts/create-github-labels.sh`

**Labels que serão criadas:**
- `automated` - Criado/atualizado automaticamente (cor: 7057ff)
- `automerge` - Pode ser merged automaticamente (cor: 0e8a16)
- `npm` - Atualizações de pacotes npm (cor: cb2431)
- `dependencies` - Atualizações de dependências (cor: 0366d6)
- `docker` - Relacionado ao Docker (cor: 1d76db)
- `devcontainer` - Relacionado ao dev container (cor: 5319e7)
- `github-actions` - Atualizações de GitHub Actions (cor: 000000)
- `ci/cd` - CI/CD e automação (cor: fbca04)
- `python` - Relacionado ao Python (cor: 3572a5)
- `backend` - Código do backend (cor: d73a4a)

---

## 🚀 Como Aplicar as Correções

### Passo 1: Criar as Labels no GitHub

```bash
# Opção 1: Usando GitHub Token
export GITHUB_TOKEN="seu_token_aqui"
./scripts/create-github-labels.sh

# Opção 2: Passando token diretamente
./scripts/create-github-labels.sh ghp_seu_token_aqui

# Opção 3: Especificar repositório customizado
./scripts/create-github-labels.sh ghp_token owner/repo-name
```

**Como obter um GitHub Token:**
1. Acesse: https://github.com/settings/tokens
2. Clique em "Generate new token (classic)"
3. Selecione o escopo: `repo` (Full control of private repositories)
4. Copie o token gerado

### Passo 2: Atualizar o dependabot.yml

Após criar as labels com sucesso:

1. Abra `.github/dependabot.yml`
2. Descomente as labels criadas:

```yaml
labels:
  - "dependencies"
  - "npm"           # ← Descomentar
  - "automated"     # ← Descomentar
  - "automerge"     # ← Descomentar
```

3. Se o usuário `portprojetoautomacao-debug` tiver sido adicionado ao repositório, descomente também:

```yaml
assignees:
  - "portprojetoautomacao-debug"
```

### Passo 3: Validar a Configuração

```bash
# Fazer commit das mudanças
git add .github/dependabot.yml scripts/create-github-labels.sh
git commit -m "fix: corrigir configuração do Dependabot"
git push

# Verificar no GitHub
# Acesse: https://github.com/seu-repo/network/updates
```

---

## 🔍 Verificação

### Verificar Labels Criadas
https://github.com/portprojetoautomacao-debug/thiagobodevanadv-alt-assistente-jur-dico-principal/labels

### Verificar Status do Dependabot
https://github.com/portprojetoautomacao-debug/thiagobodevanadv-alt-assistente-jur-dico-principal/network/updates

### Testar Manualmente
No GitHub, vá em: **Settings** → **Security** → **Dependabot** → **Dependabot alerts**

---

## 📝 Notas Importantes

### Sobre o Assignee

Para adicionar `portprojetoautomacao-debug` como responsável:

1. Certifique-se de que o usuário existe: https://github.com/portprojetoautomacao-debug
2. Verifique se o usuário tem acesso ao repositório:
   - Acesse: **Settings** → **Collaborators**
   - Adicione o usuário com permissão de `Write` ou superior

### Sobre as Labels

- ✅ **dependencies**: Já existe na maioria dos repositórios GitHub
- ⚠️ **Outras labels**: Precisam ser criadas manualmente ou via script

### Permissões Necessárias

Para executar o script de criação de labels, você precisa:

- ✅ Token GitHub com escopo `repo`
- ✅ Permissões de `Write` ou `Admin` no repositório
- ✅ Acesso à API do GitHub (não bloqueado por firewall)

---

## 🐛 Troubleshooting

### Erro: "Bad credentials"
**Solução**: Verifique se o token está correto e não expirou.

### Erro: "Resource not accessible by integration"
**Solução**: O token precisa ter o escopo `repo` completo.

### Erro: "404 Not Found"
**Solução**: Verifique se o nome do repositório está correto.

### Labels não aparecem no Dependabot
**Solução**:
1. Verifique se as labels foram criadas: `https://github.com/owner/repo/labels`
2. Faça commit e push do `dependabot.yml` atualizado
3. Aguarde alguns minutos para o Dependabot processar

---

## 📚 Referências

- [Documentação Dependabot](https://docs.github.com/en/code-security/dependabot/dependabot-version-updates/configuration-options-for-the-dependabot.yml-file)
- [GitHub Labels API](https://docs.github.com/en/rest/issues/labels)
- [GitHub Tokens](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token)

---

## ✅ Checklist de Validação

- [ ] Script `create-github-labels.sh` executado com sucesso
- [ ] Todas as 10 labels criadas no GitHub
- [ ] `dependabot.yml` atualizado com labels descomentadas
- [ ] Usuário `portprojetoautomacao-debug` adicionado como colaborador (se necessário)
- [ ] Commit e push realizados
- [ ] Dependabot processou sem erros
- [ ] Primeira PR do Dependabot criada com sucesso
