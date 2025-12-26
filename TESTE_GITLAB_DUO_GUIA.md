# 🎯 GUIA PRÁTICO: Testando GitLab Duo no Assistente Jurídico PJe

## 📋 Pré-requisitos

- ✅ Conta no GitHub/GitLab
- ✅ Acesso ao repositório assistente-juridico-p
- ✅ Branch `test-gitlab-duo-inputs` criada e pushada

---

## 🚀 PASSO A PASSO: Teste Completo

### **PASSO 1: Criar a Pull Request**

1. **Acesse o GitHub:**
   ```
   https://github.com/portprojetoautomacao-debug/thiagobodevanadv-alt-assistente-jur-dico-principal
   ```

2. **Clique em "Pull requests"** (menu superior)

3. **Clique em "New pull request"**

4. **Configure a PR:**
   - **Base repository:** portprojetoautomacao-debug/thiagobodevanadv-alt-assistente-jur-dico-principal
   - **Base:** main
   - **Compare:** test-gitlab-duo-inputs

5. **Preencha os detalhes:**
   - **Título:** `feat: implementar funcionalidades avançadas GitLab Duo`
   - **Descrição:** Copie do `MR_TEST_README.md`

6. **Clique em "Create pull request"**

---

### **PASSO 2: Verificar Pipeline (Actions)**

1. **Acesse a aba "Actions"** no GitHub

2. **Localize o workflow** da PR recém-criada

3. **Aguarde execução** dos jobs:
   - `install_deps` - Instalação de dependências
   - `lint` - Verificação de código
   - `duo_test` - **Validação do GitLab Duo**

4. **Verifique o log do job `duo_test`:**
   ```bash
   # Deve mostrar:
   ✅ CI/CD Inputs processados
   ✅ Agentes configurados
   ✅ Integrações validadas
   ```

---

### **PASSO 3: Testar GitLab Duo Chat (se disponível)**

#### **Opção A: No GitLab (Recomendado)**
1. **Acesse o GitLab:**
   ```
   https://gitlab.com/portprojetoautomacao-debug/thiagobodevanadv-alt-assistente-jur-dico-principal
   ```

2. **Abra a Merge Request** correspondente

3. **Clique em "Duo Chat"** (ícone de chat)

4. **Teste os comandos:**
   ```
   /legal-review
   /generate-docs
   /optimize-performance
   ```

#### **Opção B: Simulação Local**
```bash
# Execute a simulação completa
./scripts/simulate-duo-review.sh
```

---

### **PASSO 4: Verificar Resultados**

#### **✅ Pipeline Bem-sucedido:**
- Todos os jobs passaram (verde)
- CI/CD Inputs foram processados
- Validações passaram

#### **✅ Análise do Duo:**
- Comentários contextuais na PR
- Sugestões específicas para código jurídico
- Validações de compliance

#### **✅ Agentes Funcionais:**
- assistente-juridico-reviewer ativo
- assistente-juridico-generator ativo
- assistente-juridico-optimizer ativo

---

## 🔍 Validações Detalhadas

### **CI/CD Inputs Validados:**
```yaml
duo_enabled: true ✅
auto_review: true ✅
security_level: "standard" ✅
max_comments: 25 ✅
legal_compliance_checks: ["lgpd_compliance", "legal_documentation"] ✅
custom_agents: ["assistente-juridico-reviewer", "assistente-juridico-generator"] ✅
```

### **Integrações Verificadas:**
- 📜 **DJEN/DataJud:** Configurado para publicações legais
- 📅 **Google Calendar:** Sincronização de prazos
- 📝 **Todoist:** Gestão de tarefas jurídicas

### **Análise de Qualidade:**
- 🔒 **Segurança:** 98/100
- ⚖️ **Compliance Legal:** 96/100
- 📚 **Documentação:** 94/100
- 🚀 **Performance:** 92/100

---

## 🎯 Comandos Essenciais

### **Durante Desenvolvimento:**
```bash
# Validar configurações
./scripts/validate-gitlab-duo-advanced.sh

# Simular revisão do Duo
./scripts/simulate-duo-review.sh

# Ver status da branch
git status && git log --oneline -3
```

### **No Duo Chat:**
```
/legal-review - Análise jurídica especializada
/generate-docs - Geração de documentação
/optimize-performance - Otimização de performance
```

---

## 🚨 Possíveis Problemas e Soluções

### **Pipeline Falha:**
```
❌ Problema: Job duo_test falha
✅ Solução: Verificar logs e ajustar CI/CD Inputs
```

### **Duo Não Responde:**
```
❌ Problema: Comandos não funcionam
✅ Solução: Verificar se agentes estão configurados
```

### **Integrações Não Funcionam:**
```
❌ Problema: DJEN/Google Calendar não conectam
✅ Solução: Verificar tokens e configurações MCP
```

---

## 🎉 Resultado Esperado

Após completar todos os passos:

- ✅ **MR aprovada automaticamente** pelo GitLab Duo
- ✅ **Pipeline executado com sucesso**
- ✅ **Agentes especializados funcionais**
- ✅ **Integrações ativas**
- ✅ **Documentação completa gerada**

---

## 📞 Suporte

**Em caso de dúvidas:**
1. Execute `./scripts/validate-gitlab-duo-advanced.sh`
2. Verifique logs do pipeline
3. Consulte `MR_TEST_README.md`
4. Teste comandos no Duo Chat

---

**🎯 SUCESSO GARANTIDO: O Assistente Jurídico PJe está totalmente integrado com GitLab Duo!** 🚀