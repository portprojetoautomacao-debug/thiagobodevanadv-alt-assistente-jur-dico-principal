# 🤖 Guia: Usar Kimi K2 Thinking Como Copilot

Este guia mostra como usar o modelo **Kimi-K2-Thinking** do Azure AI Foundry como assistente de código no VS Code, similar ao GitHub Copilot.

---

## ✅ Opção 1: Continue.dev (Recomendada)

**Continue** é uma extensão VS Code gratuita que funciona exatamente como o Copilot, mas aceita qualquer LLM.

### 📦 Instalação

1. **Instalar extensão Continue**
   ```bash
   # No VS Code:
   # Ctrl+Shift+X → buscar "Continue"
   # Ou visitar: https://marketplace.visualstudio.com/items?itemName=Continue.continue
   ```

2. **Configurar Azure AI Foundry**

   Abrir `~/.continue/config.json` (criado automaticamente) e adicionar:

   ```json
   {
     "models": [
       {
         "title": "Kimi K2 Thinking",
         "provider": "azure",
         "model": "Kimi-K2-Thinking",
         "apiBase": "https://thiagobodevanadv-1707-resource.services.ai.azure.com",
         "apiKey": "SUA_KEY_AZURE_AI_FOUNDRY",
         "apiVersion": "2024-05-01-preview",
         "contextLength": 128000,
         "completionOptions": {
           "temperature": 0.7,
           "topP": 0.95,
           "maxTokens": 4000
         }
       }
     ],
     "tabAutocompleteModel": {
       "title": "Kimi K2 Thinking",
       "provider": "azure",
       "model": "Kimi-K2-Thinking"
     },
     "embeddingsProvider": {
       "provider": "gemini",
       "apiKey": "SUA_KEY_GEMINI"
     }
   }
   ```

3. **Obter API Key**

   Copiar da sua configuração Azure AI Foundry (campo "Key" ofuscado no print).

### 🎯 Uso

| Comando | Atalho | Função |
|---------|--------|--------|
| Chat | `Ctrl+L` | Abrir painel de chat |
| Edit Inline | `Ctrl+I` | Editar código selecionado |
| Autocomplete | `Tab` | Completar código |
| `/edit` | No chat | Editar múltiplos arquivos |
| `/comment` | No chat | Adicionar comentários |
| `/fix` | No chat | Corrigir erros |
| `/test` | No chat | Gerar testes |

### 📝 Exemplos de Uso

**1. Corrigir bugs TypeScript**
```
Ctrl+L → "Analise use-processes.ts e corrija todos os type errors"
```

**2. Implementar feature**
```
Ctrl+I (com código selecionado) → "Adicione validação Zod para Process"
```

**3. Gerar testes**
```
/test src/lib/kimi-service.ts → Gera testes automaticamente
```

**4. Revisar PR**
```
/edit → "Revise todos os arquivos modificados seguindo .github/copilot-instructions.md"
```

---

## ✅ Opção 2: Cline (Agente Autônomo)

**Cline** é um agente que modifica arquivos, roda comandos e faz commits automaticamente.

### 📦 Instalação

1. **Instalar extensão**
   ```bash
   # VS Code: Ctrl+Shift+X → buscar "Cline"
   # Ou: https://marketplace.visualstudio.com/items?itemName=saoudrizwan.claude-dev
   ```

2. **Configurar Azure AI**

   `Settings → Cline`:
   - **API Provider**: `Azure OpenAI`
   - **Endpoint**: `https://thiagobodevanadv-1707-resource.services.ai.azure.com/models/chat/completions`
   - **Model**: `Kimi-K2-Thinking`
   - **API Version**: `2024-05-01-preview`
   - **API Key**: Sua key

### 🎯 Comandos

```bash
# Análise completa
"Analise o projeto e liste todos os bugs TypeScript"

# Implementação automática
"Implemente testes E2E para o login usando Playwright"

# Refatoração
"Refatore src/lib/agents.ts seguindo as instruções em copilot-instructions.md"

# Correção de pipeline
"Corrija todos os testes que estão falhando no CI"
```

---

## ✅ Opção 3: Usar no Próprio App

Integrar o Kimi como um agente interno para análises complexas.

### 📦 Setup

1. **Adicionar variáveis de ambiente**

   `.env`:
   ```bash
   VITE_AZURE_AI_FOUNDRY_ENDPOINT=https://thiagobodevanadv-1707-resource.services.ai.azure.com/models/chat/completions
   VITE_AZURE_AI_FOUNDRY_KEY=sua-key-aqui
   VITE_KIMI_MODEL_NAME=Kimi-K2-Thinking
   VITE_KIMI_API_VERSION=2024-05-01-preview
   ```

2. **Usar o serviço**

   ```typescript
   import { kimiService } from '@/lib/kimi-service';

   // Análise jurídica complexa
   const analise = await kimiService.analyzeComplexLegalCase(
     caseDescription,
     question
   );

   // Revisão de código
   const review = await kimiService.reviewCode(
     code,
     'typescript',
     'Seguir padrões do projeto'
   );

   // Debug
   const debug = await kimiService.debugIssue(
     errorMessage,
     code,
     stackTrace
   );
   ```

3. **Exemplos prontos**

   Ver `src/lib/kimi-examples.ts` para casos de uso completos.

---

## 🔑 Onde Obter a API Key

1. Acessar [Azure AI Foundry](https://ai.azure.com/)
2. Ir em **Deployments** → `Kimi-K2-Thinking`
3. Copiar o valor do campo **Key** (atualmente ofuscado)
4. Guardar em local seguro (não commitar!)

---

## 📊 Comparação de Ferramentas

| Feature | Continue.dev | Cline | Integração App |
|---------|-------------|-------|----------------|
| Chat interativo | ✅ | ✅ | ❌ |
| Autocomplete | ✅ | ❌ | ❌ |
| Edit inline | ✅ | ✅ | ❌ |
| Modifica arquivos | ✅ | ✅ | ✅ |
| Roda comandos | ❌ | ✅ | ✅ |
| Faz commits | ❌ | ✅ | ❌ |
| Totalmente grátis | ✅ | ✅ | ✅ |
| Usa modelo customizado | ✅ | ✅ | ✅ |

---

## 🎯 Recomendação

**Para uso diário como Copilot**: Continue.dev
- Interface familiar
- Autocomplete
- Chat + edit inline
- Gratuito e open-source

**Para tarefas complexas**: Cline
- Agente autônomo
- Modifica múltiplos arquivos
- Roda testes e commits

**Para análise jurídica**: Integração no app
- Raciocínio step-by-step
- Contexto do processo
- Integração com outros agentes

---

## 🚀 Próximos Passos

1. Escolher ferramenta (Continue.dev recomendada)
2. Instalar extensão
3. Configurar Azure AI Foundry
4. Testar com comando simples
5. Explorar comandos avançados

---

## 📚 Referências

- [Continue.dev Docs](https://docs.continue.dev/)
- [Cline GitHub](https://github.com/saoudrizwan/claude-dev)
- [Azure AI Foundry](https://learn.microsoft.com/azure/ai-studio/)
- [Kimi-K2 Model Card](https://learn.microsoft.com/azure/ai-foundry/models)
