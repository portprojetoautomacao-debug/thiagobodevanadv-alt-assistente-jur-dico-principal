# 🤖 GitLab Duo - Revisão de Código com IA

## 🎯 O que é GitLab Duo?

GitLab Duo é a IA nativa do GitLab que oferece:
- ✅ Revisão automática de código em MRs
- ✅ Explicação de código
- ✅ Sugestões de refatoração
- ✅ Correção de bugs
- ✅ Geração de testes
- ✅ Análise de segurança

---

## 🚀 Como Usar

### 1. No GitLab Web (Gratuito)

#### Abrir GitLab Duo Chat
1. Acesse seu repositório: https://gitlab.com/thiagobodevan-a11y/assistente-juridico-p
2. Clique em **Duo Chat** (ícone de chat com IA)
3. Digite seus comandos

#### Comandos Disponíveis

**Explicar Código**
```
/explain

// Cole seu código aqui
const handleLogin = async (email: string, password: string) => {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  })
  return response.json()
}
```

**Refatorar Código**
```
/refactor melhorando performance

// Cole seu código
function calculateTotal(items) {
  let total = 0
  for (let i = 0; i < items.length; i++) {
    total += items[i].price * items[i].quantity
  }
  return total
}
```

**Corrigir Bugs**
```
/fix

// Cole código com problema
const user = data.users[0]
console.log(user.name)  // Erro se array vazio!
```

**Gerar Testes**
```
/tests

// Cole função
function sum(a: number, b: number): number {
  return a + b
}
```

**Sugestões de Melhoria**
```
/suggest

// Cole seu código
```

---

### 2. Em Merge Requests (MR)

#### Revisar MR Automaticamente

1. **Criar MR**
   ```bash
   git checkout -b feature/nova-feature
   # Fazer mudanças
   git push origin feature/nova-feature
   ```

2. **Acesse a MR**
   - GitLab cria a MR automaticamente
   - URL: https://gitlab.com/thiagobodevan-a11y/assistente-juridico-p/-/merge_requests

3. **Solicitar Revisão do Duo**
   - Clique em **Duo Chat** na MR
   - Peça análise: `/review this merge request`
   - Duo analisará todas as mudanças

#### Exemplo de Revisão

```
Me: /review this merge request

Duo Analysis:
✓ Performance: OK - sem gargalos detectados
✓ Security: OK - sem vulnerabilidades
⚠️ Code Quality: 2 sugestões
  1. Função muito longa - considere dividir
  2. Variável não utilizada: tempData

✓ Tests: Cobertura 85% - bom!
```

---

### 3. No VS Code (Com Extensão GitLab Workflow)

#### Setup

1. Instale extensão GitLab Workflow (já feito ✅)
2. Abra arquivo TypeScript/JavaScript
3. Selecione código
4. Pressione `Ctrl+Shift+I` (Windows/Linux) ou `Cmd+Shift+I` (Mac)

#### Usar Duo no VS Code

```typescript
// Selecione este código

async function fetchUserData(userId: string) {
  try {
    const response = await fetch(`/api/users/${userId}`)
    const data = await response.json()
    return data
  } catch (error) {
    console.error(error)
  }
}

// Pressione Ctrl+Shift+I
// Digite: /refactor para melhorar tratamento de erro
```

---

## 📋 Casos de Uso

### Use Case 1: Revisar Nova Feature

```bash
# 1. Criar branch
git checkout -b feature/payment-system

# 2. Fazer mudanças
# ... editar código ...

# 3. Fazer push
git push origin feature/payment-system

# 4. No GitLab, criar MR
# 5. No chat da MR, digitar:
/review this merge request
/suggest improvements for security

# 6. Duo analisa e oferece sugestões
```

### Use Case 2: Refatorar Código Legado

```
/refactor reducing complexity and improving maintainability

// Cole o código legado de 100+ linhas
```

### Use Case 3: Corrigir Bug

