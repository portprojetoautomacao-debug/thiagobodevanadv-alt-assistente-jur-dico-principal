"""
ASSISTENTE JURÍDICO PJE - STREAMLIT VERSION
===========================================

Versão Python do sistema jurídico com:
- Streamlit para UI
- Pandas para análise de dados
- scikit-learn para ML
- LangChain para orquestração de LLMs
- Selenium + PyAutoGUI para automação

Mantém compatibilidade total com backend React/Vercel.
"""

import sys
import subprocess
import time
import socket
from pathlib import Path

import streamlit as st

# Add lib to path
sys.path.append(str(Path(__file__).parent / "lib"))

from backend_client import BackendClient
from config import APP_CONFIG, load_config

# ============================================
# START BACKEND (Python Edition)
# ============================================

def is_port_open(host, port):
    """Verifica se a porta está aberta (backend rodando)."""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex((host, port)) == 0

def start_backend():
    """Inicia o backend FastAPI em um subprocesso."""
    if not is_port_open("127.0.0.1", 8000):
        print("🚀 Iniciando backend FastAPI...")
        script_path = Path(__file__).parent / "backend" / "main.py"
        
        # Inicia o processo em background
        subprocess.Popen(
            [sys.executable, str(script_path)],
            stdout=subprocess.DEVNULL, # Redireciona logs para não poluir
            stderr=subprocess.DEVNULL
        )
        
        # Aguarda inicialização
        with st.spinner("Iniciando servidor backend..."):
            for _ in range(10):
                if is_port_open("127.0.0.1", 8000):
                    print("✅ Backend iniciado com sucesso!")
                    return
                time.sleep(1)
            print("⚠️ Backend demorou para responder, mas pode estar iniciando.")

# Iniciar backend na inicialização
if "backend_started" not in st.session_state:
    start_backend()
    st.session_state["backend_started"] = True

# ============================================
# PAGE CONFIG
# ============================================
    # Aguardar inicialização
    time.sleep(3)

# ============================================
# PAGE CONFIG
# ============================================

st.set_page_config(
    page_title=APP_CONFIG["title"],
    page_icon=APP_CONFIG["icon"],
    layout=APP_CONFIG["layout"],
    initial_sidebar_state="expanded",
)

# ============================================
# CUSTOM CSS
# ============================================

st.markdown(
    """
<style>
    /* Tema Jurídico */
    :root {
        --primary-color: #1e40af;
        --secondary-color: #64748b;
        --success-color: #22c55e;
        --warning-color: #f59e0b;
        --danger-color: #ef4444;
    }

    /* Header customizado */
    .stApp header {
        background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
    }

    /* Cards com sombra */
    .stMetric {
        background: white;
        padding: 1rem;
        border-radius: 0.5rem;
        box-shadow: 0 1px 3px rgba(0,0,0,0.12);
    }

    /* Tabelas estilizadas */
    .dataframe {
        border-radius: 0.5rem;
        overflow: hidden;
    }
</style>
""",
    unsafe_allow_html=True,
)

# ============================================
# SIDEBAR HEADER
# ============================================

with st.sidebar:
    st.image("https://img.icons8.com/fluency/96/scales.png", width=80)
    st.title("⚖️ Assistente Jurídico")
    st.caption("Versão Python + Streamlit")

# ============================================
# NAVIGATION (AUTOMATIC MODE)
# ============================================

# Import dashboard directly for the main page
try:
    from pages.dashboard import render as render_dashboard

    render_dashboard()
except ImportError:
    st.info("👈 Selecione uma página no menu lateral para começar.")

# ============================================
# SIDEBAR FOOTER
# ============================================

with st.sidebar:
    st.divider()
    backend = BackendClient()

    with st.spinner("Verificando conexão..."):
        health = backend.check_health()

    if health["status"] == "ok":
        st.success("✅ Backend conectado")
        st.caption(f"API: {health['environment']}")
    else:
        st.error("❌ Backend offline")
        st.caption("Verifique REACT_API_URL")

# ============================================
# RUN NAVIGATION
# ============================================

# pg.run() # Disabled for automatic navigation

# ============================================
# FOOTER
# ============================================

st.divider()
col1, col2, col3 = st.columns(3)

with col1:
    st.caption("🐍 Python + Streamlit")
with col2:
    st.caption("⚖️ Direito Brasileiro")
with col3:
    st.caption("🤖 Powered by IA")
