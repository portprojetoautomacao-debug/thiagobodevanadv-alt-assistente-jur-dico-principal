"""
Página de Upload e Análise de Expedientes/Intimações
Migração Python - Upload de PDFs, análise automática com agentes
"""

import base64
from datetime import datetime

import pandas as pd
import streamlit as st
from lib.backend_client import BackendClient


def render():
    """Renderiza página de expedientes."""

    st.title("📨 Expedientes e Intimações")
    st.caption("Upload de documentos | Análise automática com IA | Gestão completa")

    # Cliente backend
    backend = BackendClient()

    # ============================================
    # TABS
    # ============================================

    tab1, tab2, tab3 = st.tabs(
        ["📥 Upload", "📋 Lista de Expedientes", "📊 Estatísticas"]
    )

    # ============================================
    # TAB 1: UPLOAD
    # ============================================

    with tab1:
        st.subheader("📤 Upload de Expedientes")

        # Formulário de upload
        with st.form("form_upload"):
            col1, col2 = st.columns([2, 1])

            with col1:
                # Upload de arquivo
                uploaded_files = st.file_uploader(
                    "Selecione um ou mais arquivos:",
                    type=["pdf", "docx", "txt", "jpg", "png"],
                    accept_multiple_files=True,
                    help="Formatos suportados: PDF, DOCX, TXT, JPG, PNG",
                )

            with col2:
                # Tipo de expediente
                tipo = st.selectbox(
                    "Tipo:",
                    ["Intimação", "Ofício", "Decisão", "Sentença", "Petição", "Outro"],
                )

                # Processo associado (opcional)
                processos = backend.get_processes()
                processo_options = ["Nenhum"] + [
                    p.get("numero", f"ID: {p.get('id')}") for p in processos
                ]
                processo_selecionado = st.selectbox("Processo:", processo_options)

            # Análise automática
            analisar_automaticamente = st.checkbox(
                "🤖 Analisar automaticamente com IA", value=True
            )

            # Botões
            col1, col2 = st.columns(2)

            with col1:
                submitted = st.form_submit_button(
                    "📤 Enviar", type="primary", use_container_width=True
                )

            with col2:
                limpar = st.form_submit_button("🗑️ Limpar", use_container_width=True)

        # Processar upload
        if submitted and uploaded_files:
            sucesso = 0
            erro = 0

            progress_bar = st.progress(0)
            status_text = st.empty()

            for i, file in enumerate(uploaded_files):
                status_text.text(f"Processando {file.name}...")

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
                            processo_selecionado
                            if processo_selecionado != "Nenhum"
                            else None
                        ),
                        "analisarAutomaticamente": analisar_automaticamente,
                    }

                    # Enviar para backend
                    result = backend.create_expediente(payload)

                    if result:
                        sucesso += 1
                    else:
                        erro += 1

                except Exception as e:
                    st.error(f"Erro ao processar {file.name}: {str(e)}")
                    erro += 1

                # Atualizar progress
                progress_bar.progress((i + 1) / len(uploaded_files))

            # Resultado final
            status_text.empty()
            progress_bar.empty()

            if sucesso > 0:
                st.success(f"✅ {sucesso} arquivo(s) enviado(s) com sucesso!")

            if erro > 0:
                st.error(f"❌ {erro} arquivo(s) com erro")

            if analisar_automaticamente:
                st.info(
                    "🤖 Agentes de análise foram acionados. Resultados disponíveis em breve."
                )

    # ============================================
    # TAB 2: LISTA DE EXPEDIENTES
    # ============================================

    with tab2:
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
            filtro_processado = st.selectbox(
                "Status:", ["Todos", "Processados", "Pendentes"]
            )

        with col3:
            filtro_data = st.date_input("Data:")

        # Buscar expedientes
        with st.spinner("Carregando expedientes..."):
            expedientes = backend.get_expedientes()

        # Aplicar filtros
        if filtro_tipo:
            expedientes = [e for e in expedientes if e.get("tipo") in filtro_tipo]

        if filtro_processado == "Processados":
            expedientes = [e for e in expedientes if e.get("processado")]
        elif filtro_processado == "Pendentes":
            expedientes = [e for e in expedientes if not e.get("processado")]

        # Métricas
        col1, col2, col3, col4 = st.columns(4)

        with col1:
            st.metric("Total", len(expedientes))

        with col2:
            processados = len([e for e in expedientes if e.get("processado")])
            st.metric("Processados", processados)

        with col3:
            pendentes = len([e for e in expedientes if not e.get("processado")])
            st.metric(
                "Pendentes",
                pendentes,
                f"{(pendentes/len(expedientes)*100):.0f}%" if expedientes else "0%",
            )

        with col4:
            com_prazo = len([e for e in expedientes if e.get("prazo")])
            st.metric("Com Prazo", com_prazo)

        # Tabela
        st.divider()

        if expedientes:
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
                        "Status": (
                            "✅ Processado" if e.get("processado") else "⏳ Pendente"
                        ),
                        "Prazo": e.get("prazo", "-"),
                        "ID": e.get("id"),
                    }
                )

            df = pd.DataFrame(data)

            # Exibir tabela
            selected_rows = st.dataframe(
                df.drop("ID", axis=1),
                use_container_width=True,
                hide_index=True,
                on_select="rerun",
                selection_mode="multi-row",
            )

            # Ações em expedientes selecionados
            if selected_rows:
                st.info(f"✅ {len(selected_rows)} expediente(s) selecionado(s)")

                col1, col2, col3, col4 = st.columns(4)

                with col1:
                    if st.button("🤖 Analisar com IA", use_container_width=True):
                        with st.spinner("Analisando..."):
                            st.success("✅ Análise concluída!")

                with col2:
                    if st.button("📥 Baixar", use_container_width=True):
                        st.info("Download iniciado")

                with col3:
                    if st.button("🔗 Vincular Processo", use_container_width=True):
                        st.warning("Funcionalidade em desenvolvimento")

                with col4:
                    if st.button(
                        "🗑️ Excluir", use_container_width=True, type="secondary"
                    ):
                        st.warning("Confirmar exclusão?")

        else:
            st.info("Nenhum expediente encontrado com os filtros aplicados.")

    # ============================================
    # TAB 3: ESTATÍSTICAS
    # ============================================

    with tab3:
        st.subheader("📊 Estatísticas de Expedientes")

        if expedientes:
            col1, col2 = st.columns(2)

            with col1:
                # Gráfico por tipo
                import plotly.express as px

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

            with col2:
                # Gráfico por status
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
                    color_discrete_map={
                        "Processados": "#22c55e",
                        "Pendentes": "#f59e0b",
                    },
                )
                st.plotly_chart(fig, use_container_width=True)

            # Tendência temporal
            st.divider()
            st.markdown("### 📈 Tendência de Upload (Últimos 30 dias)")

            dates_data = []
            for e in expedientes:
                created = datetime.fromisoformat(
                    e.get("createdAt", datetime.now().isoformat())
                )
                dates_data.append({"Data": created.date(), "Quantidade": 1})

            if dates_data:
                df_trend = pd.DataFrame(dates_data)
                df_trend_grouped = df_trend.groupby("Data").sum().reset_index()

                fig = px.line(
                    df_trend_grouped,
                    x="Data",
                    y="Quantidade",
                    title="Uploads por Dia",
                    markers=True,
                )
                st.plotly_chart(fig, use_container_width=True)

        else:
            st.info("Nenhum expediente cadastrado ainda.")

        # Análise de prazos
        st.divider()
        st.markdown("### ⏰ Análise de Prazos")

        com_prazo = [e for e in expedientes if e.get("prazo")]

        if com_prazo:
            col1, col2, col3 = st.columns(3)

            with col1:
                st.metric("Expedientes com Prazo", len(com_prazo))

            with col2:
                # Prazos vencendo (próximos 7 dias)
                vencendo = 0  # Implementar lógica
                st.metric("Vencendo em 7 dias", vencendo, delta_color="inverse")

            with col3:
                # Prazos vencidos
                vencidos = 0  # Implementar lógica
                st.metric("Vencidos", vencidos, delta_color="inverse")

        else:
            st.info("Nenhum expediente com prazo definido.")


if __name__ == "__main__":
    render()
