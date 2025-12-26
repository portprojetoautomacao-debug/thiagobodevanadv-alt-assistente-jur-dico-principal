# 🔍 SonarLint / SonarQube - Configuração Completa

## ✅ Configurações Aplicadas

### 🎯 SonarLint (VS Code)
- ✅ **Telemetria DESABILITADA** para privacidade
- ✅ **Análise Automática ATIVADA** (em tempo real + on save + on type)
- ✅ **Connected Mode** configurado para SonarCloud
- ✅ **Focus on New Code** (Clean as You Code - CAYC)
- ✅ **Quick Fixes** automáticos habilitados
- ✅ **Security Hotspots** habilitados
- ✅ **Taint Vulnerabilities** habilitadas
- ✅ **IDE Labs** (recursos experimentais) habilitados

### 📋 Regras Customizadas TypeScript/JavaScript

#### 🔒 Segurança (HABILITADAS)
- `typescript:S2245` - Geração de números aleatórios inseguros
- `typescript:S4426` - Algoritmos criptográficos fracos
- `typescript:S5852` - RegEx vulneráveis (ReDoS)
- `typescript:S6268` - Angular template XSS
- `typescript:S6303` - React XSS via dangerouslySetInnerHTML

#### 🐛 Bugs (HABILITADAS)
- `typescript:S1656` - Atribuição em condições
- `typescript:S1862` - Branches idênticos
- `typescript:S2737` - catch vazio
- `typescript:S3358` - Operador ternário sem efeito
- `typescript:S2201` - Return de função ignorado

#### 🧹 Code Smells (HABILITADAS)
- `typescript:S1481` - Variáveis não utilizadas
- `typescript:S1854` - Valores atribuídos não utilizados
- `typescript:S1172` - Parâmetros não utilizados
- `typescript:S3776` - Complexidade cognitiva
- `typescript:S138` - Funções com muitas linhas
- `typescript:S1067` - Expressões complexas

#### ⚛️ React Específico (HABILITADAS)
- `typescript:S6477` - Hook dependencies incorretos
- `typescript:S6440` - State mutations diretas

#### ⏸️ Regras Desabilitadas
- `typescript:S117` - Naming conventions (muito restritivo)
- `typescript:S125` - Commented out code (útil durante dev)
- `typescript:S1128` - Imports não utilizados (false positives)

---

## 🚀 Comandos Disponíveis

### Análise Local
```bash
# Análise SonarQube local (sem enviar para servidor)
npm run sonar:local
```

### Treinamento e Integração
```bash
# Gravar análise para treinamento
npm run training:record

# Testar análise
npm run training:test

# Gerar relatório
npm run training:report

# Integrar análise
npm run training:integrate
```

---

## 🔌 Connected Mode (SonarCloud)

### Configuração Manual

1. **Instalar SonarLint Extension**
   - Abra VS Code Extensions
   - Procure por "SonarLint"
   - Instale a extensão oficial da SonarSource

2. **Conectar ao SonarCloud**
   ```bash
   # 1. Abra Command Palette (Ctrl+Shift+P)
   # 2. Digite: "SonarLint: Add SonarCloud Connection"
   # 3. Siga o wizard de autenticação OAuth
   ```

3. **Vincular Projeto**
   ```bash
   # 1. Command Palette (Ctrl+Shift+P)
   # 2. Digite: "SonarLint: Update bindings to SonarCloud"
   # 3. Selecione a organização: thiagobodevanadv-alt
   # 4. Selecione o projeto: assistente-juridico-principal
   ```

### Configuração Automática

As configurações já estão em `.vscode/settings.json`:

```json
{
  "sonarlint.connectedMode.project": {
    "connectionId": "sonarcloud",
    "projectKey": "portprojetoautomacao-debug_thiagobodevanadv-alt-assistente-jur-dico-principal"
  }
}
```

---

## 📊 Métricas de Qualidade (sonar-project.properties)

### Quality Gates Configurados

