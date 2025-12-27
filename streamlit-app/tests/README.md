# 🧪 Suite de Testes - Assistente Jurídico PJe

Suite completa de testes com pytest para validação de todos os componentes do sistema.

## 📋 Estrutura de Testes

```
tests/
├── conftest.py                 # Fixtures compartilhadas
├── test_ml_predictor.py        # Testes Success Predictor (8 testes)
├── test_ml_sentiment.py        # Testes Sentiment Analyzer (12 testes)
├── test_datajud_client.py      # Testes DataJud API (11 testes)
└── test_cron_jobs.py           # Testes Cron Jobs Manager (14 testes)
```

**Total:** 45+ testes unitários e de integração

## 🚀 Executar Testes

### Executar todos os testes

```bash
cd streamlit-app

# Método 1: Script automatizado (recomendado)
./run-tests.sh

# Método 2: pytest direto
pytest tests/ -v --cov=lib --cov=backend
```

### Executar testes específicos

```bash
# Apenas testes ML
pytest tests/test_ml_*.py -v

# Apenas testes de integração
pytest tests/test_datajud_client.py tests/test_cron_jobs.py -v

# Teste específico
pytest tests/test_ml_predictor.py::TestSuccessPredictor::test_treinar_modelo -v
```

### Executar com markers

```bash
# Apenas testes unitários rápidos
pytest -m unit

# Apenas testes de ML
pytest -m ml

# Apenas testes de scrapers
pytest -m scraper
```

## 📊 Cobertura de Código

### Meta: **≥ 70%**

Gerar relatório de cobertura:

```bash
pytest tests/ --cov=lib --cov=backend --cov-report=html

# Abrir relatório HTML
open htmlcov/index.html  # macOS
xdg-open htmlcov/index.html  # Linux
start htmlcov/index.html  # Windows
```

### Cobertura por Módulo

| Módulo | Cobertura Esperada |
|--------|-------------------|
| `lib/ml/` | ≥ 80% |
| `lib/integrations/` | ≥ 70% |
| `lib/automation/` | ≥ 60% |
| `backend/cron_jobs.py` | ≥ 75% |

## 🧩 Componentes Testados

### ✅ Machine Learning (20 testes)

- **Success Predictor** (8 testes)
  - Inicialização, treinamento, predição
  - Salvar/carregar modelos
  - Dados sintéticos
  - Validação de entrada

- **Sentiment Analyzer** (12 testes)
  - Análise de sentenças judiciais
  - Classificação de urgência
  - Comparação de textos
  - Extração de palavras-chave

### ✅ Integrações (11 testes)

- **DataJud API Client**
  - Busca de processos
  - Busca de movimentações
  - Cache e retry
  - Rate limiting
  - Health check

### ✅ Automação (14 testes)

- **Cron Jobs Manager**
  - Inicialização de jobs
  - Execução de todos os 8 jobs
  - Start/stop do scheduler
  - Listagem de jobs
  - Não duplicação

## 🔧 Configuração

### pytest.ini

Configurações globais do pytest:

- Diretórios de teste: `tests/`
- Padrão de arquivos: `test_*.py`
- Markers personalizados: `unit`, `integration`, `slow`, `ml`, `scraper`, `automation`
- Cobertura mínima configurada

### conftest.py

Fixtures compartilhadas:

- `caso_teste_basico` - Caso padrão para testes
- `numero_cnj_teste` - Número CNJ para testes
- `texto_sentenca_procedente` - Sentença favorável
- `texto_sentenca_improcedente` - Sentença desfavorável

## 📦 Dependências de Teste

```bash
pip install pytest pytest-cov pytest-asyncio pytest-mock
```

Incluídas em `requirements.txt`:

```
pytest==7.4.3
pytest-cov==4.1.0
pytest-asyncio==0.21.1
pytest-mock==3.12.0
```

## 📈 Relatórios Gerados

Após executar `./run-tests.sh`:

```
test-reports/
├── htmlcov/              # Cobertura HTML
│   └── index.html
├── coverage.xml          # Cobertura XML (CI/CD)
├── junit.xml            # Formato JUnit (CI/CD)
├── test-output.log      # Log completo
└── summary.txt          # Resumo textual
```

## 🎯 Boas Práticas

### 1. Testes Independentes

Cada teste deve ser independente e não depender de ordem de execução.

```python
def test_algo():
    # Setup
    objeto = MinhaClasse()

    # Exercício
    resultado = objeto.metodo()

    # Verificação
    assert resultado == esperado

    # Teardown (automático com fixtures)
```

### 2. Mocks para I/O Externo

Use mocks para evitar chamadas HTTP reais:

```python
@patch('requests.Session.get')
def test_api_call(mock_get):
    mock_get.return_value = Mock(status_code=200)
    # Test code
```

### 3. Fixtures para Setup Comum

```python
@pytest.fixture
def modelo_treinado():
    predictor = SuccessPredictor()
    df = predictor.gerar_dados_sinteticos(100)
    predictor.treinar(df)
    return predictor

def test_prever(modelo_treinado):
    resultado = modelo_treinado.prever(caso)
    assert resultado is not None
```

### 4. Parametrização para Casos Múltiplos

```python
@pytest.mark.parametrize("entrada,esperado", [
    ("texto1", "resultado1"),
    ("texto2", "resultado2"),
])
def test_multiplos_casos(entrada, esperado):
    assert processar(entrada) == esperado
```

## 🐛 Debugging de Testes

### Ver output detalhado

```bash
pytest tests/test_file.py -v -s
```

### Parar no primeiro erro

```bash
pytest tests/ -x
```

### Modo debug (pdb)

```bash
pytest tests/ --pdb
```

### Ver warnings

```bash
pytest tests/ -v --tb=long
```

## ✅ Checklist de Qualidade

- [x] Testes unitários implementados (45+)
- [x] Cobertura > 70%
- [x] Testes passando
- [x] Mocks para APIs externas
- [x] Fixtures reutilizáveis
- [x] Documentação completa
- [x] CI/CD ready (XML/JUnit)

## 🚀 Próximos Passos

1. **Adicionar mais testes de integração**
   - DJEN Scraper end-to-end
   - PJe Automation completa
   - Form Filler com GUI

2. **Testes E2E com Selenium**
   - Navegação completa no PJe
   - Upload de arquivos
   - Download de documentos

3. **Performance tests**
   - Benchmark de modelos ML
   - Stress test dos scrapers

4. **Testes de segurança**
   - Validação de inputs
   - SQL injection
   - XSS prevention

---

**Última atualização:** 27/12/2025
**Versão:** 1.0.0
**Mantido por:** Equipe de Desenvolvimento
