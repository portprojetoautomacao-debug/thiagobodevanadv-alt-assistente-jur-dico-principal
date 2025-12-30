"""
Página de Upload e Análise de Expedientes/Intimações
Migração Python - Upload de PDFs, análise automática com agentes
"""

import base64
from datetime import datetime
from typing import Any, Dict, List

import pandas as pd
import plotly.express as px
import streamlit as st
from lib.backend_client import BackendClient


def _processar_upload_arquivo(
    file: Any, tipo: str, processo_selecionado: str, analisar: bool, usar_batch: bool
) -> tuple[bool, str | None]:
    """Processa upload de um único arquivo."""
    try:
        # Ler arquivo
        file_bytes = file.read()
        file_b64 = base64.b64encode(file_bytes).decode()

        # Criar payload
        payload = {
            "filename": file.name,
            "content": file_b64,
            "tipo": tipo,
            "processoNumero": (
                processo_selecionado if processo_selecionado != "Nenhum" else None
            ),
            "analisarAutomaticamente": analisar and not usar_batch,
        }

        # Enviar para backend
        backend = BackendClient()
        result = backend.create_expediente(payload)

        if result:
            exp_id = result.get("expediente", {}).get("id")
            return True, exp_id
        return False, None

    except Exception as e:
        st.error(f"Erro ao processar {file.name}: {str(e)}")
        return False, None


def _analisar_em_lote(backend: BackendClient, ids: List[str]) -> None:
    """Executa análise em lote de expedientes."""
    with st.spinner("🤖 Analisando em lote..."):
        try:
            result = backend.post("/expedientes/analyze", {"ids": ids})
            updated = result.get("updated") if isinstance(result, dict) else None
            skipped = result.get("skipped") if isinstance(result, dict) else None
            skip_msg = result.get("message") if isinstance(result, dict) else None

            if updated is not None:
                msg = f"✅ Análise concluída! ({updated} atualizado(s))"
                if skipped and skipped > 0:
                    msg += f" • {skipped} ignorado(s)"
                st.success(msg)
                if skipped and skipped > 0:
                    st.warning(
                        skip_msg
                        or "Alguns itens foram ignorados por falta de texto extraído."
                    )
            else:
                st.success("✅ Análise concluída!")
        except Exception as e:
            st.warning(
                f"⚠️ Upload concluído, mas a análise em lote falhou: {str(e)}"
            )


def _render_tab_upload(backend: BackendClient) -> None:
    """Renderiza tab de upload de expedientes."""
    st.subheader("📤 Upload de Expedientes")

    with st.form("form_upload"):
        col1, col2 = st.columns([2, 1])

        with col1:
            uploaded_files = st.file_uploader(
                "Selecione um ou mais arquivos:",
                type=["pdf", "docx", "txt", "jpg", "png"],
                accept_multiple_files=True,
                help="Formatos suportados: PDF, DOCX, TXT, JPG, PNG",
            )

        with col2:
            tipo = st.selectbox(
                "Tipo:",
                ["Intimação", "Ofício", "Decisão", "Sentença", "Petição", "Outro"],
            )

            processos = backend.get_processes()
            processo_options = ["Nenhum"] + [
                p.get("numero", f"ID: {p.get('id')}") for p in processos
            ]
            processo_selecionado = st.selectbox("Processo:", processo_options)

        analisar_automaticamente = st.checkbox(
            "🤖 Analisar automaticamente com IA", value=True
        )

        col1, col2 = st.columns(2)
        with col1:
            submitted = st.form_submit_button(
                "📤 Enviar", type="primary", use_container_width=True
            )
        with col2:
            st.form_submit_button("🗑️ Limpar", use_container_width=True)

    # Processar upload
    if submitted and uploaded_files:
        _processar_uploads(
            uploaded_files,
            tipo,
            processo_selecionado,
            analisar_automaticamente,
            backend,
        )


def _processar_uploads(
    uploaded_files: List,
    tipo: str,
    processo_selecionado: str,
    analisar_automaticamente: bool,
    backend: BackendClient,
) -> None:
    """Processa múltiplos uploads de arquivos."""
    sucesso = 0
    erro = 0
    ids_para_analise = []
    usar_batch = analisar_automaticamente and len(uploaded_files) > 1

    progress_bar = st.progress(0)
    status_text = st.empty()

    for i, file in enumerate(uploaded_files):
        status_text.text(f"Processando {file.name}...")
        success, exp_id = _processar_upload_arquivo(
            file, tipo, processo_selecionado, analisar_automaticamente, usar_batch
        )

        if success:
            sucesso += 1
            if usar_batch and exp_id:
                ids_para_analise.append(exp_id)
        else:
            erro += 1

        progress_bar.progress((i + 1) / len(uploaded_files))

    status_text.empty()
    progress_bar.empty()

    if sucesso > 0:
        st.success(f"✅ {sucesso} arquivo(s) enviado(s) com sucesso!")
    if erro > 0:
        st.error(f"❌ {erro} arquivo(s) com erro")

    if analisar_automaticamente:
        if usar_batch and ids_para_analise:
            _analisar_em_lote(backend, ids_para_analise)
        else:
            st.info("🤖 Agentes de análise acionados. Resultados em breve.")


