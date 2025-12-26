# ✅ Azure Storage - Configuração Completa com seu Storage Explorer

## 🎯 Status Atual

Baseado no seu **Azure Storage Explorer**, você tem:

✅ **Azurite configurado** - mas não está rodando agora
✅ **Conta Azure real** - `rg-thiagobodevanadv-alt-1800` (Azure subscription)
✅ **Código pronto** - integração completa implementada

---

## 🚀 OPÇÃO 1: Iniciar Azurite (Desenvolvimento Local) - RECOMENDADO

### Por que usar Azurite?
- 🟢 **Grátis** - zero custos
- 🟢 **Rápido** - tudo localhost
- 🟢 **Perfeito para testes** - pode apagar e recriar

### Passo 1: Iniciar Azurite

**Via Docker (melhor opção):**
```bash
docker run -d \
  --name azurite \
  -p 10000:10000 \
  -p 10001:10001 \
  -p 10002:10002 \
  -v $(pwd)/azurite-data:/data \
  mcr.microsoft.com/azure-storage/azurite
```

**OU via NPM:**
```bash
npm install -g azurite
azurite --silent --location ./azurite-data
```

### Passo 2: Verificar no Azure Storage Explorer

Após iniciar, você verá no Explorer:
```
Emulator & Attached
  └─ Emulator - Default Ports (Key)
      └─ Blob Containers
          └─ (clique para criar process-documents)
```

### Passo 3: Instalar dependências

```bash
npm install @azure/storage-blob formidable
npm install --save-dev @types/formidable
```

### Passo 4: Testar

```bash
# Iniciar app
npm run dev

# Console mostrará:
# [Azure Storage] ✅ Conectado ao container: process-documents (Azurite - Emulador Local)
```

---

## 🌐 OPÇÃO 2: Usar Azure Cloud (Produção)

### Sua conta existente: `rg-thiagobodevanadv-alt-1800`

Vejo que você já tem configurado no Storage Explorer! Vamos pegar a connection string:

### Passo 1: Obter Connection String

**Método A - Via Azure Portal:**
1. Acesse: https://portal.azure.com
2. Procure: "rg-thiagobodevanadv-alt-1800"
3. Menu esquerdo: **Access keys**
4. Copie: **Connection string** (key1)

**Método B - Via Storage Explorer:**
1. No Explorer, clique com botão direito em `rg-thiagobodevanadv-alt-1800`
2. **Properties** → copie Connection String

### Passo 2: Atualizar .env

Substitua no `.env`:

```bash
# Azure Cloud (produção)
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=rg-thiagobodevanadv-alt-1800;AccountKey=SUA_CHAVE_AQUI;EndpointSuffix=core.windows.net
VITE_AZURE_STORAGE_CONNECTION_STRING=<mesma acima>
AZURE_STORAGE_CONTAINER_NAME=process-documents
VITE_USE_AZURITE=false
```

### Passo 3: Container será criado automaticamente

Quando fizer o primeiro upload, o container `process-documents` será criado automaticamente.

---

## 📊 Estrutura que você verá no Storage Explorer

### Com Azurite (Local):
```
(Local & Attached)
  └─ Emulator - Default Ports (Key)
      └─ Blob Containers
          └─ process-documents
              └─ 0001234-56.2024.8.02.0001/
                  └─ 1704067200000_documento.pdf
```

### Com Azure Cloud:
```
Azure subscription 1 (thiagobodevanadv...)
  └─ rg-thiagobodevanadv-alt-1800
      └─ Blob Containers
          └─ process-documents
              └─ 0001234-56.2024.8.02.0001/
                  └─ 1704067200000_documento.pdf
```

---

## 🧪 Testar Agora

### 1. Escolha uma opção (Azurite ou Azure Cloud)

### 2. Instale dependências:
```bash
npm install @azure/storage-blob formidable @types/formidable
```

### 3. Verifique configuração:
```bash
./scripts/test-azure-storage.sh
```

### 4. Inicie o app:
```bash
npm run dev
```

### 5. Acesse e teste upload:
- URL: http://localhost:5173
- Adicione componente `<AzureStorageUpload />` em qualquer página
- Ou use diretamente a API: `POST /api/azure-upload`

---

## 💡 Recomendação Final

**Para desenvolvimento (agora):**
```bash
# 1. Iniciar Azurite
docker run -d --name azurite -p 10000:10000 -p 10001:10001 -p 10002:10002 mcr.microsoft.com/azure-storage/azurite

# 2. Manter configuração atual do .env (já tem Azurite)

# 3. Instalar deps
npm install @azure/storage-blob formidable @types/formidable

# 4. Testar
npm run dev
```

**Para produção (Vercel):**
```bash
# Adicionar no Vercel Dashboard apenas:
AZURE_STORAGE_CONNECTION_STRING=<connection-string-azure-real>
AZURE_STORAGE_CONTAINER_NAME=process-documents
```

---

## 📸 Como verificar se funcionou

### No Console do navegador:
```
[Azure Storage] ✅ Conectado ao container: process-documents (Azurite - Emulador Local)
[Azure Upload] ✅ Upload concluído: 0001234-56.2024.8.02.0001/1704067200000_doc.pdf
```

### No Azure Storage Explorer:
Você verá os arquivos aparecerem em tempo real! 🎉

---

## 🆘 Precisa de ajuda?

- 📖 **Setup completo**: `docs/AZURE_STORAGE_SETUP.md`
- 🔧 **Azurite quickstart**: `docs/AZURITE_QUICKSTART.md`
- 📊 **Resumo executivo**: `AZURE_STORAGE_RESUMO.md`

---

✅ **Tudo configurado!** Basta escolher Azurite (grátis, local) ou Azure Cloud (produção).
