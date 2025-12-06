# Guia de Instalação e Teste - PJe Sync Extension

## 📋 Pré-requisitos

- Node.js 18+ instalado
- Chrome/Edge/Brave (Chromium-based browser)
- Conta no Assistente Jurídico (para API Key)

## 🚀 Instalação para Desenvolvimento

### 1. Instalação das Dependências

```bash
cd chrome-extension-pje
npm install
```

### 2. Build da Extensão

```bash
# Build development (com source maps)
npm run dev

# Build production (otimizado)
npm run build
```

### 3. Carregar no Chrome

1. Abra o Chrome e vá para `chrome://extensions`
2. Ative o **Modo desenvolvedor** (canto superior direito)
3. Clique em **Carregar sem compactação**
4. Selecione a pasta `chrome-extension-pje/dist`
5. A extensão "PJe Sync" deve aparecer na lista

## 🧪 Testes

### Testes Unitários

```bash
# Rodar todos os testes
npm test

# Testes em watch mode
npm run test:watch

# Cobertura de código
npm run test:coverage
```

### Testes Manuais

#### 1. Configuração da API Key

1. Abra https://assistente-juridico-p.vercel.app
2. Faça login com Google
3. Vá em **Configurações** → **API Keys**
4. Gere uma nova chave
5. Clique no ícone da extensão
6. Cole a API Key
7. Clique em "Salvar"
8. Verifique se status mudou para "Conectado" (bolinha verde)

#### 2. Teste de Extração de Processos

1. Abra https://pje.tjmg.jus.br
2. Faça login normalmente
3. Acesse o Painel do Advogado
4. Aguarde a página carregar
5. Verifique se aparece um badge verde no canto superior direito
6. Clique no badge - deve mostrar "✓" (verde)
7. Abra o console (F12) e procure por logs `[PJe Sync]`
8. Verifique se os processos foram extraídos

#### 3. Teste de Sincronização

1. Com o painel PJe aberto, clique no ícone da extensão
2. Clique em "Sincronizar Agora"
3. Aguarde mensagem de sucesso
4. Verifique as estatísticas no popup (processos e expedientes)
5. Abra o dashboard do Assistente Jurídico
6. Verifique se os processos aparecem lá

#### 4. Teste de Notificações

1. Com extensão instalada, aguarde uma intimação no PJe
2. Verifique se recebe notificação do Chrome
3. Notificação deve mostrar:
   - Título: "Novo: INTIMAÇÃO"
   - Corpo: Número do processo + descrição

#### 5. Teste de Detecção de Mudanças

1. Abra o painel PJe
2. Aguarde sincronização inicial
3. Simule mudança abrindo um processo
4. Volte para o painel
5. Extensão deve detectar e sincronizar automaticamente
6. Badge deve piscar amarelo (⟳) durante sync

## 🐛 Troubleshooting

### Extensão não aparece

```bash
# Verifique se o build foi feito
ls -la dist/

# Deve conter:
# - background.js
# - content.js
# - popup.js
# - popup.html
# - manifest.json
# - assets/
```

### Badge não aparece no PJe

1. Verifique console do navegador (F12)
2. Procure por erros `[PJe Sync]`
3. Tente recarregar a página (Ctrl+F5)
4. Verifique se está na URL correta: `pje*.tjmg.jus.br/painel*`

### "Configure sua API Key"

1. Verifique se API Key foi salva corretamente
2. Abra console da extensão:
   - Vá em `chrome://extensions`
   - Clique em "Detalhes" na extensão
   - Clique em "Inspecionar visualizações: popup de ação"
   - Execute: `chrome.storage.sync.get(['apiKey'], console.log)`
3. Se vazio, salve novamente

### Sincronização não funciona

1. Verifique rede (F12 → Network)
2. Procure por requisições para `/api/pje-sync`
3. Verifique response:
   - 401: API Key inválida
   - 500: Erro no backend
   - 200: Sucesso

4. Logs úteis:
```javascript
// Console da extensão
chrome.storage.local.get(console.log)

// Console do PJe
// Procure por: [PJe Sync] Sincronizado: X processos
```

## 📊 Verificação de Funcionamento

### Checklist Completo

- [ ] Extensão carregada sem erros
- [ ] API Key configurada
- [ ] Status "Conectado" no popup
- [ ] Badge verde aparece no PJe
- [ ] Console mostra logs de sincronização
- [ ] Estatísticas atualizadas no popup
- [ ] Processos aparecem no dashboard
- [ ] Notificações funcionando
- [ ] Detecção automática de mudanças
- [ ] Sync manual funciona

### Comandos de Diagnóstico

```bash
# Verificar build
npm run build
ls -la dist/

# Rodar testes
npm test

# Verificar tipos TypeScript
npx tsc --noEmit

# Verificar manifest
cat dist/manifest.json | jq

# Empacotar para distribuição
npm run package
ls -la *.zip
```

## 🔄 Atualização da Extensão

1. Faça alterações no código
2. Execute `npm run build`
3. Vá em `chrome://extensions`
4. Clique no ícone de reload da extensão
5. Recarregue a página do PJe

## 📝 Logs e Debug

### Habilitar Logs Detalhados

No console do PJe ou da extensão:

```javascript
// Habilitar logs verbose
localStorage.setItem('PJE_SYNC_DEBUG', 'true');

// Ver processos extraídos
console.log(await chrome.storage.local.get(['processos']));

// Ver expedientes do dia
console.log(await chrome.storage.local.get(['expedientes_today']));

// Ver última sincronização
console.log(await chrome.storage.local.get(['processos_timestamp']));
```

## 🚢 Deploy para Produção

### 1. Build Production

```bash
npm run build
```

### 2. Gerar Pacote

```bash
npm run package
# Cria: pje-sync-v1.0.0.zip
```

### 3. Testar Pacote

1. Desinstale versão de desenvolvimento
2. Instale o ZIP gerado
3. Execute todos os testes manuais novamente

### 4. Publicar na Chrome Web Store

Veja [CHROME_WEB_STORE_PUBLISH.md](./docs/CHROME_WEB_STORE_PUBLISH.md) para instruções detalhadas.

---

## 🆘 Suporte

Se encontrar problemas:

1. Verifique este guia primeiro
2. Consulte logs do console
3. Abra issue no GitHub
4. Entre em contato: thiago@assistente-juridico.com
