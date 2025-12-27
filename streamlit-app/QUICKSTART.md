# 🚀 QUICK START - Assistente Jurídico Streamlit

## ⚡ Instalação Rápida (5 minutos)

```bash
# 1. Navegar para diretório
cd streamlit-app

# 2. Executar setup automático
./setup.sh

# 3. Editar .env com suas credenciais
nano .env
# ou
code .env

# 4. Executar aplicação
./run.sh
```

**Acesse:** http://localhost:8501

---

## 🔑 Variáveis Obrigatórias no .env

```bash
# Backend React (essencial)
REACT_API_URL=https://assistente-juridico-github.vercel.app/api

# Gemini (essencial para IA)
GEMINI_API_KEY=sua-chave-aqui

# Redis (essencial para cache)
UPSTASH_REDIS_REST_URL=https://seu-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=seu-token-aqui
```

**Como obter:**
- Gemini: https://makersuite.google.com/app/apikey
- Upstash: https://upstash.com/ (free tier 10k requests/day)

---

## 📊 Páginas Disponíveis

| Página | Status | Funcionalidades |
|--------|--------|-----------------|
| Dashboard | ✅ **COMPLETO** | KPIs, gráficos Plotly, métricas de agentes |
| Processos | 🚧 Em desenvolvimento | Lista, CRUD, análise Pandas |
| Expedientes | 🚧 Em desenvolvimento | Upload PDF, extração de texto |
| Agentes IA | ✅ **FUNCIONAL** | LangChain, 4 agentes implementados |
| Automações | 🟡 Parcial | Scraping DJEN funcionando |
| Análises ML | 🚧 Em desenvolvimento | scikit-learn, predições |
| Configurações | ✅ **COMPLETO** | Status de conexões |

---

## 🤖 Agentes LangChain Implementados

1. **Harvey Specter** 🎯 - Estrategista
   - Análise macro de casos
   - Avaliação de riscos
   - Recomendações estratégicas

2. **Mrs. Justin-e** 📋 - Intimações
   - Extração de prazos
   - Classificação de tipos
   - Geração de tarefas

3. **Redator Jurídico** ✍️ - Petições
   - Criação de documentos
   - Busca de modelos
   - Validação de formatação

4. **Pesquisador** 🔍 - Jurisprudência
   - Busca STF/STJ
   - Integração Qdrant
   - Análise de precedentes

---

## 🔧 Tecnologias Usadas

**Core:**
- Python 3.11+
- Streamlit 1.32
- Pandas 2.2
- LangChain 0.1

**IA & ML:**
- Google Gemini 2.0
- scikit-learn 1.4
- sentence-transformers 2.3

**Automação:**
- Selenium 4.17
- PyAutoGUI 0.9
- BeautifulSoup4 4.12

**Viz:**
- Plotly 5.18
- Altair 5.2

---

## 📁 Estrutura do Projeto

```
streamlit-app/
├── app.py                 # App principal ⭐
├── setup.sh              # Setup automático
├── run.sh                # Executor
├── requirements.txt      # Dependências
├── .env.example          # Template config
│
├── lib/                  # Core libraries
│   ├── config.py         # Configuração
│   ├── backend_client.py # Cliente HTTP
│   ├── langchain_agents.py # Agentes IA
│   └── selenium_scraper.py # Web scraping
│
└── pages/                # Páginas Streamlit
    ├── dashboard.py      # ✅ Completo
    ├── processos.py      # 🚧 Stub
    ├── expedientes.py    # 🚧 Stub
    ├── agentes.py        # ✅ Funcional
    ├── automacoes.py     # 🟡 Parcial
    ├── analises_ml.py    # 🚧 Stub
    └── configuracoes.py  # ✅ Completo
```

---

## 🧪 Testar Rapidamente

### 1. Dashboard (pronto)
```bash
./run.sh
# Acessar: http://localhost:8501
# Clicar em "Dashboard" no menu
```

### 2. Agentes LangChain (funcional)
```bash
# Na interface:
# 1. Clicar em "Agentes IA"
# 2. Selecionar "Harvey Specter"
# 3. Digitar: "Analisar viabilidade de recurso"
# 4. Clicar "Executar Agente"
```

### 3. Automação DJEN (funcional)
```bash
# Na interface:
# 1. Clicar em "Automações"
# 2. Tab "DJEN"
# 3. Digitar OAB
# 4. Clicar "Buscar Publicações"
```

---

## 🐛 Troubleshooting

**Erro: "No module named 'streamlit'"**
```bash
source venv/bin/activate
pip install -r requirements.txt
```

**Erro: "Backend offline"**
```bash
# Verifique REACT_API_URL no .env
curl https://assistente-juridico-github.vercel.app/api/health
```

**Erro: "Gemini API key invalid"**
```bash
# Gere nova chave em:
# https://makersuite.google.com/app/apikey
```

---

## 📚 Próximos Passos

1. ✅ **Testar Dashboard** - Já funcional
2. ✅ **Testar Agentes** - Já funcional
3. 🚧 **Implementar CRUD Processos** - Em desenvolvimento
4. 🚧 **Treinar Modelo ML** - Precisa dados históricos
5. 🚧 **Deploy Streamlit Cloud** - Após configuração completa

---

## 🚀 Deploy (Opcional)

### Streamlit Cloud (Grátis)

```bash
# 1. Push para GitHub
git add streamlit-app/
git commit -m "feat: adiciona versão Streamlit"
git push

# 2. Acessar: https://share.streamlit.io/
# 3. Conectar repositório
# 4. App path: streamlit-app/app.py
# 5. Adicionar secrets no dashboard
```

---

**Data:** 27/12/2025
**Versão:** 1.0.0
**Status:** ✅ MVP Funcional
