# Dev Container Configuration

Este diretório contém a configuração do Dev Container para o projeto Assistente Jurídico.

## O que é um Dev Container?

Dev Containers permitem que você use um container Docker como um ambiente de desenvolvimento completo. Isso garante que todos os desenvolvedores tenham o mesmo ambiente, independentemente do sistema operacional.

## Usando com GitHub Codespaces

1. Vá para o repositório no GitHub
2. Clique em "Code" > "Codespaces" > "Create codespace on [branch]"
3. Aguarde a criação do ambiente (3-5 minutos)
4. O ambiente estará pronto com todas as dependências instaladas!

## Usando com VS Code Localmente

### Pré-requisitos
- [Docker Desktop](https://www.docker.com/products/docker-desktop)
- [VS Code](https://code.visualstudio.com/)
- [Dev Containers Extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)

### Como usar
1. Clone o repositório
2. Abra o projeto no VS Code
3. Quando solicitado, clique em "Reopen in Container"
4. Aguarde a construção do container (primeira vez pode demorar 5-10 minutos)

## O que está incluído?

### Ambiente Base
- Python 3.11
- Node.js LTS
- Git e GitHub CLI

### Extensões do VS Code
- Python (Pylance, Black formatter)
- Jupyter Notebooks
- Ruff (linter)
- GitHub Copilot
- YAML support
- Docker support

### Portas Expostas
- **8000**: FastAPI Backend
- **8501**: Streamlit Frontend
- **2024**: LangGraph Studio

### Scripts de Configuração
- Instalação automática de dependências Python
- Criação de arquivo `.env` se não existir
- Download de dados NLTK
- Configuração do Git

## Configuração Manual

Se você preferir não usar o script automático, pode executar manualmente:

```bash
cd streamlit-app
pip install -r requirements.txt
cp .env.example .env
# Edite o .env com suas credenciais
```

## Solução de Problemas

### "No machine types available" no Codespaces
Este erro geralmente significa que:
- A configuração solicitou recursos muito altos
- Há problemas com as políticas da organização
- O branch selecionado não tem a configuração adequada

**Solução**: Certifique-se de que este diretório `.devcontainer` existe no branch que você está tentando usar.

### Container build falha
- Verifique se o Docker está rodando
- Tente reconstruir: Command Palette (F1) > "Dev Containers: Rebuild Container"
- Verifique logs em "View" > "Output" > selecione "Dev Containers"

### Dependências não instaladas
- Execute manualmente: `bash .devcontainer/post-create.sh`
- Ou reinstale: `cd streamlit-app && pip install -r requirements.txt`

## Recursos Adicionais

- [Dev Containers Documentation](https://code.visualstudio.com/docs/devcontainers/containers)
- [GitHub Codespaces Documentation](https://docs.github.com/en/codespaces)
- [devcontainer.json Reference](https://containers.dev/implementors/json_reference/)
