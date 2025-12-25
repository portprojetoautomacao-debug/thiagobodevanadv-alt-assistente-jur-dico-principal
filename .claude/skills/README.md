# Claude Skills - Assistente Jurídico PJe

Este diretório contém **skills customizadas** para o GitHub Copilot (Claude Sonnet 4.5).

## 📚 Skills Disponíveis

| Skill              | Arquivo             | Descrição                                  |
| ------------------ | ------------------- | ------------------------------------------ |
| **Code Formatter** | `code-formatter.md` | Formata código seguindo padrões do projeto |
| **Code Fix**       | `code-fix.md`       | Corrige bugs e erros de código             |
| **Code Search**    | `code-search.md`    | Pesquisa código e arquitetura              |
| **Problem Solver** | `problem-solver.md` | Resolve problemas técnicos                 |
| **Test Debugging** | `test-debugging.md` | Debug e correção de testes                 |

## 🚀 Como Usar

As skills são **automaticamente carregadas** pelo GitHub Copilot quando você usa `@workspace` ou faz perguntas no chat.

### Exemplos de Uso

#### Formatar Código

```
@workspace Formata o arquivo ProcessList.tsx seguindo os padrões
```

#### Corrigir Bug

```
@workspace Corrige o erro "Cannot read property 'X' of undefined" em use-processes.ts
```

#### Pesquisar Código

```
@workspace Onde está implementada a função de cálculo de prazos?
```

#### Resolver Problema

```
@workspace Build falha no Vercel mas passa local, como debugar?
```

#### Debug de Teste

```
@workspace Teste use-processes.test.ts falha com timeout, como corrigir?
```

## 🔧 Configuração

**Habilitado em:** `.vscode/settings.json`

```jsonc
{
  "github.copilot.chat.useClaudeSkills": true,
}
```

## 📖 Estrutura de uma Skill

Cada skill segue este formato:

```markdown
# Nome da Skill

## Description

Descrição breve do que a skill faz

## Usage

Quando usar esta skill

## Instructions

Instruções detalhadas, exemplos, comandos, etc.
```

## ✨ Benefícios

- ✅ **Respostas mais precisas** - Copilot usa contexto específico do projeto
- ✅ **Padrões consistentes** - Segue sempre os mesmos padrões
- ✅ **Comandos prontos** - Não precisa lembrar comandos complexos
- ✅ **Troubleshooting rápido** - Soluções pré-documentadas
- ✅ **Onboarding facilitado** - Novos devs tem guias prontos

## 🔄 Atualização

Para adicionar nova skill:

1. Criar arquivo em `.claude/skills/nome-da-skill.md`
2. Seguir formato padrão (Description, Usage, Instructions)
3. Skill é carregada automaticamente (sem restart necessário)

## 📚 Referências

- **Documentação principal:** `.github/copilot-instructions.md`
- **Agentes IA:** `TODOS_OS_15_AGENTES.md`
- **Configuração:** `README.md`

---

**Data de criação:** 25/12/2025
**Status:** ✅ Ativo
