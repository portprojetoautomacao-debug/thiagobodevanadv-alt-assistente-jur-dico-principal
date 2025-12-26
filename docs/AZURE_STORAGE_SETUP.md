# 📦 Azure Blob Storage - Integração com Assistente Jurídico

Guia completo para configurar e usar Azure Blob Storage para armazenamento e análise automática de autos processuais.

---

## 🎯 Visão Geral

O sistema permite:
- ✅ **Upload direto** de autos processuais (PDFs, DOC, DOCX)
- ✅ **Armazenamento seguro** no Azure Blob Storage
- ✅ **Análise automática** por agentes de IA
- ✅ **Extração de informações** estruturadas
- ✅ **Integração** com acervo do sistema

---

## 🔧 Passo 1: Criar Storage Account no Azure

### 1.1. Criar Storage Account

1. Acesse: https://portal.azure.com
2. Pesquise "Storage accounts" e clique em **Create**
3. Preencha:
   - **Subscription**: Sua assinatura Azure
   - **Resource group**: Crie ou selecione existente (ex: `rg-assistente-juridico`)
   - **Storage account name**: Nome único (ex: `assistentejuridico`)
   - **Region**: Escolha próximo aos usuários (ex: `Brazil South`)
   - **Performance**: Standard
   - **Redundancy**: LRS (localmente redundante) - mais barato

4. Clique em **Review + create** → **Create**

### 1.2. Obter Credenciais

Após criar o Storage Account:

1. No painel esquerdo, clique em **Access keys**
2. Em **key1**, clique em **Show** ao lado de "Connection string"
3. Copie a **Connection String** completa

Exemplo:
```
DefaultEndpointsProtocol=https;AccountName=assistentejuridico;AccountKey=abc123...xyz789==;EndpointSuffix=core.windows.net
```

---

## ⚙️ Passo 2: Configurar Variáveis de Ambiente

### 2.1. Adicionar ao `.env`

```bash
# Azure Blob Storage
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=assistentejuridico;AccountKey=your-key;EndpointSuffix=core.windows.net
AZURE_STORAGE_CONTAINER_NAME=process-documents

# Para frontend (Vite)
VITE_AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=assistentejuridico;AccountKey=your-key;EndpointSuffix=core.windows.net
```

### 2.2. Adicionar ao Vercel Dashboard (Produção)

1. Acesse: https://vercel.com/your-team/assistente-juridico/settings/environment-variables
2. Adicione as variáveis:
   - `AZURE_STORAGE_CONNECTION_STRING`
   - `AZURE_STORAGE_CONTAINER_NAME`
3. Selecione todos os ambientes: Production, Preview, Development

---

## 📦 Passo 3: Instalar Dependências

```bash
npm install @azure/storage-blob formidable
npm install --save-dev @types/formidable
```

---

## 🚀 Passo 4: Usar no Frontend

### 4.1. Importar Componente

```tsx
import { AzureStorageUpload } from "@/components/AzureStorageUpload";

function ProcessDetailsPage() {
  return (
    <div>
      <h1>Detalhes do Processo</h1>
      <AzureStorageUpload />
    </div>
  );
}
```

### 4.2. Usar Serviço Diretamente

```typescript
import { azureStorage } from "@/lib/azure-storage-service";

async function uploadAutoProcessual() {
  // Inicializar
  await azureStorage.initialize();

  // Upload de arquivo
  const file = document.querySelector('input[type="file"]').files[0];
  const result = await azureStorage.uploadFile(
    file,
    "0001234-56.2024.8.02.0001", // número do processo
    { tipo: "auto_completo", paginas: "1-350" } // metadata opcional
  );

  if (result.success) {
    console.log("Upload OK:", result.url);
  }
}

async function listarDocumentos() {
  const docs = await azureStorage.listProcessFiles("0001234-56.2024.8.02.0001");
  console.log("Documentos:", docs);
}

async function downloadDocumento() {
  const blob = await azureStorage.downloadFile("processo/123_auto.pdf");
  if (blob) {
    // Criar link de download
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "auto_processual.pdf";
    a.click();
  }
}
```

---

## 🤖 Passo 5: Análise Automática por Agentes

### 5.1. Upload com Análise Automática

```typescript
// Frontend
const formData = new FormData();
formData.append("file", file);
formData.append("processNumber", "0001234-56.2024.8.02.0001");
formData.append("autoAnalyze", "true"); // ✅ Ativa análise automática

const response = await fetch("/api/azure-upload", {
  method: "POST",
  body: formData,
});

const result = await response.json();
console.log("Task ID:", result.taskId); // ID da tarefa de análise
```

### 5.2. O que os Agentes Fazem

Quando `autoAnalyze=true`, o sistema:

1. **📥 Faz upload** do arquivo para Azure Blob Storage
2. **🔄 Cria tarefa** no sistema de agentes (`type: ANALISAR_AUTO_PROCESSUAL`)
3. **🤖 Agente Análise Documental** processa o arquivo:
   - Extrai texto do PDF (OCR se necessário)
   - Identifica partes (autor, réu, advogados)
   - Detecta tipo de ação (inicial, contestação, recurso)
   - Extrai datas e prazos importantes
   - Identifica pedidos e valores
4. **💾 Salva metadados** no Upstash KV
5. **📊 Atualiza processo** no sistema

---

## 📊 Estrutura de Armazenamento

