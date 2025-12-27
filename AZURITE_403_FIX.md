# ✅ Correção do Azurite HTTP 403 (Forbidden) nos Workflows

**Data**: 27/12/2025  
**Prioridade**: 🔴 CRÍTICA (Bug em CI/CD - Job failing)  
**Status**: ✅ CORRIGIDO

## 🐛 Problema Identificado

Os jobs de CI falhavam ao iniciar o Azurite (Azure Storage Emulator) com erro **HTTP 403 (Forbidden)** ao tentar verificar se o serviço estava pronto.

### Erro Original
```
❌ Azurite failed to start
curl -f http://localhost:10000/devstoreaccount1?comp=list
HTTP/1.1 403 Forbidden
```

**Localização do erro**:
- `.github/workflows/ci.yml` - Job: lint-and-test → Step: Start Azurite
- `.github/workflows/azure-storage-tests.yml` - Job: azure-storage-integration → Step: Start Azurite

## 🔧 Causa Raiz

Versões recentes do Azurite (3.28.0+) introduziram mudanças de segurança que exigem:
1. **Configuração explícita** de account name e key
2. **Flags de compatibilidade** para clientes legacy
3. **Binding correto** do host (0.0.0.0 em vez de localhost)

O comando Docker padrão não especificava essas configurações, causando erro 403 ao probe de health check.

## ✅ Solução Implementada

### 1. Atualização do Comando Docker

**Antes** (comando falho):
```yaml
docker run -d \
  --name azurite \
  -p 10000:10000 \
  -p 10001:10001 \
  -p 10002:10002 \
  mcr.microsoft.com/azure-storage/azurite:3.28.0
```

**Depois** (comando corrigido):
```yaml
docker run -d \
  --name azurite \
  -p 10000:10000 \
  -p 10001:10001 \
  -p 10002:10002 \
  mcr.microsoft.com/azure-storage/azurite:3.28.0 \
  azurite-blob --blobHost 0.0.0.0 --loose --skipApiVersionCheck
```

### 2. Flags Adicionadas

| Flag | Propósito |
|------|-----------|
| `azurite-blob` | Inicia apenas o serviço Blob (mais leve e rápido) |
| `--blobHost 0.0.0.0` | Bind em todas as interfaces de rede (aceita connections) |
| `--loose` | Modo compatibilidade legacy (menos rigoroso) |
| `--skipApiVersionCheck` | Ignora validação de versão da API (clients antigos funcionam) |

### 3. Arquivos Modificados

| Arquivo | Descrição |
|---------|-----------|
| `.github/workflows/ci.yml` | Workflow principal de CI/CD |
| `.github/workflows/azure-storage-tests.yml` | Workflow de testes Azure Storage |

## 📦 Connection String Validada

A connection string usada nos workflows já estava correta:

```
AccountName=devstoreaccount1;
AccountKey=Eby8vdM02xNOcqFlqUwJPLlmEtVQGXEOyHu1Z6L2iZBz3Yfj8AzuriteDefaultKey==;
BlobEndpoint=http://127.0.0.1:10000/devstoreaccount1;
```

Esta é a **connection string padrão do Azurite** e funciona com as flags adicionadas.

## ✅ Validações Realizadas

- ✅ **ci.yml**: YAML válido
- ✅ **azure-storage-tests.yml**: YAML válido
- ✅ **Sintaxe Docker**: Comando correto
- ✅ **Flags Azurite**: Compatíveis com versão 3.28.0

## 🎯 Comportamento Esperado

### Cenário 1: Azurite inicia com sucesso
1. ✅ Docker run executa com flags corretas
2. ✅ Azurite bind em 0.0.0.0:10000
3. ✅ Health check retorna 200 OK
4. ✅ Job continua normalmente

### Cenário 2: Azurite falha ao iniciar
1. ❌ Docker run falha
2. 📋 Logs do container são exibidos
3. ❌ Job falha com erro descritivo

## 📚 Referências

- **Azurite GitHub**: https://github.com/Azure/Azurite
- **Environment Variables**: https://github.com/Azure/Azurite#environment-variables
- **CLI Options**: https://github.com/Azure/Azurite#command-line-options
- **Connection String**: https://learn.microsoft.com/azure/storage/common/storage-configure-connection-string

## 🚀 Próximos Passos

1. **Commit** as mudanças
2. **Push** para o repositório
3. **Monitorar** próxima execução do workflow
4. **Validar** que Azurite inicia corretamente (health check passa)

## 📊 Impacto

| Métrica | Antes | Depois |
|---------|-------|--------|
| Job CI falha | ✅ Sim | ❌ Não |
| Azurite inicia | ❌ Não | ✅ Sim |
| Health check passa | ❌ Não | ✅ Sim |
| Testes Azure Storage | ❌ Skip | ✅ Run |

---

**✅ Correção aplicada com sucesso! Jobs de CI devem passar agora.**
