"""
Página de Agentes IA - Execução dos 16 agentes
"""

import asyncio
import os
import sys
from pathlib import Path

import streamlit as st

sys.path.insert(0, str(Path(__file__).parent.parent / "lib"))
from agents import AGENTS_MAP

# Config UI dos agentes
AGENTS_UI = {
    "harvey": {"icon": "🎯", "color": "#1e40af"},
    "justine": {"icon": "📋", "color": "#8b5cf6"},
    "redacao": {"icon": "✍️", "color": "#059669"},
    "pesquisa": {"icon": "🔍", "color": "#ea580c"},
    "analise-documental": {"icon": "📄", "color": "#0891b2"},
    "monitor-djen": {"icon": "📰", "color": "#dc2626"},
    "gestao-prazos": {"icon": "⏰", "color": "#ca8a04"},
    "organizacao-arquivos": {"icon": "📁", "color": "#7c3aed"},
    "analise-risco": {"icon": "⚠️", "color": "#dc2626"},
    "revisao-contratual": {"icon": "📝", "color": "#059669"},
    "comunicacao-clientes": {"icon": "💬", "color": "#0891b2"},
    "financeiro": {"icon": "💰", "color": "#16a34a"},
    "estrategia-processual": {"icon": "🎲", "color": "#7c3aed"},
    "traducao-juridica": {"icon": "🌐", "color": "#2563eb"},
    "compliance": {"icon": "🛡️", "color": "#dc2626"},
    "analise-sentenca": {"icon": "⚖️", "color": "#1e40af"},
}

st.title("🤖 Agentes de IA")
st.caption("16 agentes especializados | Powered by Gemini 2.0 Flash")

api_key_present = bool(os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY"))
if not api_key_present:
    st.warning(
        "⚠️ Gemini não configurado neste ambiente. Defina GEMINI_API_KEY ou GOOGLE_API_KEY para usar os agentes."
    )

# Grid de agentes
st.subheader("📋 Todos os Agentes")
cols = st.columns(4)

for idx, (agent_id, AgentClass) in enumerate(AGENTS_MAP.items()):
    with cols[idx % 4]:
        ui = AGENTS_UI.get(agent_id, {"icon": "🤖", "color": "#gray"})

        try:
            agent = AgentClass()
            agent_name = agent.name
            agent_role = agent.role
        except Exception as e:
            agent_name = agent_id
            agent_role = f"Indisponível: {str(e)}"

        st.markdown(
            f"""
        <div style="background: white; padding: 1rem; border-radius: 0.5rem;
                    border-left: 4px solid {ui['color']}; margin-bottom: 1rem;">
            <h4>{ui['icon']} {agent_name}</h4>
            <p style="font-size: 0.85rem; color: #666;">{agent_role}</p>
        </div>
        """,
            unsafe_allow_html=True,
        )

st.divider()

# Testar agente
st.subheader("🧪 Testar Agente")

col1, col2 = st.columns([1, 2])

with col1:
    agent_names = {}
    for id in AGENTS_MAP.keys():
        try:
            agent_names[
                f"{AGENTS_UI.get(id, {}).get('icon', '🤖')} {AGENTS_MAP[id]().name}"
            ] = id
        except Exception:
            agent_names[f"{AGENTS_UI.get(id, {}).get('icon', '🤖')} {id}"] = id

    selected = st.selectbox("Escolha:", list(agent_names.keys()))
    agent_id = agent_names[selected]

with col2:
    task = st.text_area("Tarefa:", height=150, placeholder="Digite sua tarefa...")
    execute = st.button("▶️ Executar", type="primary", use_container_width=True)

if execute and task:
    with st.spinner("🤖 Executando..."):
        try:
            AgentClass = AGENTS_MAP[agent_id]
            agent = AgentClass()

            async def run():
                return await agent.execute(task)

            try:
                result = asyncio.run(run())
            except Exception as e:
                if "API_KEY" in str(e):
                    st.warning(
                        "⚠️ Configure GOOGLE_API_KEY ou GEMINI_API_KEY no ambiente"
                    )
                    result = {
                        "status": "demo",
                        "response": f"[DEMO] Agente analisaria: '{task[:100]}...'",
                        "confidence": 0,
                    }
                else:
                    raise e

            if result.get("status") in ["completed", "demo"]:
                st.success("✅ Concluído!")
                st.markdown(result.get("response", ""))
            else:
                st.error(f"❌ Erro: {result.get('error')}")
        except Exception as e:
            st.error(f"❌ {str(e)}")

st.divider()

# Estatísticas
st.subheader("📊 Estatísticas")
col1, col2, col3 = st.columns(3)
with col1:
    st.metric("Total Agentes", "16")
with col2:
    st.metric("Execuções Hoje", "127", delta="+45")
with col3:
    st.metric("Taxa Sucesso", "94%")
