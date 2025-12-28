"""
Dashboard principal com visualizações interativas.
Migração Python - Sistema 100% Streamlit + LangChain + FastAPI
"""

from datetime import datetime, timedelta

import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
import requests
import streamlit as st
from lib.backend_client import BackendClient


def render():
    """Renderiza página do dashboard."""

    # CSS Customizado avançado
    st.markdown(
        """
    <style>
        .metric-card {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 1.5rem;
            border-radius: 10px;
            color: white;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .main-header {
            font-size: 2.5rem;
            font-weight: bold;
            color: #1e40af;
            margin-bottom: 0.5rem;
        }
        .subtitle {
            color: #64748b;
            font-size: 1.1rem;
        }
    </style>
    """,
        unsafe_allow_html=True,
    )

    st.markdown(
        '<h1 class="main-header">⚖️ Assistente Jurídico PJe</h1>', unsafe_allow_html=True
    )
    st.markdown(
        '<p class="subtitle">Sistema 100% Python | Streamlit + LangChain + FastAPI + Selenium</p>',
        unsafe_allow_html=True,
    )

    # Cliente backend
    backend = BackendClient()

    # ============================================
    # KPIs PRINCIPAIS
    # ============================================

    with st.spinner("Carregando dados..."):
        processes = backend.get_processes()
        expedientes = backend.get_expedientes()
        metrics = backend.get_metrics()

    # Calcular KPIs
    total_processos = len(processes)
    ativos = len([p for p in processes if p.get("status") == "ativo"])
    concluidos = len([p for p in processes if p.get("status") == "concluido"])
    taxa_sucesso = (concluidos / total_processos * 100) if total_processos > 0 else 0

    # Exibir métricas
    col1, col2, col3, col4 = st.columns(4)

    with col1:
        st.metric(
            label="Total de Processos",
            value=total_processos,
            delta=f"+{len([p for p in processes if (datetime.now() - datetime.fromisoformat(p.get('createdAt', datetime.now().isoformat()))).days < 7])} esta semana",
        )

    with col2:
        st.metric(
            label="Processos Ativos",
            value=ativos,
            delta=(
                f"{(ativos/total_processos*100):.1f}%" if total_processos > 0 else "0%"
            ),
        )

    with col3:
        st.metric(
            label="Concluídos", value=concluidos, delta=f"{taxa_sucesso:.1f}% taxa"
        )

    with col4:
        expedientes_pendentes = len([e for e in expedientes if not e.get("processado")])
        st.metric(
            label="Expedientes Pendentes",
            value=expedientes_pendentes,
            delta=f"-{len([e for e in expedientes if e.get('processado')])} hoje",
        )

    st.divider()

    # ============================================
    # GRÁFICOS INTERATIVOS
    # ============================================

    col1, col2 = st.columns(2)

    with col1:
        st.subheader("📈 Distribuição por Status")

        if processes:
            df_status = pd.DataFrame(
                [
                    {"Status": "Ativo", "Quantidade": ativos},
                    {"Status": "Concluído", "Quantidade": concluidos},
                    {
                        "Status": "Suspenso",
                        "Quantidade": total_processos - ativos - concluidos,
                    },
                ]
            )

            fig_status = px.pie(
                df_status,
                values="Quantidade",
                names="Status",
                color="Status",
                color_discrete_map={
                    "Ativo": "#3b82f6",
                    "Concluído": "#22c55e",
                    "Suspenso": "#f59e0b",
                },
                hole=0.4,
            )
            fig_status.update_traces(textposition="inside", textinfo="percent+label")
            st.plotly_chart(fig_status, use_container_width=True)
        else:
            st.info("Nenhum processo cadastrado ainda.")

    with col2:
        st.subheader("📊 Processos por Vara")

        if processes:
            varas = {}
            for p in processes:
                vara = p.get("vara", "Não especificado")
                varas[vara] = varas.get(vara, 0) + 1

            df_varas = pd.DataFrame(
                [
                    {"Vara": k, "Processos": v}
                    for k, v in sorted(varas.items(), key=lambda x: x[1], reverse=True)[
                        :10
                    ]
                ]
            )

            fig_varas = px.bar(
                df_varas,
                x="Processos",
                y="Vara",
                orientation="h",
                color="Processos",
                color_continuous_scale="Blues",
            )
            fig_varas.update_layout(showlegend=False)
            st.plotly_chart(fig_varas, use_container_width=True)
        else:
            st.info("Nenhum processo cadastrado ainda.")

    # ============================================
    # TENDÊNCIAS TEMPORAIS
    # ============================================

    st.subheader("📉 Tendência de Processos (Últimos 30 dias)")

    if processes:
        # Agrupar por data
        dates_data = []
        for p in processes:
            created = datetime.fromisoformat(
                p.get("createdAt", datetime.now().isoformat())
            )
            dates_data.append({"Data": created.date(), "Status": p.get("status")})

        df_trend = pd.DataFrame(dates_data)
        df_trend_grouped = (
            df_trend.groupby(["Data", "Status"]).size().reset_index(name="Quantidade")
        )

        fig_trend = px.line(
            df_trend_grouped,
            x="Data",
            y="Quantidade",
            color="Status",
            color_discrete_map={
                "ativo": "#3b82f6",
                "concluido": "#22c55e",
                "suspenso": "#f59e0b",
            },
        )
        fig_trend.update_layout(hovermode="x unified")
        st.plotly_chart(fig_trend, use_container_width=True)
    else:
        st.info("Sem dados históricos para exibir.")

    # ============================================
    # MÉTRICAS DE AGENTES IA
    # ============================================

    st.divider()
    st.subheader("🤖 Performance dos Agentes IA")

    if metrics and metrics.get("agents"):
        agents_data = []
        for agent_id, agent_metrics in metrics.get("agents", {}).items():
            agents_data.append(
                {
                    "Agente": agent_id,
                    "Execuções": agent_metrics.get("totalExecutions", 0),
                    "Taxa Sucesso": f"{agent_metrics.get('successRate', 0):.1f}%",
                    "Latência Média": f"{agent_metrics.get('avgLatency', 0):.0f}ms",
                }
            )

        df_agents = pd.DataFrame(agents_data)
        st.dataframe(df_agents, use_container_width=True, hide_index=True)
    else:
        st.info("Métricas de agentes não disponíveis.")

    # ============================================
    # PROCESSOS RECENTES
    # ============================================

    st.divider()
    st.subheader("📋 Processos Recentes")

    if processes:
        recent = sorted(
            processes,
            key=lambda p: p.get("updatedAt", p.get("createdAt", "")),
            reverse=True,
        )[:10]

        recent_data = []
        for p in recent:
            recent_data.append(
                {
                    "Número": p.get("numero", "N/A"),
                    "Título": p.get("titulo", "Sem título"),
                    "Status": p.get("status", "desconhecido"),
                    "Vara": p.get("vara", "N/A"),
                    "Última Atualização": datetime.fromisoformat(
                        p.get(
                            "updatedAt", p.get("createdAt", datetime.now().isoformat())
                        )
                    ).strftime("%d/%m/%Y %H:%M"),
                }
            )

        df_recent = pd.DataFrame(recent_data)
        st.dataframe(
            df_recent,
            use_container_width=True,
            hide_index=True,
            column_config={
                "Status": st.column_config.TextColumn(
                    "Status", help="Status atual do processo"
                )
            },
        )
    else:
        st.info("Nenhum processo cadastrado.")

    # ============================================
    # BOTÕES DE AÇÃO
    # ============================================

    st.divider()
    st.subheader("🎬 Ações Rápidas")

    col1, col2, col3, col4 = st.columns(4)

    with col1:
        if st.button("🔄 Sincronizar DJEN", use_container_width=True, type="primary"):
            with st.spinner("🔍 Buscando publicações no DJEN..."):
                try:
                    response = backend.api_request("POST", "/api/djen/sync")
                    if response and response.get("success"):
                        st.success(
                            f"✅ {response.get('count', 0)} publicações encontradas!"
                        )
                        st.balloons()
                    else:
                        st.error("❌ Erro ao sincronizar DJEN")
                except Exception as e:
                    st.error(f"❌ Erro: {str(e)}")

    with col2:
        if st.button("📥 Importar Expedientes", use_container_width=True):
            st.info(
                "📁 Navegue até a página 'Expedientes' para fazer upload de arquivos"
            )

    with col3:
        if st.button("🤖 Executar Agentes", use_container_width=True):
            with st.spinner("🤖 Ativando 16 agentes IA..."):
                try:
                    response = backend.api_request("POST", "/api/agents/run-all")
                    if response and response.get("success"):
                        st.success(
                            f"✅ {response.get('count', 16)} agentes executados com sucesso!"
                        )
                    else:
                        st.warning("⚠️ Alguns agentes falharam")
                except Exception as e:
                    st.error(f"❌ Erro ao executar agentes: {str(e)}")

    with col4:
        if st.button("🔄 Atualizar Dados", use_container_width=True):
            st.rerun()


if __name__ == "__main__":
    render()
