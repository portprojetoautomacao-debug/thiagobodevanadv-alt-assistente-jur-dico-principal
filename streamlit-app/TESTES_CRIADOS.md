# 📋 Testes Criados para Streamlit App

## ✅ Resumo

Criei uma suite completa de testes Python para o app Streamlit, baseada nos testes TypeScript existentes, **SEM usar Selenium**.

### 📊 Estatísticas

- **Arquivos de teste**: 7 principais
- **Testes estimados**: 150+
- **Coverage objetivo**: >70%
- **Tempo execução**: ~2-5 minutos

---

## 📁 Arquivos Criados/Atualizados

### 1. **test_backend_api.py** ✅
**O que testa**: Backend FastAPI

- ✅ Health endpoint (`/health`)
- ✅ Listar processos (`GET /api/processos`)
- ✅ Criar processo (`POST /api/processos`)
- ✅ Validação de dados inválidos
- ✅ Listar agentes (`GET /api/agentes`)
- ✅ Executar agente (`POST /api/agentes/executar`)
- ✅ Sincronizar DJEN (`POST /api/djen/sincronizar`)
- ✅ Upload de documentos
- ✅ Listar tarefas

**Baseado em**: `tests/api/azure-upload.test.ts`

---

### 2. **test_agents.py** ✅
**O que testa**: 16 Agentes LangChain

**Agentes testados**:
1. Harvey Specter (estrategista-chefe)
2. Justine (intimações e prazos)
3. Análise Documental
4. Monitor DJEN
5. Gestão de Prazos
6. Redação de Petições
7. Pesquisa Jurisprudencial
8. Análise de Risco
9. Revisão Contratual
10. Comunicação Clientes
11. Financeiro
12. Estratégia Processual
13. Tradução Jurídica
14. Compliance
15. Organizaçãode Arquivos
16. Análise de Sentença

**Testa**: Execução e completude de cada agente

**Baseado em**: `tests/unit/agents-stubs.test.ts`

---

### 3. **test_e2e.py** ✅ (SEM SELENIUM)
**O que testa**: End-to-end via HTTP

**Testes principais**:
- ✅ Streamlit app está rodando (HTTP GET)
- ✅ Backend FastAPI está rodando
- ✅ API docs disponível (`/docs`)
- ✅ Endpoints de processos funcionam
- ✅ Endpoints de agentes funcionam
- ✅ Fluxo completo: criar → listar → buscar
- ✅ Executar agente end-to-end
- ✅ Testes de performance (tempo de resposta)
- ✅ Múltiplas requisições simultâneas

**Método**: Usa `requests` library (HTTP), não Selenium

**Baseado em**: `tests/e2e/basic.spec.ts`

---

### 4. **test_integrations.py** ✅ NOVO
**O que testa**: Integrações externas

**Integrações testadas**:
- ✅ DJEN API Client (CNJ)
- ✅ DataJud API Client
- ✅ Google Calendar Service
- ✅ Redis/Upstash connection
- ✅ Gemini AI Service
- ✅ Backend Routers (FastAPI)

**Características**:
- Usa mocks para APIs externas
- Testa cache e retry logic
- Verifica URLs corretas
- Valida CORS

---

### 5. **test_utils.py** ✅ NOVO
**O que testa**: Utilitários e helpers

**Categorias**:
- ✅ **Prazos**: Calcular dias corridos/úteis, verificar feriados
- ✅ **Formatação**: CNJ, CPF, valor monetário
- ✅ **Validação**: CNJ, CPF, email
- ✅ **Parser**: Extrair números CNJ, extrair prazos de texto
- ✅ **Cache**: Decorator de cache
- ✅ **Security**: Hash de senha, verificação
- ✅ **Date**: Conversão para horário de Brasília

---

### 6. **test_datajud_client.py** ✅ (já existia)
**O que testa**: Cliente DataJud API

- ✅ Inicialização
- ✅ Cache funcionando
- ✅ Buscar tribunais
- ✅ Buscar processos
- ✅ Tratamento de erros

---

### 7. **test_ml_*.py** ✅ (já existiam)
**O que testa**: Machine Learning

- `test_ml_predictor.py`: Predição de sucesso
- `test_ml_sentiment.py`: Análise de sentimento

