# 🦊 Instruções de Ativação do GitLab Duo Agent Platform

Para ativar o **GitLab Duo Agent Platform** no projeto `assistente-juridico-p`, siga os passos abaixo. Esta funcionalidade permite que os agentes de IA interajam diretamente com seu código e infraestrutura.

## 🚨 Passo 1: Ativação no GitLab (Navegador)

Você precisa ativar a funcionalidade nas configurações do projeto:

1. Acesse o projeto no GitLab: [thiagobodevan-a11y-group/assistente-juridico-p](https://gitlab.com/thiagobodevan-a11y-group/assistente-juridico-p)
2. Vá para **Settings** (Configurações) > **General** (Geral).
3. Expanda a seção **Visibility, project features, permissions**.
4. Procure por **GitLab Duo** ou **AI Features**.
5. Ative a opção **GitLab Duo** / **Experiment features**.
6. Clique em **Save changes**.

> **Nota:** Se você não ver essa opção, verifique se sua organização/grupo tem a licença GitLab Ultimate ou Premium com Duo habilitado.

## 🔌 Passo 2: Conectar Agente Kubernetes (Se necessário)

Se a mensagem menciona "Agent Platform", pode ser necessário registrar o agente:

1. Vá para **Operate** > **Kubernetes clusters**.
2. Clique em **Connect a cluster (agent)**.
3. Selecione o agente `agenterevisor` (já configurado no repositório).
4. Clique em **Register**.
5. O GitLab fornecerá um token e comandos Helm.
   - Se você já tem o cluster rodando, use esses comandos.
   - Se não, apenas o registro já habilita a integração no lado do GitLab.

## 💻 Passo 3: VS Code Extension

Se a mensagem "Turn on for this project" aparece no VS Code:

1. Certifique-se de que a extensão **GitLab Workflow** está instalada e autenticada.
2. Clique no ícone do GitLab (🦊) na barra lateral.
3. Na seção **GitLab Duo Chat** ou similar, se houver um botão "Turn on", clique nele.
4. Se pedir permissão, autorize.

## 🛠️ Verificação de Arquivos

O projeto já contém os arquivos de configuração necessários:
- `.gitlab/agents/agenterevisor/config.yaml`
- `.gitlab/duo-config.yml`
- `.gitlab/duo-agent-platform.toml`

## 🆘 Solução de Problemas

- **Erro "User must have developer access"**: Verifique se sua conta tem permissão de **Maintainer** ou **Owner** no projeto para fazer a configuração inicial. Developer pode não ser suficiente para ativar features.
- **Token Inválido**: Se o VS Code reclamar de token, rode `./add-gitlab-account.sh` novamente e gere um novo PAT com escopo `api` e `ai_features` (se disponível).

---
**Precisa de ajuda?** Consulte a documentação oficial do GitLab Duo ou contate o administrador do grupo.

Consulte também as instruções adicionais em [.github/copilot-instructions.md](.github/copilot-instructions.md)