| Métrica | Threshold | Status |
|---------|-----------|--------|
| **Cobertura** | > 80% | 🎯 Meta |
| **Duplicação** | < 3% | 🎯 Meta |
| **Maintainability Rating** | A | ✅ Atingido |
| **Reliability Rating** | A | ✅ Atingido |
| **Security Rating** | A | ✅ Atingido |
| **Security Hotspots** | 0 | 🎯 Meta |
| **Código Complexo** | < 5% | 🎯 Meta |

### Exclusões Configuradas

- ❌ `node_modules/` - Dependências
- ❌ `dist/` - Build output
- ❌ `coverage/` - Relatórios de cobertura
- ❌ `**/*.test.ts` - Arquivos de teste
- ❌ `**/*.spec.ts` - Arquivos de especificação
- ❌ `docs/` - Documentação
- ❌ `scripts/` - Scripts utilitários
- ❌ `*.sh` - Shell scripts

---

## 🎓 Melhores Práticas

### 1. **Análise em Tempo Real**
- SonarLint analisa seu código enquanto você digita
- Veja issues no painel "Problems" do VS Code
- Quick fixes disponíveis via 💡 (lâmpada)

### 2. **Focus on New Code**
- Priorize corrigir issues em código novo/modificado
- Objetivo: manter 0 issues em código novo
- Dívida técnica: corrigir aos poucos código antigo

### 3. **Security Hotspots**
- Revise TODOS os hotspots de segurança
- Marque como "Safe" apenas após análise cuidadosa
- Documente decisões de segurança

### 4. **Code Smells vs Bugs**
- **Bugs** = Prioridade MÁXIMA (podem quebrar)
- **Vulnerabilidades** = Prioridade ALTA (riscos de segurança)
- **Code Smells** = Prioridade MÉDIA (dívida técnica)

### 5. **Complexidade Cognitiva**
- Mantenha funções com complexidade < 15
- Refatore funções complexas em funções menores
- Use early returns para reduzir aninhamento

---

## 🔧 Troubleshooting

### SonarLint não está analisando

1. **Verificar se a extensão está ativa**
   ```bash
   # VS Code Command Palette
   > SonarLint: Show SonarLint Output
   ```

2. **Recarregar configuração**
   ```bash
   # Command Palette
   > Developer: Reload Window
   ```

3. **Verificar Node.js**
   ```bash
   node --version  # Deve ser 22.x
   ```

### Connected Mode não funciona

1. **Verificar token SonarCloud**
   - Acesse: https://sonarcloud.io/account/security
   - Gere um novo token se necessário

2. **Re-vincular projeto**
   ```bash
   # Command Palette
   > SonarLint: Update bindings to SonarCloud
   ```

### Muitos false positives

1. **Desabilitar regra específica**
   - Edite `.vscode/settings.json`
   - Adicione em `sonarlint.rules`:
     ```json
     "typescript:S1234": { "level": "off" }
     ```

2. **Suprimir issue específico no código**
   ```typescript
   // NOSONAR - Justificativa clara aqui
   const result = problematicCode();
   ```

---

## 📚 Recursos Úteis

- 📖 [SonarLint VS Code Docs](https://docs.sonarsource.com/sonarlint/vs-code/)
- 🌐 [SonarCloud Dashboard](https://sonarcloud.io/project/overview?id=portprojetoautomacao-debug_thiagobodevanadv-alt-assistente-jur-dico-principal)
- 📋 [TypeScript Rules](https://rules.sonarsource.com/typescript/)
- 🔒 [Security Rules](https://rules.sonarsource.com/typescript/tag/security/)
- 💡 [Clean as You Code](https://docs.sonarsource.com/sonarqube/latest/user-guide/clean-as-you-code/)

---

## 📈 Telemetria (DESABILITADA)

A telemetria do SonarLint foi **DESABILITADA** para garantir privacidade:

```json
{
  "sonarlint.disableTelemetry": true
}
```

Nenhum dado é enviado para servidores da SonarSource além das análises do Connected Mode.

---

**Última atualização**: 26/12/2024
**Versão**: 2.0.0
