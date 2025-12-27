# 🎯 CHAT 2 - FRONTEND STREAMLIT (SEMANA 2)

**Responsabilidade:** Dashboard + 6 Páginas Streamlit + Integração Backend
**Prazo:** Dias 8-14
**Prioridade:** 🟠 ALTA

---

## 📋 ESCOPO DESTE CHAT

Você é responsável por implementar:

### 1️⃣ Dashboard Principal (Dias 8-9)
- `streamlit-app/app.py` - Dashboard principal
  - KPIs em cards (processos, intimações, prazos, agentes)
  - Gráficos Plotly (processos por status, intimações/semana)
  - Tabela de processos recentes (Pandas)
  - Botões de ação (DJEN, importar, executar agentes)

### 2️⃣ Páginas Secundárias (Dias 10-11)
- `streamlit-app/pages/1_📋_Processos.py` - Gestão de processos
- `streamlit-app/pages/2_📨_Expedientes.py` - Upload e análise
- `streamlit-app/pages/3_🤖_Agentes_IA.py` - Interface agentes
- `streamlit-app/pages/4_🔍_Automações.py` - Controle scrapers
- `streamlit-app/pages/5_📊_Análises_ML.py` - Modelos ML
- `streamlit-app/pages/6_⚙️_Configurações.py` - Config sistema

