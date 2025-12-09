# Configuração de Labels para Dependabot

## Problema

O Dependabot não consegue adicionar labels aos PRs porque os seguintes labels não existem no repositório:

- `automated`
- `dependencies`
- `docker`
- `npm`
- `devcontainer`
- `github-actions`
- `ci/cd`
- `python`
- `backend`

## Solução

Execute o script `create-github-labels.sh` para criar automaticamente todos os labels necessários:

```bash
./create-github-labels.sh
```

### Pré-requisitos

1. **GitHub CLI instalado:**
   ```bash
   # Ubuntu/Debian
   sudo apt install gh
   
   # macOS
   brew install gh
   ```

2. **Autenticação no GitHub:**
   ```bash
   gh auth login
   ```
   
   Siga as instruções na tela para autenticar.

## Labels que serão criados

### Labels para Dependabot

| Label | Cor | Descrição |
|-------|-----|-----------|
| `automated` | 🟢 Verde | PRs e issues automatizados |
| `dependencies` | 🔵 Azul | Atualizações de dependências |
| `docker` | 🔵 Azul claro | Relacionado a Docker e containers |
| `npm` | 🔴 Vermelho | Dependências npm |
| `devcontainer` | 🔵 Azul | Configuração de Dev Container |
| `github-actions` | 🔵 Azul | GitHub Actions workflows |
| `ci/cd` | 🔵 Azul | Integração e deployment contínuo |
| `python` | 🔵 Azul escuro | Código Python |
| `backend` | 🟡 Amarelo | Backend e APIs |

### Outros labels úteis

O script também cria outros labels úteis para o projeto:

- `security` - Vulnerabilidades
- `performance` - Performance
- `documentation` - Documentação
- `testing` - Testes
- `lgpd` - Proteção de dados
- E mais...

## Verificação

Após executar o script, verifique os labels criados:

```bash
gh label list
```

Ou acesse diretamente no GitHub:
```
https://github.com/thiagobodevanadv-alt/assistente-jur-dico-principal/labels
```

## Próximos passos

Após criar os labels, o Dependabot poderá criar PRs normalmente com os labels apropriados.
