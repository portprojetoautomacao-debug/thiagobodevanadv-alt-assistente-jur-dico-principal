"""
Dashboard de Métricas e Visualizações
Exibe estatísticas e gráficos das intimações e processos
"""

from datetime import datetime, timedelta

import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
import streamlit as st
from lib.backend_client import BackendClient


def render():
    """Renderiza o dashboard de métricas."""

    st.title("📊 Dashboard - Métricas e Análises")
    st.caption("Estatísticas de intimações, processos e prazos")

    backend = BackendClient()

    # Buscar dados
    with st.spinner("Carregando dados..."):
        try:
            publications = backend.kv_get("publications") or []
            tasks = backend.kv_get("tasks") or []
            djen_heartbeat = backend.kv_get("djen:heartbeat") or {}
        except Exception as e:
            st.error(f"Erro ao carregar dados: {e}")
            publications = []
            tasks = []
            djen_heartbeat = {}

    # Status DJEN (heartbeat)
    if isinstance(djen_heartbeat, dict) and djen_heartbeat:
        status = djen_heartbeat.get("status")
        ran_at = djen_heartbeat.get("ranAt")
        window = (
            djen_heartbeat.get("window")
            if isinstance(djen_heartbeat.get("window"), dict)
            else {}
        )
        msg = f"DJEN: {status}"
        if ran_at:
            msg += f" • última execução: {ran_at}"
        if window.get("start") and window.get("end"):
            msg += f" • janela: {window.get('start')} → {window.get('end')}"

        if status == "error":
            st.warning(msg)
        else:
            st.caption(msg)

    # ============================================
    # CARDS DE RESUMO
    # ============================================

    st.subheader("📈 Visão Geral")

    col1, col2, col3, col4 = st.columns(4)

    with col1:
        st.metric(
            "Total de Publicações",
            len(publications),
            help="Publicações capturadas do DJEN",
        )

    with col2:
        novas = len([p for p in publications if not p.get("notified", False)])
        st.metric(
            "Não Processadas",
            novas,
            delta=(
                f"-{len(publications) - novas}" if novas < len(publications) else None
            ),
            help="Intimações aguardando processamento",
        )

    with col3:
        tarefas_pendentes = len([t for t in tasks if t.get("status") == "pendente"])
        st.metric(
            "Tarefas Pendentes", tarefas_pendentes, help="Tarefas criadas pelos agentes"
        )

    with col4:
        # Calcular prazos próximos (próximos 7 dias)
        hoje = datetime.now()
        prazos_proximos = 0
        for task in tasks:
            prazo = task.get("prazo")
            if prazo:
                try:
                    prazo_date = datetime.fromisoformat(prazo.replace("Z", "+00:00"))
                    if hoje <= prazo_date <= hoje + timedelta(days=7):
                        prazos_proximos += 1
                except Exception:
                    pass

        st.metric(
            "Prazos Próximos",
            prazos_proximos,
            delta="7 dias",
            delta_color="inverse",
            help="Prazos nos próximos 7 dias",
        )

    st.divider()

    # ============================================
    # GRÁFICOS
    # ============================================

    if not publications:
        st.info("📭 Nenhuma publicação encontrada ainda. Execute o monitoramento DJEN.")
        return

    # Converter para DataFrame
    df = pd.DataFrame(publications)

    # ============================================
    # PUBLICAÇÕES POR TRIBUNAL
    # ============================================

    st.subheader("⚖️ Publicações por Tribunal")

    col_grafico1, col_grafico2 = st.columns(2)

    with col_grafico1:
        # Gráfico de barras
        tribunal_counts = df["tribunal"].value_counts()
        fig_tribunal = px.bar(
            x=tribunal_counts.index,
            y=tribunal_counts.values,
            labels={"x": "Tribunal", "y": "Quantidade"},
            title="Distribuição por Tribunal",
            color=tribunal_counts.values,
            color_continuous_scale="Blues",
        )
        fig_tribunal.update_layout(showlegend=False)
        st.plotly_chart(fig_tribunal, use_container_width=True)

    with col_grafico2:
        # Gráfico de pizza
        fig_pie = px.pie(
            values=tribunal_counts.values,
            names=tribunal_counts.index,
            title="Proporção por Tribunal",
        )
        st.plotly_chart(fig_pie, use_container_width=True)

    st.divider()

    # ============================================
    # TIMELINE DE INTIMAÇÕES
    # ============================================

    st.subheader("📅 Timeline de Intimações")

    if "data" in df.columns:
        # Preparar dados
        df["data_parsed"] = pd.to_datetime(df["data"], errors="coerce")
        df_timeline = df.dropna(subset=["data_parsed"])

        if not df_timeline.empty:
            # Agrupar por data
            timeline = (
                df_timeline.groupby(df_timeline["data_parsed"].dt.date)
                .size()
                .reset_index()
            )
            timeline.columns = ["Data", "Quantidade"]

            # Gráfico de linha
            fig_timeline = px.line(
                timeline,
                x="Data",
                y="Quantidade",
                title="Intimações ao Longo do Tempo",
                markers=True,
            )
            fig_timeline.update_traces(line_color="#007bff", line_width=3)
            fig_timeline.update_layout(hovermode="x unified")

            st.plotly_chart(fig_timeline, use_container_width=True)
        else:
            st.info("Sem dados de timeline disponíveis")

    st.divider()

    # ============================================
    # PUBLICAÇÕES POR TIPO
    # ============================================

    st.subheader("📋 Tipos de Comunicação")

    if "tipo" in df.columns:
        tipo_counts = df["tipo"].value_counts()

        fig_tipo = go.Figure(
            data=[
                go.Bar(
                    x=tipo_counts.values,
                    y=tipo_counts.index,
                    orientation="h",
                    marker={"color": tipo_counts.values, "colorscale": "Viridis"},
                )
            ]
        )
        fig_tipo.update_layout(
            title="Distribuição por Tipo de Comunicação",
            xaxis_title="Quantidade",
            yaxis_title="Tipo",
            height=400,
        )

        st.plotly_chart(fig_tipo, use_container_width=True)

    st.divider()

    # ============================================
    # TABELA DE PUBLICAÇÕES RECENTES
    # ============================================

    st.subheader("📰 Publicações Recentes")

    # Ordenar por data (mais recentes primeiro)
    df_sorted = (
        df.sort_values("createdAt", ascending=False)
        if "createdAt" in df.columns
        else df
    )

    # Selecionar colunas relevantes
    display_cols = []
    for col in ["data", "tribunal", "tipo", "numeroProcesso", "notified"]:
        if col in df_sorted.columns:
            display_cols.append(col)

    if display_cols:
        df_display = df_sorted[display_cols].head(20)

        # Renomear colunas
        rename_map = {
            "data": "Data",
            "tribunal": "Tribunal",
            "tipo": "Tipo",
            "numeroProcesso": "Processo",
            "notified": "Processada",
        }
        df_display = df_display.rename(columns=rename_map)

        # Formatar coluna Processada
        if "Processada" in df_display.columns:
            df_display["Processada"] = df_display["Processada"].map(
                {True: "✅", False: "⏳"}
            )

        st.dataframe(
            df_display,
            use_container_width=True,
            hide_index=True,
            column_config={
                "Data": st.column_config.TextColumn("Data", width="small"),
                "Tribunal": st.column_config.TextColumn("Tribunal", width="small"),
                "Tipo": st.column_config.TextColumn("Tipo", width="medium"),
                "Processo": st.column_config.TextColumn("Processo", width="large"),
                "Processada": st.column_config.TextColumn("Status", width="small"),
            },
        )

    st.divider()

    # ============================================
    # ESTATÍSTICAS ADICIONAIS
    # ============================================

    st.subheader("📊 Estatísticas Detalhadas")

    col_stats1, col_stats2 = st.columns(2)

    with col_stats1:
        st.markdown("**📌 Resumo Geral**")
        st.write(f"• Total de publicações: **{len(publications)}**")
        st.write(
            f"• Tribunais únicos: **{df['tribunal'].nunique() if 'tribunal' in df.columns else 0}**"
        )
        st.write(
            f"• Tipos de comunicação: **{df['tipo'].nunique() if 'tipo' in df.columns else 0}**"
        )
        st.write(
            f"• Taxa de processamento: **{((len(publications) - novas) / len(publications) * 100) if len(publications) > 0 else 0:.1f}%**"
        )

    with col_stats2:
        st.markdown("**⏰ Atividade Recente**")

        if "createdAt" in df.columns:
            df["created_parsed"] = pd.to_datetime(df["createdAt"], errors="coerce")

            # Últimas 24h
            ontem = datetime.now() - timedelta(days=1)
            ultimas_24h = len(df[df["created_parsed"] > ontem])

            # Última semana
            semana_passada = datetime.now() - timedelta(days=7)
            ultima_semana = len(df[df["created_parsed"] > semana_passada])

            st.write(f"• Últimas 24 horas: **{ultimas_24h}**")
            st.write(f"• Última semana: **{ultima_semana}**")
            st.write(f"• Média por dia (7d): **{ultima_semana / 7:.1f}**")


if __name__ == "__main__":
    render()