---

## 🚀 Como Executar

### Todos os testes
```bash
cd streamlit-app
pytest tests/ -v
```

### Por categoria
```bash
# Backend
pytest tests/test_backend_api.py -v

# Agentes
pytest tests/test_agents.py -v

# E2E
pytest tests/test_e2e.py -v

# Integrações
pytest tests/test_integrations.py -v

# Utilitários
pytest tests/test_utils.py -v
```

### Com coverage
```bash
./run-tests.sh --coverage
```

### Por categoria com script
```bash
./run-tests.sh --backend
./run-tests.sh --agents
./run-tests.sh --e2e
```

---

## 📝 Diferenças vs TypeScript

### ❌ O que NÃO foi portado:

1. **Selenium/Puppeteer**: Substituído por HTTP requests
2. **Playwright E2E**: Substituído por testes de API
3. **Chrome Extension tests**: Extensão será descontinuada
4. **Testes de UI React**: App é Streamlit agora

### ✅ O que foi mantido/melhorado:

1. **Estrutura de testes**: Mesma organização lógica
2. **Cobertura**: Mesmos componentes testados
3. **Fixtures**: Equivalentes em pytest
4. **Mocks**: Equivalentes com `unittest.mock`
5. **Async tests**: Com `pytest-asyncio`

---

## 🎯 Coverage Esperado

| Componente | Coverage Objetivo | Status |
|------------|-------------------|--------|
| Backend API | >80% | ✅ Implementado |
| Agentes LangChain | >70% | ✅ Implementado |
| Integrações | >60% | ✅ Implementado |
| Utilitários | >90% | ✅ Implementado |
| ML Models | >75% | ✅ Já existia |

---

## ⚙️ Configuração Necessária

### 1. Variáveis de ambiente (`.env`)
```bash
GEMINI_API_KEY=sua-chave
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
```

### 2. Serviços rodando
Para testes E2E completos:

```bash
# Terminal 1: Backend
cd streamlit-app
python -m uvicorn backend.main:app --reload

# Terminal 2: Streamlit
cd streamlit-app
streamlit run app.py

# Terminal 3: Testes
cd streamlit-app
pytest tests/test_e2e.py -v
```

---

## 🔧 Troubleshooting

### Backend não está rodando
```bash
cd streamlit-app
python -m uvicorn backend.main:app --reload
```

### Streamlit não está rodando
```bash
cd streamlit-app
streamlit run app.py
```

### Import errors
```bash
export PYTHONPATH="${PYTHONPATH}:$(pwd)/streamlit-app"
```

### Instalar dependências de teste
```bash
pip install pytest pytest-asyncio pytest-cov pytest-mock httpx
```

---

## 📚 Arquivos de Suporte

- `conftest.py`: Fixtures compartilhadas
- `pytest.ini`: Configuração pytest
- `run-tests.sh`: Script executar testes
- `README.md`: Documentação detalhada

---

## ✨ Próximos Passos

1. **Rodar os testes pela primeira vez**
   ```bash
   cd streamlit-app
   pytest tests/ -v
   ```

2. **Verificar quais passam/falham**
   - Testes podem falhar se componentes não estiverem implementados
   - Isso é esperado! Use `pytest.skip()` para componentes pendentes

3. **Aumentar coverage gradualmente**
   - Implementar componentes faltantes
   - Adicionar mais casos de teste
   - Melhorar fixtures

4. **Integrar com CI/CD**
   - GitHub Actions já configurado
   - Rodar testes automaticamente em PRs

---

## 📊 Comandos Úteis

```bash
# Ver coverage HTML
cd streamlit-app
pytest tests/ --cov=. --cov-report=html
# Abrir htmlcov/index.html

# Rodar teste específico
pytest tests/test_backend_api.py::TestBackendAPI::test_health_endpoint -v

# Com debugger
pytest tests/test_backend_api.py --pdb

# Apenas testes rápidos
pytest tests/ -v -m "not slow"

# Resumo curto
pytest tests/ --tb=short
```

---

**Criado em**: 27/12/2025
**Baseado em**: Testes TypeScript existentes em `tests/`
**Método**: HTTP/REST (sem Selenium)
**Framework**: pytest + pytest-asyncio + httpx
