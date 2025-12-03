# Configuração SonarCloud - Assistente Jurídico PJe

## 📋 Visão Geral

Este projeto está configurado com **SonarCloud** para análise contínua de qualidade e segurança do código.

---

## 🔧 Arquivos de Configuração

| Arquivo | Propósito |
|---------|-----------|
| `sonar-project.properties` | Configuração principal do SonarCloud |
| `.sonarlint/connectedMode.json` | Configuração do SonarLint (VS Code) |
| `.vscode/settings.json` | Integração VS Code + SonarLint |
| `.github/workflows/sonarcloud.yml` | CI/CD - Análise automática |

---

## ✅ Configuração Atual

### **1. Informações do Projeto**
```properties
Organization: thiagobodevan-a11y
Project Key: thiagobodevan-a11y_assistente-juridico-p
Project Name: Assistente Jurídico PJe
```

### **2. Arquivos Analisados**
- **Sources**: `src/`, `api/`
- **Tests**: `src/**/*.test.ts`, `src/**/*.spec.tsx`

### **3. Exclusões**
| Tipo | Padrão |
|------|--------|
| Código | `node_modules`, `dist`, `coverage`, `public` |
| Testes | `**/*.test.ts`, `**/*.spec.tsx` |
| Coverage | Arquivos de teste + tipos + configs |
| Duplicação | Arquivos de teste + `types.ts` |

### **4. Integrações**
- ✅ **GitHub Actions**: Análise automática em push/PR
- ✅ **VS Code**: SonarLint Connected Mode
- ✅ **Quality Gate**: Verificação automática de qualidade

---

## 🚀 Como Usar

### **VS Code (Desenvolvimento Local)**

1. **Extensão SonarLint**
   - Já instalada e configurada no workspace
   - Análise em tempo real enquanto codifica
   - Sugestões de correção inline
   
   > Dica: Se você usa `nvm` para gerenciar Node.js, o VS Code pode não detectar automaticamente o executável do Node para o SonarLint.
   > Defina `sonarlint.pathToNodeExecutable` em `.vscode/settings.json` apontando para o binário do Node 22, por exemplo:
   > ```json
   > "sonarlint.pathToNodeExecutable": "/usr/local/share/nvm/versions/node/v22.21.1/bin/node"
   > ```
   > No Windows, use: `C:\\Program Files\\nodejs\\node.exe` (duas barras invertidas)

2. **Ver Problemas Detectados**
   - Painel "Problems" do VS Code
   - Filtro: SonarLint
   - Clique para ver detalhes e correções

### **GitHub Actions (CI/CD)**

A análise roda automaticamente quando você:
- ✅ Faz push para `main` ou `develop`
- ✅ Abre/atualiza um Pull Request

**Workflow**: `.github/workflows/sonarcloud.yml`

**O que é analisado:**
1. Código TypeScript/JavaScript
2. Cobertura de testes
3. Duplicação de código
4. Vulnerabilidades de segurança
5. Code smells

---

## 🔑 Configuração de Secrets (GitHub)

Para o workflow funcionar, configure o secret:

### **Passo a Passo:**

1. Acesse: https://github.com/thiagobodevan-a11y/assistente-juridico-p/settings/secrets/actions

2. Clique em **"New repository secret"**

3. Configure:
   ```
   Name: SONAR_TOKEN
   Value: [Seu token do SonarCloud]
   ```

4. **Gerar token** (se não tiver):
   - Acesse: https://sonarcloud.io/account/security
   - "Generate Tokens" → Nome: `GitHub Actions`
   - Copie o token gerado

---

## 📊 SonarCloud Dashboard

Acesse o dashboard do projeto:

🔗 **URL**: https://sonarcloud.io/dashboard?id=thiagobodevan-a11y_assistente-juridico-p

**O que você encontra:**
- 📈 Métricas de qualidade (bugs, vulnerabilidades, code smells)
- 📊 Cobertura de testes
- 🔍 Histórico de análises
- 🎯 Quality Gate status
- 📝 Relatórios detalhados

---

## 🎯 Quality Gate

### **Critérios Atuais**

| Métrica | Threshold |
|---------|-----------|
| Coverage em novo código | ≥ 80% |
| Duplicação em novo código | ≤ 3% |
| Maintainability Rating | ≥ A |
| Reliability Rating | ≥ A |
| Security Rating | ≥ A |

### **Status do Quality Gate**

Visível em:
- Pull Request checks (GitHub)
- SonarCloud dashboard
- Badge no README (se configurado)

---

## 🛠️ Comandos Úteis

### **Rodar análise localmente** (opcional)
```bash
# Instalar SonarScanner
npm install -g sonarqube-scanner

# Rodar análise
sonar-scanner \
  -Dsonar.organization=thiagobodevan-a11y \
  -Dsonar.projectKey=thiagobodevan-a11y_assistente-juridico-p \
  -Dsonar.sources=src,api \
  -Dsonar.host.url=https://sonarcloud.io \
  -Dsonar.token=SEU_TOKEN
```

### **Gerar coverage para SonarCloud**
```bash
npm run test:coverage
# Arquivo gerado: coverage/lcov.info
```

---

## 🔍 Troubleshooting

### **SonarLint não está funcionando no VS Code**

1. Verifique se a extensão está ativa:
   ```
   Ctrl+Shift+P → "SonarLint: Show SonarLint Output"
   ```

2. Verifique a conexão:
   ```
   Ctrl+Shift+P → "SonarLint: Update all project bindings"
   ```

3. Recarregue a janela:
   ```
   Ctrl+Shift+P → "Developer: Reload Window"
   ```

### **Workflow do GitHub Actions falhando**

1. **Secret não configurado**
   - Erro: `SONAR_TOKEN not found`
   - Solução: Configure o secret (ver seção acima)

2. **Problemas de coverage**
   - Erro: `coverage file not found`
   - Solução: Verifique se `npm run test:coverage` funciona localmente

3. **Build falhando**
   - Erro: `Build failed`
   - Solução: Garanta que `npm run build` funciona localmente

### **Token expirado**

Se receber erro de autenticação:
1. Gere novo token em: https://sonarcloud.io/account/security
2. Atualize o secret `SONAR_TOKEN` no GitHub
3. Re-rode o workflow

---

## 📚 Recursos Adicionais

- **SonarCloud Docs**: https://docs.sonarcloud.io/
- **SonarLint VS Code**: https://marketplace.visualstudio.com/items?itemName=SonarSource.sonarlint-vscode
- **Quality Gate Docs**: https://docs.sonarcloud.io/improving/quality-gates/

---

## 🎨 Badge para README (Opcional)

Adicione ao `README.md`:

```markdown
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=thiagobodevan-a11y_assistente-juridico-p&metric=alert_status)](https://sonarcloud.io/dashboard?id=thiagobodevan-a11y_assistente-juridico-p)

[![Bugs](https://sonarcloud.io/api/project_badges/measure?project=thiagobodevan-a11y_assistente-juridico-p&metric=bugs)](https://sonarcloud.io/dashboard?id=thiagobodevan-a11y_assistente-juridico-p)

[![Code Smells](https://sonarcloud.io/api/project_badges/measure?project=thiagobodevan-a11y_assistente-juridico-p&metric=code_smells)](https://sonarcloud.io/dashboard?id=thiagobodevan-a11y_assistente-juridico-p)

[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=thiagobodevan-a11y_assistente-juridico-p&metric=coverage)](https://sonarcloud.io/dashboard?id=thiagobodevan-a11y_assistente-juridico-p)
```

---

**Última atualização**: 7 de junho de 2024
