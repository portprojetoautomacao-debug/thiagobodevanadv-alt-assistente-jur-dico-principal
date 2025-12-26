# 🔧 Azure Storage - Guia Rápido Azurite

## ✅ Você tem o Azurite configurado!

Baseado no seu Azure Storage Explorer, você já tem:
- ✅ **Azurite** rodando em `localhost:10000`
- ✅ **Conta real Azure** configurada: `rg-thiagobodevanadv-alt-1800`

---

## 🚀 Opção 1: Usar Azurite (Emulador Local) - RECOMENDADO PARA DEV

### Já configurado no seu .env:

```bash
# Azurite (emulador local - GRÁTIS)
AZURE_STORAGE_CONNECTION_STRING=AccountName=devstoreaccount1;AccountKey=Eby8vdM02xNOcqFlqUwJPLlmEhRtFSBP;BlobEndpoint=http://127.0.0.1:10000/devstoreaccount1;
VITE_AZURE_STORAGE_CONNECTION_STRING=AccountName=devstoreaccount1;AccountKey=Eby8vdM02xNOcqFlqUwJPLlmEhRtFSBP;BlobEndpoint=http://127.0.0.1:10000/devstoreaccount1;
AZURE_STORAGE_CONTAINER_NAME=process-documents
VITE_USE_AZURITE=true
```

### Vantagens do Azurite:
- ✅ **100% GRÁTIS** - sem custos
- ✅ **Rápido** - tudo local
- ✅ **Offline** - não precisa de internet
- ✅ **Ideal para testes** - pode deletar e recriar à vontade

### Como iniciar Azurite (se não estiver rodando):

```bash
# Via Docker (recomendado)
docker run -p 10000:10000 -p 10001:10001 -p 10002:10002 mcr.microsoft.com/azure-storage/azurite

# OU via NPM global
npm install -g azurite
azurite --silent --location ./azurite-data --debug ./azurite-debug.log
```

### Testar conexão:

```bash
# Instalar dependências
npm install @azure/storage-blob formidable @types/formidable

# Iniciar app
npm run dev

# O sistema detectará automaticamente Azurite e mostrará:
# [Azure Storage] ✅ Conectado ao container: process-documents (Azurite - Emulador Local)
```

---

## 🌐 Opção 2: Usar Azure Cloud (Produção)

### Para usar a conta real `rg-thiagobodevanadv-alt-1800`:

1. **Obter Connection String no Azure Portal:**
   - Acesse: https://portal.azure.com
   - Vá em Storage Accounts → `rg-thiagobodevanadv-alt-1800`
   - Menu esquerdo: **Access keys**
   - Copie **Connection string** da key1

2. **Atualizar .env para produção:**

```bash
# Azure Cloud (produção)
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=rg-thiagobodevanadv-alt-1800;AccountKey=SUA_CHAVE_REAL;EndpointSuffix=core.windows.net
VITE_AZURE_STORAGE_CONNECTION_STRING=<mesma acima>
AZURE_STORAGE_CONTAINER_NAME=process-documents
VITE_USE_AZURITE=false
```

3. **No Vercel (produção), adicione as variáveis:**
   - Vercel Dashboard → Settings → Environment Variables
   - Adicione apenas `AZURE_STORAGE_CONNECTION_STRING` e `AZURE_STORAGE_CONTAINER_NAME`
   - **NÃO** adicione `VITE_USE_AZURITE` em produção

---

## 📊 Comparação: Azurite vs Azure Cloud

| Recurso | Azurite (Local) | Azure Cloud |
|---------|----------------|-------------|
| **Custo** | 🟢 Grátis | 🟡 ~R$ 0,75/mês |
| **Velocidade** | 🟢 Instantâneo | 🟡 Depende da internet |
| **Disponibilidade** | 🟡 Apenas local | 🟢 Global 24/7 |
| **Ideal para** | 🔧 Desenvolvimento | 🚀 Produção |
| **Setup** | 🟢 Automático | 🟡 Requer config |

---

## 🧪 Testando Agora

```bash
# 1. Garantir que Azurite está rodando
# (Verifique no Azure Storage Explorer - já está!)

# 2. Instalar dependências
npm install @azure/storage-blob formidable @types/formidable

# 3. Iniciar dev server
npm run dev

# 4. Acessar localhost:5173 e testar upload

# 5. Verificar no Azure Storage Explorer:
# Explorer → Local & Attached → (Emulator) → Containers → process-documents
```

---

## 🔍 Verificar se funcionou

Após fazer upload, você verá no console:

```
[Azure Storage] ✅ Conectado ao container: process-documents (Azurite - Emulador Local)
[Azure Storage] ✅ Upload concluído: 0001234-56.2024.8.02.0001/1704067200000_documento.pdf
```

E no Azure Storage Explorer:
```
(Emulator - Default Ports)
  └─ Blob Containers
      └─ process-documents
          └─ 0001234-56.2024.8.02.0001/
              └─ 1704067200000_documento.pdf
```

---

## 🚨 Troubleshooting

### Erro: "Connection refused 127.0.0.1:10000"

**Solução**: Azurite não está rodando. Inicie com:
```bash
docker run -p 10000:10000 -p 10001:10001 -p 10002:10002 mcr.microsoft.com/azure-storage/azurite
```

### Azurite não aparece no Storage Explorer

**Solução**: Clique em **Attach** → **Local Emulator** → Use defaults → Connect

### Erro: "Container already exists"

**Solução**: Normal! O sistema usa `createIfNotExists()`, pode ignorar.

---

## 💡 Dica: Migrar de Azurite para Azure Cloud

```bash
# 1. Fazer backup dos dados locais (opcional)
# No Azure Storage Explorer, clique com botão direito em "process-documents"
# → Export → Salvar em pasta

# 2. Atualizar .env com connection string real

# 3. Reiniciar app - dados serão criados no Azure Cloud

# 4. Fazer upload novamente dos arquivos importantes
```

---

**Recomendação**: Use **Azurite para desenvolvimento** e **Azure Cloud para produção**. É o setup ideal!

✅ **Status**: Seu ambiente está 100% configurado e pronto!