def _aplicar_filtros(expedientes: List[Dict], filtro_tipo: List, filtro_processado: str) -> List[Dict]:
    """Aplica filtros na lista de expedientes."""
    if filtro_tipo:
        expedientes = [e for e in expedientes if e.get("tipo") in filtro_tipo]

    if filtro_processado == "Processados":
        expedientes = [e for e in expedientes if e.get("processado")]
    elif filtro_processado == "Pendentes":
        expedientes = [e for e in expedientes if not e.get("processado")]

    return expedientes


def _render_metricas_expedientes(expedientes: List[Dict]) -> None:
    """Renderiza métricas dos expedientes."""
    col1, col2, col3, col4 = st.columns(4)

    with col1:
        st.metric("Total", len(expedientes))

    with col2:
        processados = len([e for e in expedientes if e.get("processado")])
        st.metric("Processados", processados)

    with col3:
        pendentes = len([e for e in expedientes if not e.get("processado")])
        percentual = f"{(pendentes/len(expedientes)*100):.0f}%" if expedientes else "0%"
        st.metric("Pendentes", pendentes, percentual)

    with col4:
        com_prazo = len([e for e in expedientes if e.get("prazo")])
        st.metric("Com Prazo", com_prazo)


def _criar_dataframe_expedientes(expedientes: List[Dict]) -> pd.DataFrame:
    """Cria DataFrame com dados dos expedientes."""
    data = []
    for e in expedientes:
        data.append(
            {
                "Arquivo": e.get("filename", "sem_nome.pdf"),
                "Tipo": e.get("tipo", "Outro"),
                "Processo": e.get("processoNumero", "-"),
                "Data Upload": datetime.fromisoformat(
                    e.get("createdAt", datetime.now().isoformat())
                ).strftime("%d/%m/%Y %H:%M"),
                "Status": "✅ Processado" if e.get("processado") else "⏳ Pendente",
                "Prazo": e.get("prazo", "-"),
                "Texto": "✅" if (e.get("conteudoExtraido") or "").strip() else "—",
                "ID": e.get("id"),
            }
        )
    return pd.DataFrame(data)


def _render_acoes_expedientes(selected_ids: List[str], backend: BackendClient) -> None:
    """Renderiza ações para expedientes selecionados."""
    st.info(f"✅ {len(selected_ids)} expediente(s) selecionado(s)")

    col1, col2, col3, col4 = st.columns(4)

    with col1:
        if st.button("🤖 Analisar com IA", use_container_width=True):
            _analisar_expedientes_selecionados(backend, selected_ids)

    with col2:
        if st.button("📥 Baixar", use_container_width=True):
            st.info("Download iniciado")

    with col3:
        if st.button("🔗 Vincular Processo", use_container_width=True):
            st.warning("Funcionalidade em desenvolvimento")

    with col4:
        if st.button("🗑️ Excluir", use_container_width=True, type="secondary"):
            st.warning("Confirmar exclusão?")


def _analisar_expedientes_selecionados(backend: BackendClient, selected_ids: List[str]) -> None:
    """Analisa expedientes selecionados."""
    with st.spinner("Analisando..."):
        try:
            result = backend.post("/expedientes/analyze", {"ids": selected_ids})
            updated = result.get("updated") if isinstance(result, dict) else None
            if updated is not None:
                st.success(f"✅ Análise concluída! ({updated} atualizado(s))")
            else:
                st.success("✅ Análise concluída!")
            st.rerun()
        except Exception as e:
            st.error(f"❌ Falha ao analisar: {str(e)}")


def _render_tab_lista(backend: BackendClient) -> None:
    """Renderiza tab com lista de expedientes."""
    st.subheader("📋 Expedientes Cadastrados")

    # Filtros
    col1, col2, col3 = st.columns(3)
    with col1:
        filtro_tipo = st.multiselect(
            "Tipo:",
            ["Intimação", "Ofício", "Decisão", "Sentença", "Petição", "Outro"],
            default=[],
        )
    with col2:
        filtro_processado = st.selectbox("Status:", ["Todos", "Processados", "Pendentes"])
    with col3:
        st.date_input("Data:")

    # Buscar e filtrar expedientes
    with st.spinner("Carregando expedientes..."):
        expedientes = backend.get_expedientes()

    expedientes = _aplicar_filtros(expedientes, filtro_tipo, filtro_processado)

    # Métricas
    _render_metricas_expedientes(expedientes)

    st.divider()

    if expedientes:
        df = _criar_dataframe_expedientes(expedientes)

        # Exibir tabela
        selection = st.dataframe(
            df.drop("ID", axis=1),
            use_container_width=True,
            hide_index=True,
            on_select="rerun",
            selection_mode="multi-row",
        )

        # Obter IDs selecionados
        selected_indices = []
        try:
            selected_indices = selection.selection.rows
        except Exception:
            pass

        if selected_indices:
            selected_ids = df.iloc[selected_indices]["ID"].tolist()
            _render_acoes_expedientes(selected_ids, backend)
    else:
        st.info("Nenhum expediente encontrado com os filtros aplicados.")