### 3️⃣ Integração Backend (Dias 12-13)
- Consumir API FastAPI (http://localhost:8000)
- Estado global com `st.session_state`
- Cache de dados com `@st.cache_data`
- Loading states e spinners

### 4️⃣ Componentes Reutilizáveis (Dia 14)
- Cards de métricas customizados
- Tabelas com filtros e ordenação
- Formulários validados
- Modais/dialogs

---

## 🚀 COMANDOS PARA ESTE CHAT

```bash
# Ambiente
cd streamlit-app
source venv/bin/activate

# Instalar dependências frontend
pip install streamlit pandas numpy
pip install plotly altair
pip install requests httpx
pip install pillow

# Executar Streamlit
streamlit run app.py
# Ou: python -m streamlit run app.py

# Acessar
# http://localhost:8501

# Limpar cache
streamlit cache clear
```

---

## 📝 TEMPLATES DE CÓDIGO

### Dashboard Principal (app.py)
```python
import streamlit as st
import pandas as pd
import plotly.express as px
import requests
from datetime import datetime

# Configuração da página
st.set_page_config(
    page_title="Assistente Jurídico PJe",
    page_icon="⚖️",
    layout="wide",
    initial_sidebar_state="expanded"
)

# CSS customizado
st.markdown("""
<style>
    .main-header {
        font-size: 2.5rem;
        font-weight: bold;
        color: #1e40af;
    }
    .metric-card {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        padding: 1.5rem;
        border-radius: 10px;
        color: white;
    }
</style>
""", unsafe_allow_html=True)

# Header
st.markdown('<h1 class="main-header">⚖️ Assistente Jurídico PJe</h1>', unsafe_allow_html=True)
st.markdown("**Sistema 100% Python** | Streamlit + LangChain + Selenium")

# Sidebar
with st.sidebar:
    st.markdown("### 🔧 Configurações")
    ambiente = st.selectbox("Ambiente", ["Produção", "Desenvolvimento"])
    st.markdown("---")
    st.markdown("### 📊 Status do Sistema")

    # Verificar backend
    try:
        response = requests.get("http://localhost:8000/api/health", timeout=2)
        if response.status_code == 200:
            st.success("✅ Backend Online")
        else:
            st.error("❌ Backend com problemas")
    except:
        st.error("❌ Backend Offline")

    st.success("✅ Redis Conectado")
    st.success("✅ 16 Agentes Ativos")

# KPIs
col1, col2, col3, col4 = st.columns(4)

with col1:
    st.markdown('<div class="metric-card">', unsafe_allow_html=True)
    st.metric("Processos Ativos", "245", "+12")
    st.markdown('</div>', unsafe_allow_html=True)

with col2:
    st.markdown('<div class="metric-card">', unsafe_allow_html=True)
    st.metric("Intimações Pendentes", "18", "-5")
    st.markdown('</div>', unsafe_allow_html=True)

with col3:
    st.markdown('<div class="metric-card">', unsafe_allow_html=True)
    st.metric("Prazos Vencendo", "7", "+2")
    st.markdown('</div>', unsafe_allow_html=True)

with col4:
    st.markdown('<div class="metric-card">', unsafe_allow_html=True)
    st.metric("Agentes Executados", "1.234", "+89")
    st.markdown('</div>', unsafe_allow_html=True)

# Gráficos
st.markdown("---")
col_left, col_right = st.columns(2)

with col_left:
    st.markdown("### 📈 Processos por Status")
    df_status = pd.DataFrame({
        'Status': ['Ativo', 'Suspenso', 'Arquivado', 'Em Análise'],
        'Quantidade': [120, 45, 60, 20]
    })
    fig = px.pie(df_status, values='Quantidade', names='Status',
                 color_discrete_sequence=px.colors.sequential.Blues_r)
    st.plotly_chart(fig, use_container_width=True)

with col_right:
    st.markdown("### 📊 Intimações por Semana")
    df_intimacoes = pd.DataFrame({
        'Semana': pd.date_range(start='2025-01-01', periods=12, freq='W'),
        'Quantidade': [23, 34, 28, 41, 35, 29, 38, 42, 31, 36, 40, 45]
    })
    fig = px.line(df_intimacoes, x='Semana', y='Quantidade',
                  markers=True, line_shape='spline')
    st.plotly_chart(fig, use_container_width=True)

# Tabela de processos
st.markdown("---")
st.markdown("### 📋 Processos Recentes")

# Buscar do backend
try:
    response = requests.get("http://localhost:8000/api/processes")
    if response.status_code == 200:
        df_processos = pd.DataFrame(response.json()['processes'])
    else:
        # Dados de exemplo
        df_processos = pd.DataFrame({
            'Processo': ['0001234-56.2025.8.02.0001', '0001235-56.2025.8.02.0001'],
            'Cliente': ['João Silva', 'Maria Santos'],
            'Status': ['Ativo', 'Em Análise'],
            'Última Atualização': ['27/12/2025', '26/12/2025'],
            'Prazo': ['15/01/2026', '20/01/2026']
        })
except:
    # Fallback se backend offline
    df_processos = pd.DataFrame({
        'Processo': ['0001234-56.2025.8.02.0001'],
        'Cliente': ['João Silva'],
        'Status': ['Ativo'],
        'Última Atualização': ['27/12/2025'],
        'Prazo': ['15/01/2026']
    })

st.dataframe(
    df_processos,
    use_container_width=True,
    hide_index=True,
    column_config={
        "Status": st.column_config.SelectboxColumn(
            "Status",
            options=["Ativo", "Suspenso", "Arquivado", "Em Análise"]
        )
    }
)

# Botões de ação
st.markdown("---")
col1, col2, col3 = st.columns(3)

with col1:
    if st.button("🔄 Sincronizar DJEN", use_container_width=True):
        with st.spinner("Buscando publicações..."):
            # Chamar backend
            try:
                response = requests.post("http://localhost:8000/api/djen/sync")
                if response.status_code == 200:
                    st.success("✅ DJEN sincronizado!")
                else:
                    st.error("❌ Erro ao sincronizar")
            except:
                st.error("❌ Backend offline")

with col2:
    if st.button("📥 Importar Expedientes", use_container_width=True):
        st.info("📁 Use a página 'Expedientes' para upload")

with col3:
    if st.button("🤖 Executar Agentes", use_container_width=True):
        with st.spinner("Processando..."):
            st.success("✅ 16 agentes executados!")
```

### Página de Agentes (3_🤖_Agentes_IA.py)
```python
import streamlit as st
import requests

st.title("🤖 Agentes de IA")

# Buscar agentes do backend
try:
    response = requests.get("http://localhost:8000/api/agents")
    if response.status_code == 200:
        agentes = response.json()['agents']
        agentes_nomes = [a['name'] for a in agentes]
    else:
        agentes_nomes = ["Harvey Specter", "Mrs. Justin-e"]
except:
    agentes_nomes = ["Harvey Specter", "Mrs. Justin-e"]

# Seleção de agente
agente_selecionado = st.selectbox("Escolha um agente", agentes_nomes)

# Input de tarefa
tarefa = st.text_area("Descreva a tarefa:", height=100)

if st.button("🚀 Executar Agente"):
    if not tarefa:
        st.warning("⚠️ Digite uma tarefa")
    else:
        with st.spinner(f"🤖 {agente_selecionado} está trabalhando..."):
            try:
                # Mapear nome para ID
                agente_id = agente_selecionado.lower().replace(" ", "-")

                response = requests.post(
                    "http://localhost:8000/api/agents/process-task",
                    json={"agentId": agente_id, "task": tarefa},
                    timeout=30
                )

                if response.status_code == 200:
                    resultado = response.json()
                    st.success("✅ Tarefa concluída!")

                    # Resultado
                    st.markdown("### 📄 Resultado:")
                    st.markdown(resultado["response"])

                    # Métricas
                    col1, col2, col3 = st.columns(3)
                    col1.metric("Tempo", f"{resultado['processingTime']}ms")
                    col2.metric("Status", resultado['status'])
                    col3.metric("Agente", agente_id)
                else:
                    st.error(f"❌ Erro: {response.status_code}")
            except Exception as e:
                st.error(f"❌ Erro ao executar: {str(e)}")
```

---

## ✅ CHECKLIST DE ENTREGA (SEMANA 2)

### Dia 8-9: Dashboard
- [ ] `app.py` criado e funcionando
- [ ] 4 KPIs exibidos (cards customizados)
- [ ] 2 gráficos Plotly (pie + line)
- [ ] Tabela processos com Pandas
- [ ] Sidebar com status do sistema
- [ ] Botões de ação funcionando
- [ ] CSS customizado aplicado

### Dia 10-11: Páginas
- [ ] 6 páginas criadas em `pages/`
- [ ] Navegação funcionando (sidebar)
- [ ] Formulários validados
- [ ] Integração com backend em cada página
- [ ] Loading states implementados
- [ ] Error handling em requests

### Dia 12-13: Integração
- [ ] Todos os endpoints do backend consumidos
- [ ] `st.session_state` gerenciando estado
- [ ] `@st.cache_data` para otimização
- [ ] Fallbacks se backend offline
- [ ] CORS funcionando (8000 ↔ 8501)

### Dia 14: Componentes
- [ ] Cards reutilizáveis
- [ ] Tabelas com filtros
- [ ] Formulários modulares
- [ ] Spinners e progress bars
- [ ] Notificações (success/error/warning)

### Final Semana 2
- [ ] Streamlit rodando em localhost:8501
- [ ] 1 dashboard + 6 páginas funcionais
- [ ] Integração completa com backend
- [ ] UI responsiva e bonita
- [ ] Performance otimizada (cache)
- [ ] Pronto para adicionar automações (Chat 3)

---

## 🔗 COORDENAÇÃO COM OUTROS CHATS

### Com Chat 1 (Backend):
- Validar formato de resposta dos endpoints
- Reportar erros de API
- Solicitar novos endpoints se necessário

### Com Chat 3 (Automações):
- Preparar UI para controlar scrapers
- Exibir status de jobs Selenium
- Mostrar resultados de scraping

---

## 📚 DOCUMENTOS DE REFERÊNCIA

- **Plano completo:** `PLANO_MIGRACAO_ACELERADA_PYTHON.md`
- **Instruções gerais:** `.github/copilot-instructions.md`
- **⚠️ MAPEAMENTO DE FUNCIONALIDADES:** `MAPEAMENTO_FUNCIONALIDADES.md` ⭐ **LEIA ANTES DE IMPLEMENTAR**
- **Código existente:** `streamlit-app/app.py` e `pages/`
- **Sistema atual:** `src/components/Dashboard.tsx` (para referência de KPIs e layout)

---

## 🚨 REGRAS IMPORTANTES

1. **⚠️ CONSULTAR MAPEAMENTO** - Ler `MAPEAMENTO_FUNCIONALIDADES.md` ANTES de implementar
2. **Preservar TODOS os KPIs** - Dashboard deve mostrar as mesmas métricas
3. **Compatibilidade visual** - Layout similar ao React (processos, prazos, agentes)
4. **Mesmos filtros** - Status, datas, tipos (compatível com sistema atual)
5. **Sempre usar `st.set_page_config()`** - Primeira linha de cada página
6. **Cache de dados** - `@st.cache_data` para requests
7. **Estado global** - `st.session_state` para compartilhar entre páginas
8. **Error handling** - try/except em todos os requests
9. **Loading states** - `st.spinner()` ou `st.progress()`
10. **Responsividade** - Testar em diferentes tamanhos
11. **Prefixo numérico** - Páginas com `1_`, `2_`, etc
12. **Imports no topo** - Organizado e documentado

---

**Status:** ⏳ Aguardando conclusão da Semana 1 (Chat 1)
**Responsável:** Chat 2 - Frontend Streamlit
**Contato com:** Chat 1 (Backend) e Chat 3 (Automações)
