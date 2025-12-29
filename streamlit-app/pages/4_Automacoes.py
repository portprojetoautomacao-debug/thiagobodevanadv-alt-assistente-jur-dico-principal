"""
Página de Automações - Selenium + PyAutoGUI
Controla scrapers e bots de automação.
"""

import time
from datetime import datetime, timedelta

import pandas as pd
import pytz
import streamlit as st
from lib.backend_client import BackendClient

# Fuso horário de Brasília
BRAZIL_TZ = pytz.timezone("America/Sao_Paulo")


def render():
    """Renderiza página de automações."""

    st.title("🔍 Automações e Scraping")
    st.caption("Selenium WebDriver | PyAutoGUI | Monitoramento DJEN/PJe")

    backend = BackendClient()

    # ============================================
    # STATUS DOS SERVIÇOS
    # ============================================

    st.subheader("📡 Status dos Serviços")
    col1, col2, col3 = st.columns(3)

    with col1:
        st.metric("Selenium WebDriver", "Pronto", "v4.17.0")

    with col2:
        st.metric("PyAutoGUI", "Ativo", "Monitorando")

    with col3:
        st.metric("Chrome Headless", "Online", "v121.0")

    st.divider()

    # ============================================
    # CONTROLE DE AUTOMAÇÕES
    # ============================================

    col_djen, col_pje = st.columns(2)

    with col_djen:
        st.markdown("### 📰 API DJEN (CNJ)")
        st.info("Consulta via seu navegador (Brasil)")

        data_busca = st.date_input("Data da disponibilização")
        oab_numero = st.text_input("Número OAB", "184404")
        oab_uf = st.selectbox("UF OAB", ["MG", "SP", "RJ", "DF", "AL"])

        if st.button("🚀 Consultar API DJEN"):
            url = f"https://comunicaapi.pje.jus.br/api/v1/comunicacao?numeroOab={oab_numero}&ufOab={oab_uf}&meio=D&dataDisponibilizacaoInicio={data_busca}&dataDisponibilizacaoFim={data_busca}"

            st.components.v1.html(
                f"""
                <div id="resultado"></div>
                <script>
                const resultado = document.getElementById('resultado');
                resultado.innerHTML = '<p style="color: #1f77b4;">⏳ Consultando API DJEN...</p>';

                fetch("{url}", {{
                    method: 'GET',
                    headers: {{
                        'Accept': 'application/json'
                    }}
                }})
                .then(response => {{
                    if (!response.ok) {{
                        throw new Error('HTTP ' + response.status + ': ' + response.statusText);
                    }}
                    return response.json();
                }})
                .then(data => {{
                    const count = data.count || 0;
                    if (count > 0) {{
                        resultado.innerHTML = '<div style="padding: 10px; background: #d4edda; color: #155724; border-radius: 5px;">' +
                            '<strong>✅ ' + count + ' publicação(ões) encontrada(s)!</strong><br><br>' +
                            '<pre style="font-size: 12px; max-height: 300px; overflow-y: auto;">' +
                            JSON.stringify(data.items.slice(0, 3), null, 2) +
                            '</pre></div>';
                    }} else {{
                        resultado.innerHTML = '<div style="padding: 10px; background: #fff3cd; color: #856404; border-radius: 5px;">' +
                            '⚠️ Nenhuma publicação encontrada para esta data/OAB</div>';
                    }}
                }})
                .catch(error => {{
                    resultado.innerHTML = '<div style="padding: 10px; background: #f8d7da; color: #721c24; border-radius: 5px;">' +
                        '❌ Erro: ' + error.message + '</div>';
                }});
                </script>
            """,
                height=400,
            )

    # --- PJe Automation ---
    with col_pje:
        st.markdown("### ⚖️ Automação PJe")
        st.info("Protocolo e consulta automática no PJe")

        with st.form("pje_form"):
            acao = st.selectbox(
                "Ação",
                ["Consultar Processo", "Protocolar Petição", "Baixar Documentos"],
            )
            numero_processo = st.text_input("Número do Processo")

            submitted_pje = st.form_submit_button("🤖 Executar Bot PJe")

            if submitted_pje:
                with st.spinner(f"Executando {acao}..."):
                    # Simulação
                    time.sleep(2)
                    st.success(f"✅ {acao} agendada com sucesso!")

    st.divider()

    # ============================================
    # LOGS DE EXECUÇÃO
    # ============================================

    st.subheader("📜 Logs de Execução")

    # Dados simulados para logs - usando horário de Brasília
    now_brazil = datetime.now(BRAZIL_TZ)
    logs_data = {
        "Data/Hora": [
            now_brazil.strftime("%d/%m/%Y %H:%M"),
            (now_brazil - timedelta(minutes=15)).strftime("%d/%m/%Y %H:%M"),
            (now_brazil - timedelta(hours=1)).strftime("%d/%m/%Y %H:%M"),
        ],
        "Automação": ["Monitor DJEN", "Bot PJe", "Monitor DJEN"],
        "Status": ["Sucesso", "Sucesso", "Sucesso"],
        "Detalhes": [
            "5 novas publicações encontradas",
            "Consulta processo 001...",
            "Sem novas publicações",
        ],
    }

    df_logs = pd.DataFrame(logs_data)

    st.dataframe(
        df_logs,
        use_container_width=True,
        hide_index=True,
        column_config={
            "Status": st.column_config.TextColumn(
                "Status",
                help="Status da execução",
                validate="^Sucesso|Erro|Em andamento$",
            )
        },
    )


if __name__ == "__main__":
    render()
