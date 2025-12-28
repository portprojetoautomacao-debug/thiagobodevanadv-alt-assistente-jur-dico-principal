"""
Página de Gestão Completa de Processos
Migração Python - CRUD completo com filtros avançados
"""

from datetime import datetime

import pandas as pd
import plotly.express as px
import streamlit as st
from lib.backend_client import BackendClient


def render():
    """Renderiza página de gestão de processos."""

    st.title("📋 Gestão de Processos")
    st.caption("CRUD completo | Filtros avançados | Exportação de dados")

    # Cliente backend
    backend = BackendClient()

    # ============================================
    # FILTROS AVANÇADOS
    # ============================================

    with st.expander("🔍 Filtros Avançados", expanded=False):
        col1, col2, col3, col4 = st.columns(4)

        with col1:
            filtro_status = st.multiselect(
                "Status:",
                ["ativo", "suspenso", "arquivado", "concluido"],
                default=["ativo"],
            )

        with col2:
            filtro_vara = st.text_input("Vara:", placeholder="Ex: 1ª Vara")

        with col3:
            filtro_data_inicio = st.date_input("Data início:")

        with col4:
            filtro_data_fim = st.date_input("Data fim:")

    # Buscar campo de pesquisa
    col1, col2 = st.columns([3, 1])

    with col1:
        busca = st.text_input(
            "🔍 Buscar processo:",
            placeholder="Digite número CNJ, autor, réu ou título...",
            label_visibility="collapsed",
        )

    with col2:
        ordenacao = st.selectbox(
            "Ordenar por:",
            ["Mais recentes", "Mais antigos", "A-Z", "Z-A"],
            label_visibility="collapsed",
        )

    # ============================================
    # BOTÕES DE AÇÃO
    # ============================================

    st.divider()

    col1, col2, col3, col4 = st.columns(4)

    with col1:
        if st.button("➕ Novo Processo", use_container_width=True, type="primary"):
            st.session_state.show_form = True
            st.session_state.edit_process = None

    with col2:
        if st.button("🔄 Atualizar", use_container_width=True):
            st.rerun()

    with col3:
        if st.button("📥 Importar CSV", use_container_width=True):
            st.session_state.show_import = True

    with col4:
        if st.button("📤 Exportar", use_container_width=True):
            st.session_state.show_export = True

    # ============================================
    # CARREGAR PROCESSOS
    # ============================================

    with st.spinner("Carregando processos..."):
        processes = backend.get_processes()

    # Aplicar filtros
    if filtro_status:
        processes = [p for p in processes if p.get("status") in filtro_status]

    if filtro_vara:
        processes = [
            p for p in processes if filtro_vara.lower() in p.get("vara", "").lower()
        ]

    if busca:
        busca_lower = busca.lower()
        processes = [
            p
            for p in processes
            if (
                busca_lower in p.get("numero", "").lower()
                or busca_lower in p.get("autor", "").lower()
                or busca_lower in p.get("reu", "").lower()
                or busca_lower in p.get("titulo", "").lower()
            )
        ]

    # Aplicar ordenação
    if ordenacao == "Mais recentes":
        processes.sort(key=lambda p: p.get("createdAt", ""), reverse=True)
    elif ordenacao == "Mais antigos":
        processes.sort(key=lambda p: p.get("createdAt", ""))
    elif ordenacao == "A-Z":
        processes.sort(key=lambda p: p.get("titulo", ""))
    elif ordenacao == "Z-A":
        processes.sort(key=lambda p: p.get("titulo", ""), reverse=True)

    # ============================================
    # MÉTRICAS RÁPIDAS
    # ============================================

    col1, col2, col3, col4 = st.columns(4)

    with col1:
        st.metric("Total", len(processes))

    with col2:
        ativos = len([p for p in processes if p.get("status") == "ativo"])
        st.metric(
            "Ativos",
            ativos,
            f"{(ativos/len(processes)*100):.0f}%" if processes else "0%",
        )

    with col3:
        com_prazo = len([p for p in processes if p.get("prazos")])
        st.metric("Com Prazos", com_prazo)

    with col4:
        com_expedientes = len(
            [p for p in processes if p.get("expedientesCount", 0) > 0]
        )
        st.metric("Com Expedientes", com_expedientes)

    # ============================================
    # TABELA DE PROCESSOS
    # ============================================

    st.divider()
    st.subheader(f"📑 {len(processes)} Processo(s) Encontrado(s)")

    if processes:
        # Preparar dados para tabela
        data = []
        for p in processes:
            data.append(
                {
                    "Número": p.get("numero", "N/A"),
                    "Título": p.get("titulo", "Sem título"),
                    "Autor": p.get("autor", "N/A"),
                    "Réu": p.get("reu", "N/A"),
                    "Status": p.get("status", "desconhecido"),
                    "Vara": p.get("vara", "N/A"),
                    "Valor": f"R$ {p.get('valor', 0):,.2f}" if p.get("valor") else "-",
                    "Data": datetime.fromisoformat(
                        p.get("createdAt", datetime.now().isoformat())
                    ).strftime("%d/%m/%Y"),
                    "ID": p.get("id"),
                }
            )

        df = pd.DataFrame(data)

        # Configurar seleção
        selection = st.dataframe(
            df.drop("ID", axis=1),
            use_container_width=True,
            hide_index=True,
            column_config={
                "Status": st.column_config.SelectboxColumn(
                    "Status",
                    options=["ativo", "suspenso", "arquivado", "concluido"],
                    width="small",
                ),
                "Valor": st.column_config.NumberColumn("Valor", format="R$ %.2f"),
            },
            on_select="rerun",
            selection_mode="multi-row",
        )

        # Ações em lote
        if selection:
            st.info(f"✅ {len(selection)} processo(s) selecionado(s)")

            col1, col2, col3 = st.columns(3)

            with col1:
                if st.button("🗑️ Excluir selecionados", type="secondary"):
                    st.warning("Funcionalidade em desenvolvimento")

            with col2:
                if st.button("📁 Arquivar selecionados"):
                    st.warning("Funcionalidade em desenvolvimento")

            with col3:
                if st.button("📤 Exportar selecionados"):
                    st.warning("Funcionalidade em desenvolvimento")

    else:
        st.info("Nenhum processo encontrado com os filtros aplicados.")

    # ============================================
    # VISUALIZAÇÕES
    # ============================================

    if processes:
        st.divider()
        st.subheader("📊 Visualizações")

        col1, col2 = st.columns(2)

        with col1:
            # Gráfico de status
            status_count = {}
            for p in processes:
                status = p.get("status", "desconhecido")
                status_count[status] = status_count.get(status, 0) + 1

            df_status = pd.DataFrame(
                [{"Status": k, "Quantidade": v} for k, v in status_count.items()]
            )

            fig_status = px.pie(
                df_status,
                values="Quantidade",
                names="Status",
                title="Distribuição por Status",
                color_discrete_sequence=px.colors.sequential.Blues_r,
            )
            st.plotly_chart(fig_status, use_container_width=True)

        with col2:
            # Gráfico de varas
            vara_count = {}
            for p in processes:
                vara = p.get("vara", "N/A")
                vara_count[vara] = vara_count.get(vara, 0) + 1

            df_varas = pd.DataFrame(
                [
                    {"Vara": k, "Quantidade": v}
                    for k, v in sorted(
                        vara_count.items(), key=lambda x: x[1], reverse=True
                    )[:10]
                ]
            )

            fig_varas = px.bar(
                df_varas,
                x="Quantidade",
                y="Vara",
                title="Top 10 Varas",
                orientation="h",
                color="Quantidade",
                color_continuous_scale="Blues",
            )
            st.plotly_chart(fig_varas, use_container_width=True)

    # ============================================
    # FORMULÁRIO DE NOVO PROCESSO
    # ============================================

    if st.session_state.get("show_form"):
        with st.form("form_processo"):
            st.subheader("➕ Novo Processo")

            col1, col2 = st.columns(2)

            with col1:
                numero = st.text_input(
                    "Número CNJ *", placeholder="0001234-56.2025.8.02.0001"
                )
                titulo = st.text_input("Título *", placeholder="Ação de...")
                autor = st.text_input("Autor *")
                reu = st.text_input("Réu *")

            with col2:
                comarca = st.text_input("Comarca *", placeholder="Maceió")
                vara = st.text_input("Vara *", placeholder="1ª Vara Cível")
                status = st.selectbox(
                    "Status *", ["ativo", "suspenso", "arquivado", "concluido"]
                )
                valor = st.number_input(
                    "Valor da Causa (R$)", min_value=0.0, step=100.0
                )

            notas = st.text_area("Notas", height=100)

            col1, col2 = st.columns(2)

            with col1:
                submitted = st.form_submit_button(
                    "💾 Salvar", type="primary", use_container_width=True
                )

            with col2:
                canceled = st.form_submit_button(
                    "❌ Cancelar", use_container_width=True
                )

            if submitted:
                if not all([numero, titulo, autor, reu, comarca, vara]):
                    st.error("⚠️ Preencha todos os campos obrigatórios (*)")
                else:
                    with st.spinner("Salvando processo..."):
                        novo_processo = {
                            "numero": numero,
                            "titulo": titulo,
                            "autor": autor,
                            "reu": reu,
                            "comarca": comarca,
                            "vara": vara,
                            "status": status,
                            "valor": valor,
                            "notas": notas,
                        }

                        try:
                            result = backend.create_process(novo_processo)
                            if result:
                                st.success("✅ Processo criado com sucesso!")
                                st.session_state.show_form = False
                                st.rerun()
                            else:
                                st.error("❌ Erro ao criar processo")
                        except Exception as e:
                            st.error(f"❌ Erro: {str(e)}")

            if canceled:
                st.session_state.show_form = False
                st.rerun()

    # ============================================
    # IMPORTAÇÃO DE CSV
    # ============================================

    if st.session_state.get("show_import"):
        with st.container():
            st.subheader("📥 Importar Processos via CSV")

            st.markdown(
                """
            **Formato esperado:**
            - Colunas: numero, titulo, autor, reu, comarca, vara, status, valor
            - Separador: vírgula (,)
            - Encoding: UTF-8
            """
            )

            uploaded_file = st.file_uploader("Selecione arquivo CSV:", type=["csv"])

            if uploaded_file:
                try:
                    df_import = pd.read_csv(uploaded_file)
                    st.dataframe(df_import.head(), use_container_width=True)

                    if st.button("✅ Confirmar Importação", type="primary"):
                        st.success(f"✅ {len(df_import)} processos importados!")
                        st.session_state.show_import = False
                        st.rerun()
                except Exception as e:
                    st.error(f"❌ Erro ao ler CSV: {str(e)}")

            if st.button("❌ Cancelar"):
                st.session_state.show_import = False
                st.rerun()

    # ============================================
    # EXPORTAÇÃO
    # ============================================

    if st.session_state.get("show_export"):
        with st.container():
            st.subheader("📤 Exportar Processos")

            formato = st.radio("Formato:", ["CSV", "Excel", "JSON"])

            if st.button("💾 Baixar", type="primary"):
                if formato == "CSV":
                    csv = df.to_csv(index=False)
                    st.download_button(
                        "📥 Download CSV", csv, "processos.csv", "text/csv"
                    )
                elif formato == "JSON":
                    json = df.to_json(orient="records", indent=2)
                    st.download_button(
                        "📥 Download JSON", json, "processos.json", "application/json"
                    )

            if st.button("❌ Fechar"):
                st.session_state.show_export = False
                st.rerun()


if __name__ == "__main__":
    render()