def _render_grafico_tipos(expedientes: List[Dict]) -> None:
    """Renderiza gráfico de distribuição por tipo."""
    tipo_count = {}
    for e in expedientes:
        tipo = e.get("tipo", "Outro")
        tipo_count[tipo] = tipo_count.get(tipo, 0) + 1

    df_tipos = pd.DataFrame(
        [{"Tipo": k, "Quantidade": v} for k, v in tipo_count.items()]
    )

    fig = px.pie(
        df_tipos,
        values="Quantidade",
        names="Tipo",
        title="Distribuição por Tipo",
        color_discrete_sequence=px.colors.sequential.Blues_r,
    )
    st.plotly_chart(fig, use_container_width=True)


def _render_grafico_status(expedientes: List[Dict]) -> None:
    """Renderiza gráfico de status de processamento."""
    processados = len([e for e in expedientes if e.get("processado")])
    pendentes = len(expedientes) - processados

    df_status = pd.DataFrame(
        [
            {"Status": "Processados", "Quantidade": processados},
            {"Status": "Pendentes", "Quantidade": pendentes},
        ]
    )

    fig = px.bar(
        df_status,
        x="Status",
        y="Quantidade",
        title="Status de Processamento",
        color="Status",
        color_discrete_map={"Processados": "#22c55e", "Pendentes": "#f59e0b"},
    )
    st.plotly_chart(fig, use_container_width=True)


def _render_grafico_tendencia(expedientes: List[Dict]) -> None:
    """Renderiza gráfico de tendência temporal."""
    dates_data = []
    for e in expedientes:
        created = datetime.fromisoformat(e.get("createdAt", datetime.now().isoformat()))
        dates_data.append({"Data": created.date(), "Quantidade": 1})

    if dates_data:
        df_trend = pd.DataFrame(dates_data)
        df_trend_grouped = df_trend.groupby("Data").sum().reset_index()

        fig = px.line(
            df_trend_grouped, x="Data", y="Quantidade", title="Uploads por Dia", markers=True
        )
        st.plotly_chart(fig, use_container_width=True)


def _render_analise_prazos(expedientes: List[Dict]) -> None:
    """Renderiza análise de prazos."""
    st.divider()
    st.markdown("### ⏰ Análise de Prazos")

    com_prazo = [e for e in expedientes if e.get("prazo")]

    if com_prazo:
        col1, col2, col3 = st.columns(3)

        with col1:
            st.metric("Expedientes com Prazo", len(com_prazo))

        with col2:
            vencendo = 0  # Implementar lógica
            st.metric("Vencendo em 7 dias", vencendo, delta_color="inverse")

        with col3:
            vencidos = 0  # Implementar lógica
            st.metric("Vencidos", vencidos, delta_color="inverse")
    else:
        st.info("Nenhum expediente com prazo definido.")


def _render_tab_estatisticas(backend: BackendClient) -> None:
    """Renderiza tab de estatísticas."""
    st.subheader("📊 Estatísticas de Expedientes")

    expedientes = backend.get_expedientes()

    if expedientes:
        col1, col2 = st.columns(2)

        with col1:
            _render_grafico_tipos(expedientes)

        with col2:
            _render_grafico_status(expedientes)

        # Tendência temporal
        st.divider()
        st.markdown("### 📈 Tendência de Upload (Últimos 30 dias)")
        _render_grafico_tendencia(expedientes)

        # Análise de prazos
        _render_analise_prazos(expedientes)
    else:
        st.info("Nenhum expediente cadastrado ainda.")


def render():
    """Renderiza página de expedientes."""
    st.title("📨 Expedientes e Intimações")
    st.caption("Upload de documentos | Análise automática com IA | Gestão completa")

    backend = BackendClient()

    tab1, tab2, tab3 = st.tabs(
        ["📥 Upload", "📋 Lista de Expedientes", "📊 Estatísticas"]
    )

    with tab1:
        _render_tab_upload(backend)

    with tab2:
        _render_tab_lista(backend)

    with tab3:
        _render_tab_estatisticas(backend)


if __name__ == "__main__":
    render()