```
/fix analyzing the performance issue

// Cole o código com problema
```

### Use Case 4: Adicionar Testes

```
/tests for comprehensive coverage

// Cole função
```

---

## 🎯 Boas Práticas

### 1. Seja Específico
```
❌ /refactor
✅ /refactor improving performance and reducing memory usage
```

### 2. Inclua Contexto
```
❌ /fix bug

✅ /fix handling null values in user profile validation
```

### 3. Revise Sugestões
```
// Duo sugere, mas VOCÊ verifica:
1. A sugestão faz sentido?
2. Mantém a lógica original?
3. Melhora legibilidade?
4. Não quebra testes?
```

### 4. Use em MRs Antes de Mergear
```
// Workflow ideal:
1. Fazer mudanças
2. Push para MR
3. Solicitar Duo Review
4. Revisar sugestões
5. Atualizar código se necessário
6. Fazer merge
```

---

## 💡 Dicas

### Comando Ajuda
```
/help
```

### Perguntas Naturais
```
// Funciona! Não precisa ser formal:
"Como melhorar a performance dessa função?"
"Há vulnerabilidades aqui?"
"Simplifica esse código pra mim"
```

### Interação Contínua
```
Você pode fazer perguntas seguidas:

Me: /explain this code
Duo: [explicação]

Me: Como melhorar?
Duo: [sugestões]

Me: Pode gerar testes?
Duo: [testes]
```

---

## 🔧 Configuração (Seu Repo)

Arquivo: `.gitlab/duo-config.yml`

Habilita:
- ✅ Revisão automática
- ✅ Análise de performance
- ✅ Verificação de segurança
- ✅ Sugestões de refatoração
- ✅ Verificação de cobertura de testes

---

## 📊 Requisitos

| Recurso | Requisito | Status |
|---------|-----------|--------|
| GitLab Web | Qualquer plano | ✅ Free+ |
| VS Code | GitLab Workflow ext | ✅ Instalado |
| Duo Chat | Free tier | ✅ Disponível |
| Code Review | Free tier | ✅ Disponível |
| MR Analysis | Free tier | ✅ Disponível |

---

## 🎬 Workflow Completo

### Dia a Dia

```
1. Começar Feature
   git checkout -b feature/xyz

2. Desenvolver e Testar Localmente
   npm run build
   npm run test

3. Fazer Push
   git push origin feature/xyz

4. GitLab Cria MR Automaticamente

5. Solicitar Revisão Duo
   No chat da MR: /review this merge request

6. Duo Analisa
   - Performance
   - Segurança
   - Qualidade
   - Testes

7. Implementar Sugestões
   git add .
   git commit -m "refactor: apply Duo suggestions"
   git push

8. Fazer Merge
   Clique "Merge" na MR

9. Monitorar Produção
   Monitor → Error Tracking
```

---

## ⚡ Shortcuts

### Revisão Rápida
```
/review
```

### Só Performance
```
/performance-check
```

### Só Segurança
```
/security-check
```

### Apenas Sugestões
```
/suggest
```

---

## 📚 Recursos

- [GitLab Duo Docs](https://docs.gitlab.com/ee/user/ai_features.html)
- [Code Review com IA](https://docs.gitlab.com/ee/user/ai_features/code_review.html)
- [Duo Chat Commands](https://docs.gitlab.com/ee/user/ai_features/chat.html)

---

## ✅ Seu Setup

- ✅ GitLab Duo habilitado
- ✅ Revisão automática em MRs
- ✅ VS Code pronto
- ✅ Configuração: `.gitlab/duo-config.yml`
- ✅ Error Tracking: Monitor → Error Tracking

**Tudo configurado! 🚀 Comece a revisar código com IA!**

### Próximo Passo
1. Crie uma MR de teste
2. No chat: `/review this merge request`
3. Veja Duo analisar seu código
4. Implemente sugestões se quiser
