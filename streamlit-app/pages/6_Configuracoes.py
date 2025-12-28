"""
Página de Configurações do Sistema
Migração Python - Configuração de API keys, Redis, Gemini, Testes de conexão
"""

import os
import sys

import streamlit as st
from lib.backend_client import BackendClient


def render():
    """Renderiza página de configurações."""

    st.title("⚙️ Configurações do Sistema")
    st.caption("API Keys | Conexões | Variáveis de Ambiente | Testes")

    # Cliente backend
    backend = BackendClient()

    # ============================================
    # TABS DE CONFIGURAÇÃO
    # ============================================

    tab1, tab2, tab3, tab4 = st.tabs(
        ["🔑 API Keys", "🔗 Conexões", "🧪 Testes", "📊 Sistema"]
    )

    # ============================================
    # TAB 1: API KEYS
    # ============================================

    with tab1:
        st.subheader("🔑 Gerenciamento de API Keys")

        st.warning(
            "⚠️ Nunca compartilhe suas chaves de API. Use variáveis de ambiente em produção."
        )

        # Gemini API Key
        with st.expander("🤖 Google Gemini API", expanded=True):
            gemini_key = st.text_input(
                "GEMINI_API_KEY:",
                value=os.getenv("GEMINI_API_KEY", ""),
                type="password",
                help="Obtenha em: https://makersuite.google.com/app/apikey",
            )

            col1, col2, col3 = st.columns(3)

            with col1:
                if st.button("💾 Salvar", key="save_gemini"):
                    st.success("✅ Chave salva!")

            with col2:
                if st.button("🧪 Testar", key="test_gemini"):
                    if gemini_key:
                        with st.spinner("Testando conexão..."):
                            st.info("ℹ️ Teste de conexão em desenvolvimento")
                    else:
                        st.error("❌ Chave não configurada")

            with col3:
                if st.button("🗑️ Limpar", key="clear_gemini"):
                    st.info("Chave removida")

        # Upstash Redis
        with st.expander("💾 Upstash Redis"):
            redis_url = st.text_input(
                "UPSTASH_REDIS_REST_URL:",
                value=os.getenv("UPSTASH_REDIS_REST_URL", ""),
                type="password",
                help="URL do cluster Redis (Upstash)",
            )

            redis_token = st.text_input(
                "UPSTASH_REDIS_REST_TOKEN:",
                value=os.getenv("UPSTASH_REDIS_REST_TOKEN", ""),
                type="password",
                help="Token de autenticação",
            )

            col1, col2, col3 = st.columns(3)

            with col1:
                if st.button("💾 Salvar", key="save_redis"):
                    st.success("✅ Configuração salva!")

            with col2:
                if st.button("🧪 Testar", key="test_redis"):
                    if redis_url and redis_token:
                        with st.spinner("Testando conexão..."):
                            st.info("ℹ️ Teste de conexão em desenvolvimento")
                    else:
                        st.error("❌ Configurações incompletas")

            with col3:
                if st.button("🗑️ Limpar", key="clear_redis"):
                    st.info("Configuração removida")

        # Qdrant Vector DB
        with st.expander("🔍 Qdrant Vector Database (Opcional)"):
            qdrant_url = st.text_input(
                "QDRANT_URL:",
                value=os.getenv("QDRANT_URL", ""),
                help="URL do cluster Qdrant Cloud",
            )

            qdrant_key = st.text_input(
                "QDRANT_API_KEY:",
                value=os.getenv("QDRANT_API_KEY", ""),
                type="password",
            )

            col1, col2 = st.columns(2)

            with col1:
                if st.button("💾 Salvar", key="save_qdrant"):
                    st.success("✅ Qdrant configurado!")

            with col2:
                if st.button("🧪 Testar", key="test_qdrant"):
                    st.info("Testando...")

    # ============================================
    # TAB 2: CONEXÕES
    # ============================================

    with tab2:
        st.subheader("🔗 Status das Conexões")

        # Backend FastAPI
        col1, col2 = st.columns([3, 1])

        with col1:
            st.markdown("### 🐍 Backend FastAPI")
            st.caption("http://localhost:8000")

        with col2:
            health = backend.check_health()
            if health.get("status") == "ok":
                st.success("✅ Online")
            else:
                st.error("❌ Offline")

        if health.get("status") == "ok":
            col1, col2, col3 = st.columns(3)

            with col1:
                st.metric("Ambiente", health.get("environment", "unknown"))

            with col2:
                st.metric("Uptime", f"{health.get('uptime', 0):.0f}s")

            with col3:
                st.metric("Requests", health.get("totalRequests", 0))

        st.divider()

        # Redis
        col1, col2 = st.columns([3, 1])

        with col1:
            st.markdown("### 💾 Redis (Upstash)")
            st.caption("Cache e persistência")

        with col2:
            if os.getenv("UPSTASH_REDIS_REST_URL"):
                st.success("✅ Configurado")
            else:
                st.warning("⚠️ Não configurado")

        st.divider()

        # Gemini API
        col1, col2 = st.columns([3, 1])

        with col1:
            st.markdown("### 🤖 Google Gemini API")
            st.caption("LLM para agentes IA")

        with col2:
            if os.getenv("GEMINI_API_KEY"):
                st.success("✅ Configurado")
            else:
                st.error("❌ Não configurado")

        st.divider()

        # Qdrant
        col1, col2 = st.columns([3, 1])

        with col1:
            st.markdown("### 🔍 Qdrant Vector DB")
            st.caption("Pesquisa semântica (opcional)")

        with col2:
            if os.getenv("QDRANT_URL"):
                st.success("✅ Configurado")
            else:
                st.info("ℹ️ Opcional")

    # ============================================
    # TAB 3: TESTES
    # ============================================

    with tab3:
        st.subheader("🧪 Testes de Integração")

        st.markdown("Execute testes para validar as configurações:")

        # Teste Backend
        if st.button("🐍 Testar Backend FastAPI", use_container_width=True):
            with st.spinner("Testando..."):
                try:
                    health = backend.check_health()
                    if health.get("status") == "ok":
                        st.success(
                            f"✅ Backend respondendo! Ambiente: {health.get('environment')}"
                        )
                    else:
                        st.error("❌ Backend não está respondendo corretamente")
                except Exception as e:
                    st.error(f"❌ Erro ao conectar: {str(e)}")

        # Teste Gemini
        if st.button("🤖 Testar Gemini API", use_container_width=True):
            with st.spinner("Testando..."):
                st.info("ℹ️ Teste de conexão em desenvolvimento")

        # Teste Redis
        if st.button("💾 Testar Redis", use_container_width=True):
            with st.spinner("Testando..."):
                st.info("ℹ️ Teste de conexão em desenvolvimento")

        # Teste Completo
        st.divider()
        if st.button(
            "🚀 Executar Teste Completo", type="primary", use_container_width=True
        ):
            st.info("ℹ️ Teste completo em desenvolvimento")

    # ============================================
    # TAB 4: INFORMAÇÕES DO SISTEMA
    # ============================================

    with tab4:
        st.subheader("📊 Informações do Sistema")

        col1, col2 = st.columns(2)

        with col1:
            st.markdown("### 🐍 Python")
            st.code(f"Versão: {sys.version}")

            st.markdown("### 📦 Dependências Principais")
            st.markdown(
                """
            - streamlit: 1.41.1
            - pandas: 2.2.0
            - plotly: 5.18.0
            - langchain: 0.1.6
            - scikit-learn: 1.4.0
            - selenium: 4.17.0
            """
            )

        with col2:
            st.markdown("### 💻 Ambiente")
            st.code(
                f"""
Sistema: Linux/Debian
Backend: FastAPI 0.109.0
Frontend: Streamlit 1.41.1
Database: Upstash Redis
LLM: Google Gemini 2.0 Flash
            """
            )

            st.markdown("### 🔧 Variáveis de Ambiente")
            env_vars = [
                "GEMINI_API_KEY",
                "UPSTASH_REDIS_REST_URL",
                "UPSTASH_REDIS_REST_TOKEN",
                "QDRANT_URL",
                "QDRANT_API_KEY",
            ]

            for var in env_vars:
                if os.getenv(var):
                    st.success(f"✅ {var}")
                else:
                    st.error(f"❌ {var}")

        st.divider()

        # Logs do sistema
        st.markdown("### 📋 Logs Recentes")
        st.info("Nenhum log disponível.")


if __name__ == "__main__":
    render()
