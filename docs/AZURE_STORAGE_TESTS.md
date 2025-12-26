# 🧪 Azure Storage - Testes Completos

Documentação completa dos testes para integração Azure Blob Storage.

---

## 📋 Índice

- [Testes Locais](#-testes-locais)
- [Testes no CI/CD](#-testes-no-cicd)
- [Estrutura de Testes](#-estrutura-de-testes)
- [Azurite (Emulador)](#-azurite-emulador)
- [Comandos Disponíveis](#-comandos-disponíveis)

---

## 🏠 Testes Locais

### Pré-requisitos

1. **Azurite rodando** (emulador Azure Storage):
   ```bash
   docker run -d --name azurite \
     -p 10000:10000 -p 10001:10001 -p 10002:10002 \
     mcr.microsoft.com/azure-storage/azurite:latest
   ```

2. **Dependências instaladas**:
   ```bash
   npm install @azure/storage-blob formidable @types/formidable
   ```

### Comandos Rápidos

```bash
# Teste completo (automático)
npm run test:azure:full

# Testes unitários apenas
npm run test:azure

# Testes API/integração apenas
npm run test:azure:api

# Ambos
npm run test:azure:all

# Teste rápido de conectividade
./scripts/test-azure-storage.sh
```

### Teste Completo Passo-a-Passo

O script `test-azure-storage-full.sh` faz tudo automaticamente:

```bash
npm run test:azure:full
```

**O que ele faz:**
1. ✅ Verifica se Azurite está rodando
2. ✅ Inicia Azurite via Docker se necessário
3. ✅ Verifica dependências Node.js
4. ✅ Configura variáveis de ambiente
5. ✅ Roda testes unitários
6. ✅ Inicia servidor dev
7. ✅ Roda testes de integração (API)
8. ✅ Limpa ambiente

**Logs gerados:**
- `test-unit.log` - Testes unitários
- `test-integration.log` - Testes de integração
- `dev-server.log` - Logs do servidor dev

---

## 🤖 Testes no CI/CD

### GitHub Actions Workflows

#### 1. **azure-storage-tests.yml** (Workflow Dedicado)

Workflow específico para Azure Storage com 3 jobs:

**Jobs:**
- `azure-storage-unit-tests` - Testes unitários
- `azure-storage-integration-tests` - Testes com Azurite
- `azure-storage-health-check` - Verificação final

**Trigger:**
- Push em `main` ou `develop`
- Pull Requests
- Modificações em arquivos relacionados
- Manual (`workflow_dispatch`)

**Como rodar manualmente:**
1. Acesse: Actions → Azure Storage Tests
2. Clique: Run workflow
3. Selecione branch
4. Clique: Run workflow

#### 2. **ci.yml** (CI Principal)

Azurite integrado como service container:

```yaml
services:
  azurite:
    image: mcr.microsoft.com/azure-storage/azurite:latest
    ports:
      - 10000:10000
      - 10001:10001
      - 10002:10002
```

Testes Azure Storage executam junto com todos os outros.

#### 3. **tests.yml** (Testes Unitários)

Azurite disponível para testes que precisarem:

```yaml
services:
  azurite:
    image: mcr.microsoft.com/azure-storage/azurite:latest
    ports:
      - 10000:10000
```

### Variáveis de Ambiente nos Workflows

Configuradas automaticamente:

```yaml
env:
  AZURE_STORAGE_CONNECTION_STRING: AccountName=devstoreaccount1;AccountKey=Eby8vdM02xNOcqFlqUwJPLlmEhRtFSBP;BlobEndpoint=http://localhost:10000/devstoreaccount1;
  VITE_AZURE_STORAGE_CONNECTION_STRING: AccountName=devstoreaccount1;AccountKey=Eby8vdM02xNOcqFlqUwJPLlmEhRtFSBP;BlobEndpoint=http://localhost:10000/devstoreaccount1;
  AZURE_STORAGE_CONTAINER_NAME: process-documents
  VITE_USE_AZURITE: true
```

---

## 📁 Estrutura de Testes

### Arquivos de Teste

```
tests/
├── azure-storage-service.test.ts    # Testes unitários do serviço
└── api/
    └── azure-upload.test.ts          # Testes E2E da API

scripts/
├── test-azure-storage.sh            # Teste rápido de conectividade
└── test-azure-storage-full.sh       # Suite completa de testes

.github/workflows/
├── azure-storage-tests.yml          # Workflow dedicado
├── ci.yml                           # CI com Azurite
└── tests.yml                        # Unit tests com Azurite
```

### Cobertura de Testes

#### `azure-storage-service.test.ts` (Unitários)

**Testa:**
- ✅ Configuração (Azurite vs Azure Cloud)
- ✅ Detecção de ambiente
- ✅ Upload de arquivos
- ✅ Geração de nomes únicos
- ✅ Metadata
- ✅ Listagem de arquivos
- ✅ Download
- ✅ Update de metadata
- ✅ Health check
- ✅ Tratamento de erros

**Mocks:** Usa mocks do `@azure/storage-blob` para testes rápidos

#### `azure-upload.test.ts` (Integração/E2E)

**Testa:**
- ✅ Upload via API com sucesso
- ✅ Validação de campos obrigatórios
- ✅ Validação de tipos de arquivo
- ✅ Validação de tamanho (50MB limit)
- ✅ Análise automática (taskId)
- ✅ CORS headers

**Requer:** Azurite rodando + servidor dev

---

## 🐳 Azurite (Emulador)

### O que é Azurite?

Emulador oficial da Microsoft para Azure Blob Storage, Queue e Table Storage.

**Vantagens:**
- 🟢 **Grátis** - zero custos
- 🟢 **Rápido** - tudo local
- 🟢 **Offline** - não precisa internet
- 🟢 **Idêntico ao Azure** - mesma API

### Iniciar Azurite

**Via Docker (recomendado):**
```bash
docker run -d --name azurite \
  -p 10000:10000 -p 10001:10001 -p 10002:10002 \
  -v $(pwd)/azurite-data:/data \
  mcr.microsoft.com/azure-storage/azurite:latest
```

**Via NPM:**
```bash
npm install -g azurite
azurite --silent --location ./azurite-data
```

**Via VS Code Extension:**
1. Instalar: Azure Storage Extension
2. Command Palette: `Azurite: Start`

### Verificar Status

```bash
# Testar conexão
curl http://localhost:10000/devstoreaccount1?comp=list

# Listar containers
curl http://localhost:10000/devstoreaccount1?comp=list

# Ver no Azure Storage Explorer
# Connect → Local Emulator → Use defaults
```

### Dados de Conexão

**Connection String:**
```
AccountName=devstoreaccount1;AccountKey=Eby8vdM02xNOcqFlqUwJPLlmEhRtFSBP;BlobEndpoint=http://127.0.0.1:10000/devstoreaccount1;
```

**Account Name:** `devstoreaccount1`
**Account Key:** `Eby8vdM02xNOcqFlqUwJPLlmEhRtFSBP`
**Blob Endpoint:** `http://127.0.0.1:10000/devstoreaccount1`

> ⚠️ **Atenção:** Estas credenciais são públicas e só funcionam localmente!

### Limpar Dados

```bash
# Parar e remover container Docker
docker stop azurite && docker rm azurite

# Limpar dados persistidos
rm -rf azurite-data/

# Reiniciar limpo
docker run -d --name azurite \
  -p 10000:10000 -p 10001:10001 -p 10002:10002 \
  mcr.microsoft.com/azure-storage/azurite:latest
```

---

## 🎯 Comandos Disponíveis

### NPM Scripts

| Comando | Descrição |
|---------|-----------|
| `npm run test:azure` | Testes unitários do serviço |
| `npm run test:azure:api` | Testes de integração da API |
| `npm run test:azure:all` | Ambos acima |
| `npm run test:azure:full` | Suite completa automática |

### Scripts Shell

| Script | Descrição |
|--------|-----------|
| `./scripts/test-azure-storage.sh` | Teste rápido de conectividade |
| `./scripts/test-azure-storage-full.sh` | Suite completa de testes |

### Workflows GitHub Actions

| Workflow | Trigger | Descrição |
|----------|---------|-----------|
| `azure-storage-tests.yml` | Push, PR, manual | Testes dedicados Azure Storage |
| `ci.yml` | Push, PR | CI completo com Azurite |
| `tests.yml` | Push, PR | Unit tests com Azurite |

---

## 🐛 Troubleshooting

### Azurite não inicia

**Erro:** `port 10000 already in use`

**Solução:**
```bash
# Encontrar processo usando porta
lsof -i :10000

# Matar processo
kill -9 <PID>

# Ou usar porta diferente
docker run -d --name azurite -p 10100:10000 ...
```

### Testes falham com "Connection refused"

**Causa:** Azurite não está rodando

**Solução:**
```bash
# Verificar se está rodando
docker ps | grep azurite

# Iniciar se não estiver
docker start azurite

# Ou criar novo
npm run test:azure:full  # Inicia automaticamente
```

### Testes E2E timeout

**Causa:** Servidor dev não iniciou

**Solução:**
```bash
# Liberar porta 5173
lsof -ti:5173 | xargs kill -9

# Tentar novamente
npm run test:azure:api
```

### "Worker exited unexpectedly" nos testes

**Causa:** Pouca memória

**Solução:**
```bash
# Aumentar memória Node.js
export NODE_OPTIONS="--max-old-space-size=16384"
npm run test:azure:all
```

---

## 📊 Resultados Esperados

### Testes Locais

```
🧪 Azure Storage - Teste Local Completo
========================================

[INFO] 1️⃣ Verificando Azurite...
[INFO] ✅ Azurite está rodando na porta 10000

[INFO] 2️⃣ Verificando dependências Node.js...
[INFO] ✅ Dependências instaladas

[INFO] 3️⃣ Configurando variáveis de ambiente...
[INFO] ✅ Variáveis configuradas

[INFO] 4️⃣ Executando testes unitários...
 ✓ tests/azure-storage-service.test.ts (12 tests) 2.4s
[INFO] ✅ Testes unitários passaram!

[INFO] 5️⃣ Iniciando servidor dev...
[INFO] ✅ Servidor dev rodando (PID: 12345)

[INFO] 6️⃣ Executando testes de integração (API)...
 ✓ tests/api/azure-upload.test.ts (8 tests) 3.2s
[INFO] ✅ Testes de integração passaram!

[INFO] ==========================================
[INFO] ✅ TODOS OS TESTES PASSARAM!
[INFO] ==========================================
```

### GitHub Actions

```yaml
✅ azure-storage-unit-tests (2m 15s)
✅ azure-storage-integration-tests (3m 45s)
✅ azure-storage-health-check (10s)
```

---

## 📚 Recursos Adicionais

- **Azurite Docs**: https://github.com/Azure/Azurite
- **Azure Storage SDK**: https://github.com/Azure/azure-sdk-for-js/tree/main/sdk/storage/storage-blob
- **GitHub Actions**: https://docs.github.com/actions
- **Vitest Docs**: https://vitest.dev/

---

**Última atualização:** 25/12/2024
**Autor:** Assistente Jurídico DevOps Team
