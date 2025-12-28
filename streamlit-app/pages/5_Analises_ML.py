"""
Página de Análises de Machine Learning
Migração Python - scikit-learn | Predição de sucesso | Estimativa de duração
"""

import streamlit as st

# from lib.backend_client import BackendClient


def render():
    """Renderiza página de análises ML."""
    st.title("📊 Análises de Machine Learning")
    st.caption(
        "scikit-learn | Predição de sucesso | Estimativa de duração | Clustering"
    )

    # ============================================
    # MODELOS DISPONÍVEIS
    # ============================================

    st.subheader("🤖 Modelos de ML")

    st.info("ℹ️ Modelos aguardando dados para treinamento.")

    col1, col2, col3 = st.columns(3)

    with col1:
        st.markdown("### 🎯 Predição de Sucesso")
        st.caption("RandomForestClassifier")
        st.metric("Acurácia", "N/A")
        st.info("Aguardando dados")

    with col2:
        st.markdown("### ⏱️ Estimativa de Duração")
        st.caption("GradientBoostingRegressor")
        st.metric("MAE", "N/A")
        st.info("Aguardando dados")

    with col3:
        st.markdown("### 🔍 Clustering")
        st.caption("KMeans")
        st.metric("Score", "N/A")
        st.info("Aguardando dados")

    st.divider()

    # ============================================
    # TREINAMENTO
    # ============================================

    col_train, col_predict = st.columns([1, 2])

    with col_train:
        st.subheader("⚙️ Treinamento")
        if st.button("🚀 Treinar Modelos", use_container_width=True):
            st.info(
                "Funcionalidade em desenvolvimento. Necessário acumular dados históricos."
            )

    # ============================================
    # PREDIÇÃO (INFERÊNCIA)
    # ============================================

    with col_predict:
        st.subheader("🔮 Predição de Novo Caso")

        with st.form("predict_form"):
            col_a, col_b = st.columns(2)
            with col_a:
                tipo_acao = st.selectbox(
                    "Tipo de Ação", ["Trabalhista", "Cível", "Tributário", "Família"]
                )
                valor_causa = st.number_input(
                    "Valor da Causa (R$)", min_value=0.0, value=10000.0
                )

            with col_b:
                tribunal = st.selectbox("Tribunal", ["TJAL", "TRT19", "JFAL", "STJ"])
                complexidade = st.slider("Complexidade", 1, 10, 5)

            submitted = st.form_submit_button("Calcular Probabilidade")

            if submitted:
                st.info("Modelo não treinado. Impossível realizar predição.")


if __name__ == "__main__":
    render()
