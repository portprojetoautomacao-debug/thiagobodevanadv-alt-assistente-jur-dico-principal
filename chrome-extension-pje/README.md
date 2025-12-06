# PJe Sync - Extensão Chrome

> Extensão oficial do **Assistente Jurídico** para monitoramento em tempo real do PJe (Processo Judicial Eletrônico).

## 🚀 Instalação

### Para Usuários

**Opção 1: Chrome Web Store** (Em breve)

```
https://chrome.google.com/webstore/detail/pje-sync/...
```

**Opção 2: Instalação Manual**

1. Baixe o arquivo `pje-sync-v1.0.0.zip`
2. Descompacte em uma pasta
3. Abra `chrome://extensions`
4. Ative "Modo desenvolvedor"
5. Clique em "Carregar sem compactação"
6. Selecione a pasta descompactada

### Para Desenvolvedores

```bash
# Clone o repositório principal
cd assistente-juridico-p/chrome-extension-pje

# Instale dependências
npm install

# Build development
npm run dev

# Build production
npm run build

# Gerar ZIP para distribuição
npm run package
```

## 🔧 Configuração

### 1. Obter API Key

1. Acesse https://assistente-juridico-p.vercel.app
2. Faça login com sua conta Google
3. Vá em **Configurações** → **API Keys**
4. Clique em "Gerar Nova Chave"
5. Copie a chave gerada

### 2. Configurar Extensão

1. Clique no ícone da extensão na barra de ferramentas
2. Cole sua API Key no campo
3. Clique em "Salvar"
4. Verifique se o status mudou para "Conectado" (bolinha verde)

## 📖 Como Usar

### Sincronização Automática

A extensão monitora automaticamente:

- ✅ Painel do Advogado no PJe
- ✅ Novos processos distribuídos
- ✅ Movimentações processuais
- ✅ Intimações e citações

**Dados sincronizados:**

- Número do processo (CNJ)
- Partes (autor e réu)
- Classe e assunto
- Vara e comarca
- Último movimento
- Data e hora

### Sincronização Manual

1. Abra o painel do PJe (https://pje.tjmg.jus.br)
2. Clique no ícone da extensão
3. Clique em "Sincronizar Agora"
4. Aguarde confirmação

### Badge Visual

Um badge aparece no canto superior direito do PJe:

- 🟢 **Verde (✓)**: Sincronizado
- 🟡 **Amarelo (⟳)**: Sincronizando
- 🔴 **Vermelho (✗)**: Erro
- 🟠 **Laranja (!)**: Nenhum processo encontrado

## 🔒 Privacidade e Segurança

### Dados Coletados

A extensão coleta apenas:

- ✅ Dados públicos visíveis no painel do PJe
- ✅ Informações processuais (número, partes, movimentos)
- ✅ Estatísticas de uso (para melhorias)

### Dados NÃO Coletados

- ❌ Senha do PJe
- ❌ Certificado digital
- ❌ Documentos anexados
- ❌ Petições completas
- ❌ Dados de pagamento

### Segurança

- 🔐 API Key armazenada apenas localmente (Chrome Storage)
- 🔐 Comunicação HTTPS criptografada
- 🔐 Código open-source auditável
- 🔐 Sem rastreamento de terceiros

## 🛠️ Desenvolvimento

### Estrutura do Projeto

```
chrome-extension-pje/
├── src/
│   ├── content/          # Script injetado no PJe
│   │   ├── extractors/   # Extratores de dados
│   │   └── observers/    # Observadores DOM
│   ├── background/       # Service Worker
│   │   ├── api-client.ts
│   │   └── sync-manager.ts
│   ├── popup/            # Interface do popup
│   │   ├── popup.html
│   │   ├── popup.css
│   │   └── popup.ts
│   └── shared/           # Código compartilhado
│       ├── types.ts
│       ├── constants.ts
│       └── utils.ts
├── tests/                # Testes unitários
├── manifest.json         # Manifest v3
├── webpack.config.js     # Build config
└── package.json
```

### Scripts NPM

```bash
npm run dev              # Build dev + watch
npm run build            # Build production
npm run test             # Rodar testes
npm run test:watch       # Testes em watch mode
npm run package          # Gerar ZIP
```

### Testes

A extensão possui **48 testes unitários** cobrindo todas as funcionalidades:

| Arquivo                        | Testes | Descrição                       |
| ------------------------------ | ------ | ------------------------------- |
| `utils.test.ts`                | 18     | Validação CNJ, formatação, hash |
| `popup.test.ts`                | 10     | Interface do popup e interações |
| `expediente-extractor.test.ts` | 8      | Extração de intimações/citações |
| `content-script.test.ts`       | 7      | Observador DOM e detecção       |
| `process-extractor.test.ts`    | 5      | Extração de processos do PJe    |

```bash
# Rodar todos os testes
npm run test

# Testes em modo watch
npm run test:watch

# Cobertura de código
npm run test:coverage

# CI (sem watch, saída limpa)
npm run test:ci
```

**Integração com CI/CD:**

- O workflow `chrome-extension.yml` executa testes automaticamente
- O script `npm run test:all` (raiz) inclui testes da extensão
- Build falha se qualquer teste não passar

## 📊 Fluxo de Dados

```
┌─────────────────────────────────────────────────────────┐
│ 1. PJe (Painel do Advogado)                             │
│    ↓ DOM Observer detecta mudanças                      │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│ 2. Content Script (content.ts)                          │
│    ↓ Extrai processos e expedientes                     │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│ 3. Background Service Worker (service-worker.ts)        │
│    ↓ Envia para backend via API                         │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│ 4. Backend API (/api/pje-sync)                          │
│    ↓ Salva no KV storage                                │
│    ↓ Dispara Mrs. Justin-e                              │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│ 5. Dashboard (assistente-juridico-p.vercel.app)         │
│    → Exibe processos e expedientes em tempo real        │
└─────────────────────────────────────────────────────────┘
```

## 🐛 Solução de Problemas

### Extensão não aparece

1. Verifique se está habilitada em `chrome://extensions`
2. Recarregue a extensão (botão de atualização)
3. Reinicie o Chrome

### "Configure sua API Key"

1. Gere uma nova API Key no dashboard
2. Cole no popup da extensão
3. Clique em "Salvar"

### "Desconectado"

1. Verifique sua conexão com internet
2. Confirme que a API Key está válida
3. Tente sincronizar manualmente

### Badge não aparece no PJe

1. Recarregue a página do PJe (F5)
2. Aguarde alguns segundos
3. Verifique console do navegador (F12)

## 📜 Licença

MIT License - veja [LICENSE](../LICENSE) para detalhes

## 🆘 Suporte

- **Documentação**: https://docs.assistente-juridico.com
- **Issues**: https://github.com/thiagobodevan-a11y/assistente-juridico-p/issues
- **Email**: thiago@assistente-juridico.com

## 🤝 Contribuindo

Contribuições são bem-vindas! Veja [CONTRIBUTING.md](../CONTRIBUTING.md) para detalhes.

---

**Desenvolvido com ❤️ pela equipe Assistente Jurídico**