### Organização de Arquivos

```
process-documents/                      # Container raiz
├── 0001234-56.2024.8.02.0001/         # Processo 1
│   ├── 1704067200000_petição_inicial.pdf
│   ├── 1704153600000_auto_completo.pdf
│   └── 1704240000000_contestação.pdf
├── 0005678-90.2024.8.02.0001/         # Processo 2
│   └── 1704326400000_recurso.pdf
└── metadata/                           # Metadata adicional
    └── index.json
```

### Metadata de Blobs

Cada blob armazena metadata:

```json
{
  "processNumber": "0001234-56.2024.8.02.0001",
  "originalFileName": "petição_inicial.pdf",
  "uploadedBy": "assistente-juridico",
  "uploadedAt": "2024-12-25T10:30:00Z",
  "size": "2458976",
  "status": "analyzed",
  "analyzedAt": "2024-12-25T10:31:45Z",
  "extractedParties": "João Silva x Empresa XYZ",
  "documentType": "petição_inicial"
}
```

---

## 🔒 Segurança e Conformidade LGPD

### Configurações de Segurança

1. **Private Access**: Container configurado como privado (não acessível publicamente)
2. **SAS Tokens**: URLs temporárias com prazo de expiração
3. **Encryption at Rest**: Dados criptografados automaticamente pelo Azure
4. **Access Logs**: Logs de acesso habilitados para auditoria

### Retenção de Dados

Configure política de retenção no Azure Portal:

1. Acesse Storage Account → **Data management** → **Lifecycle management**
2. Crie regra:
   ```json
   {
     "rules": [{
       "name": "delete-old-documents",
       "enabled": true,
       "type": "Lifecycle",
       "definition": {
         "actions": {
           "baseBlob": {
             "delete": {
               "daysAfterModificationGreaterThan": 2555  // 7 anos (LGPD)
             }
           }
         },
         "filters": {
           "blobTypes": ["blockBlob"],
           "prefixMatch": ["process-documents/"]
         }
       }
     }]
   }
   ```

---

## 💰 Custos Estimados

### Azure Blob Storage Pricing (Brazil South)

| Tier | Custo GB/mês | 10 GB/mês | 100 GB/mês | 1 TB/mês |
|------|--------------|-----------|------------|----------|
| Hot  | $0.0184      | $0.18     | $1.84      | $18.40   |
| Cool | $0.01        | $0.10     | $1.00      | $10.00   |

**Operações:**
- Write (upload): $0.05 por 10.000 operações
- Read (download): $0.004 por 10.000 operações

### Estimativa para Escritório Médio

- 50 processos/mês
- 5 documentos/processo (média 2MB cada)
- Total: 500 MB/mês

**Custo mensal estimado: ~$0.10 USD** (R$ 0,50)

---

## 🧪 Testes

### Teste Manual

1. Acesse o app localmente: http://localhost:5173
2. Vá na página de upload (ou integre o componente)
3. Selecione um PDF de teste
4. Digite número do processo
5. Marque "Análise Automática"
6. Clique em "Fazer Upload"

### Teste via API

```bash
# Upload
curl -X POST http://localhost:5173/api/azure-upload \
  -F "file=@/path/to/documento.pdf" \
  -F "processNumber=0001234-56.2024.8.02.0001" \
  -F "autoAnalyze=true"

# Resposta esperada:
# {
#   "success": true,
#   "blobName": "0001234-56.2024.8.02.0001/1704067200000_documento.pdf",
#   "url": "https://assistentejuridico.blob.core.windows.net/...",
#   "taskId": "task-abc123"
# }
```

---

## 🛠️ Troubleshooting

### Erro: "Azure Storage não configurado"

**Causa**: `AZURE_STORAGE_CONNECTION_STRING` não definida

**Solução**: Adicione a variável no `.env` e reinicie o servidor

### Erro: "Container not found"

**Causa**: Container não foi criado

**Solução**: O sistema cria automaticamente. Verifique permissões da API key

### Erro: "File too large"

**Causa**: Arquivo maior que 50MB

**Solução**: Ajuste `maxFileSize` em `api/azure-upload.ts`:
```typescript
const form = formidable({
  maxFileSize: 100 * 1024 * 1024, // 100MB
});
```

### Erro: "Type not allowed"

**Causa**: Tipo de arquivo não suportado

**Solução**: Adicione o MIME type em `azure-upload.ts`:
```typescript
const allowedTypes = [
  "application/pdf",
  "application/msword",
  // ... adicione outros tipos
];
```

---

## 📚 Recursos Adicionais

- **Azure Docs**: https://docs.microsoft.com/azure/storage/blobs/
- **SDK Node.js**: https://github.com/Azure/azure-sdk-for-js/tree/main/sdk/storage/storage-blob
- **Pricing Calculator**: https://azure.microsoft.com/pricing/calculator/
- **LGPD Compliance**: https://docs.microsoft.com/compliance/regulatory/gdpr

---

## 🎓 Próximos Passos

1. ✅ **Implementar OCR** para PDFs escaneados (Azure Computer Vision)
2. ✅ **Busca full-text** nos documentos armazenados
3. ✅ **Versionamento** de documentos (sobrescrever vs novo arquivo)
4. ✅ **Assinatura digital** de documentos gerados
5. ✅ **Compartilhamento temporário** via SAS tokens com clientes

---

**Última atualização**: 25/12/2024
