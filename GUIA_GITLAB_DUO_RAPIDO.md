# 🤖 GitLab Duo - Guia Rápido de Revisões Automáticas

## ⚡ 3 Formas de Usar

### 1️⃣ **No VS Code (MAIS RÁPIDO)**

```
1. Selecione o código
2. Pressione Ctrl+Shift+P
3. Digite "GitLab: Open Duo Chat"
4. Use comandos:
   - /explain     → Explica o código
   - /refactor    → Sugere melhorias
   - /fix         → Corrige problemas
   - /tests       → Gera testes
   - /docs        → Gera documentação
```

**Exemplo Prático:**
```typescript
// Selecione este código:
async function fetchUser(id) {
  const res = await fetch(`/api/users/${id}`)
  return res.json()
}

// Digite no chat:
/fix adicionar tratamento de erros
```

---

### 2️⃣ **Em Merge Request (AUTOMÁTICO)**

```
1. Crie um branch: git push origin seu-branch
2. Abra MR no GitLab
3. Clique em "Request Duo Review"
4. Duo analisa e comenta automaticamente
```

**Link:** https://gitlab.com/portprojetoautomacao-debug/thiagobodevanadv-alt-assistente-jur-dico-principal/-/merge_requests

---

### 3️⃣ **Web IDE do GitLab**

```
1. Abra: https://gitlab.com/portprojetoautomacao-debug/thiagobodevanadv-alt-assistente-jur-dico-principal
2. Pressione . (ponto) ou clique Edit → Web IDE
3. Selecione código
4. Clique 💬 Copilot na sidebar
5. Use comandos iguais
```

---

## 🎯 Comandos Disponíveis

| Comando | O Que Faz | Exemplo |
|---------|----------|---------|
| `/explain` | Explica o que o código faz | `/explain esta função` |
| `/refactor` | Sugere melhorias | `/refactor melhorar performance` |
| `/fix` | Encontra e corrige bugs | `/fix adicionar validações` |
| `/tests` | Gera testes unitários | `/tests casos extremos` |
| `/suggest` | Dá sugestões gerais | `/suggest para este código` |
| `/security-check` | Verifica segurança | `/security-check vulnerabilidades` |
| `/performance-check` | Verifica performance | `/performance-check otimizações` |

---

## 🚀 Workflow Completo

### Para Cada Feature:

```bash
# 1. Crie uma branch
git checkout -b feature/minha-feature

# 2. Faça as mudanças
# 3. Selecione código no VS Code
# 4. Use /refactor ou /fix no Duo Chat
# 5. Implemente as sugestões

# 6. Commit e push
git add .
git commit -m "feat: minha feature"
git push origin feature/minha-feature

# 7. Crie MR no GitLab
# 8. Clique "Request Duo Review"
# 9. Duo revisa automaticamente
# 10. Merge após aprovação
```

---

## 🔍 Análise Automática (Já Configurada)

O arquivo `.gitlab/duo-config.yml` configura revisão automática para:

✅ **Performance** - Identifica gargalos  
✅ **Segurança** - Encontra vulnerabilidades  
✅ **Manutenibilidade** - Sugere refatoração  
✅ **Boas Práticas** - Valida padrões de código  
✅ **Cobertura de Testes** - Verifica testes  

**Linguagens Suportadas:**
- TypeScript ✅
- JavaScript ✅
- Python ✅
- SQL ✅

---

## 📊 Critérios de Revisão

Quando você solicita revisão, o Duo verifica:

1. **Correção** - Código faz o que deveria?
2. **Performance** - Otimizado?
3. **Segurança** - Sem vulnerabilidades?
4. **Legibilidade** - Fácil de entender?
5. **Manutenibilidade** - Fácil de manter?
6. **Testes** - Bem testado?

---

## 💡 Dicas Práticas

### ✅ O Que Funciona Bem

```typescript
// ✅ SELECIONE UMA FUNÇÃO COMPLETA
async function getUserById(id: string) {
  const user = await db.users.findById(id)
  return user
}

// ✅ DEPOIS USE:
// /refactor adicionar validação e tratamento de erro
```

### ❌ O Que Não Funciona

```typescript
// ❌ NÃO selecione fragmentos aleatórios
const x = 5
const y = x + 10

// ❌ Melhor selecionar a função inteira
```

---

## 🎓 Exemplos Reais

### Exemplo 1: Revisar Agente de IA

```typescript
// Seu código do agente:
async function executeAgent(task: AgentTask) {
  const result = await agent.run(task)
  return result
}

// Digite no Duo:
/refactor melhorar tratamento de erro e adicionar logging
/tests gerar testes com mocks

// Duo sugerirá:
// - Try/catch com retry logic
// - Logging detalhado
// - Tests com fixtures
```

### Exemplo 2: Revisar API Call

```typescript
// Código de integração:
async function fetchLegalData(processId: string) {
  return fetch(`https://api.datajud.com?id=${processId}`).then(r => r.json())
}

// Digite:
/fix segurança e validação

// Duo sugerirá:
// - Validar processId (SQL injection)
// - Timeout na requisição
// - Tratamento de erro HTTP
// - Rate limiting
```

---

## 🔑 Requisitos

✅ **Já tem tudo instalado!**
- GitLab Workflow (VS Code)
- Token de acesso
- GitLab Duo habilitado (Free tier)

**Nota:** Free tier tem limite de requisições. Premium = ilimitado.

---

## 🚨 Troubleshooting

### "Não aparece o Duo Chat"
```
1. VS Code → Extensões
2. Procure por "GitLab Workflow"
3. Certifique que está habilitada
4. Reload VS Code (Ctrl+R)
```

### "Erro ao conectar ao GitLab"
```
1. Verifique token: ~/.gitlab/gitlab_token
2. Reconecte: Ctrl+Shift+P → GitLab: Authenticate
3. Ou gere novo token em:
   https://gitlab.com/-/user_settings/personal_access_tokens
```

### "Duo não responde"
```
1. Cheque conexão internet
2. Aguarde (pode levar 10-30s)
3. Tente /explain primeiro (mais rápido)
```

---

## 📞 Próximos Passos

1. **Teste agora:**
   - Abra VS Code
   - Selecione um arquivo `.ts` ou `.tsx`
   - Pressione Ctrl+Shift+P → "GitLab: Open Duo Chat"
   - Digite: `/explain`

2. **Crie um MR com Duo Review:**
   - git push origin seu-branch
   - Abra MR
   - Clique "Request Duo Review"

3. **Explore comandos:**
   - Teste `/refactor`, `/fix`, `/tests`
   - Veja como Duo melhora seu código

---

**🎉 Pronto para revisar código automaticamente!**
