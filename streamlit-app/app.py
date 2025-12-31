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

import atexit
import os
import socket
import subprocess
import sys
import threading
import time
from collections import deque
from pathlib import Path

import streamlit as st

# Add lib to path
sys.path.append(str(Path(__file__).parent / "lib"))

from backend_client import BackendClient
from config import APP_CONFIG, load_config

# ============================================
# PAGE CONFIG (MUST BE FIRST)
# ============================================
st.set_page_config(
    page_title=APP_CONFIG["title"],
    page_icon=APP_CONFIG["icon"],
    layout=APP_CONFIG["layout"],
)

# ============================================
# START BACKEND (Python Edition)
# ============================================


def is_port_open(host, port):
    """Verifica se a porta está aberta (backend rodando)."""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex((host, port)) == 0


def start_backend():
    """Inicia o backend FastAPI em um subprocesso."""
    # Se estiver configurado para usar backend remoto, não inicia local
    backend_url = APP_CONFIG.get("backend_url", "") or os.getenv("REACT_API_URL", "")
    if (
        backend_url
        and "localhost" not in backend_url
        and "127.0.0.1" not in backend_url
    ):
        print(f"ℹ️ Usando backend remoto: {backend_url}")
        return

    if not is_port_open("127.0.0.1", 8000):
        # Se já existe processo registrado e ainda está vivo, não reinicia
        existing = st.session_state.get("backend_process")
        if existing is not None and getattr(existing, "poll", lambda: 0)() is None:
            return
        
        print("🚀 Iniciando backend FastAPI...")
        script_path = Path(__file__).parent / "backend" / "main.py"

        # Inicia o processo em background
        process = subprocess.Popen(
            [sys.executable, str(script_path)],
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
        )

        log_buffer = deque(maxlen=200)

        def _drain_output(proc: subprocess.Popen):
            try:
                if proc.stdout is None:
                    return
                for line in proc.stdout:
                    log_buffer.append(line.rstrip("\n"))
            except Exception:
                return

        # Aguarda inicialização
        with st.spinner("Iniciando servidor backend..."):
            for _ in range(20):  # Aumentado para 20s
                # Verifica se o processo morreu
                if process.poll() is not None:
                    st.error(
                    bufsize=1,
                        f"❌ Erro fatal ao iniciar backend:\n\nSTDOUT:\n{stdout}\n\nSTDERR:\n{stderr}"

                st.session_state["backend_process"] = process

                t = threading.Thread(target=_drain_output, args=(process,), daemon=True)
                t.start()

                def _cleanup_backend():
                    try:
                        if process.poll() is None:
                            process.terminate()
                    except Exception:
                        pass

                atexit.register(_cleanup_backend)
                    )
                    return

                if is_port_open("127.0.0.1", 8000):
                    print("✅ Backend iniciado com sucesso!")
                    return
                            # Junta logs drenados + tentativa final de leitura
                            try:
                                remaining = process.communicate(timeout=1)[0] or ""
                            except Exception:
                                remaining = ""

                            buffered = "\n".join(list(log_buffer))
                            stdout = (buffered + ("\n" if buffered and remaining else "") + remaining).strip()

                                f"❌ Erro fatal ao iniciar backend:\n\nLOGS:\n{stdout}"
            st.warning("⚠️ Backend demorou para responder. Verifique os logs.")
            # Tenta ler o que já saiu
            try:
                outs, errs = process.communicate(timeout=1)
                if outs or errs:
                    st.code(f"Logs parciais:\n{outs}\n{errs}")
            except Exception:
                pass


                    # Exibe logs parciais capturados até aqui
                    buffered = "\n".join(list(log_buffer)).strip()
                    if buffered:
                        st.code(f"Logs parciais:\n{buffered}")
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

# Welcome message on main page
st.markdown(
    """
    # ⚖️ Bem-vindo ao Assistente Jurídico PJe
    
    Sistema 100% Python com **Streamlit + LangChain + FastAPI**
    
    ### 🚀 Funcionalidades
    
    - 📋 **Processos**: Gestão completa de processos judiciais
    - 📄 **Expedientes**: Análise automática de intimações
    - 🤖 **Agentes IA**: 16 agentes especializados
    - ⚙️ **Automações**: Integração com PJe e DJEN
    - 📊 **Dashboard**: Métricas e análises em tempo real
    - 📝 **Minutas**: Geração automática de petições
    
    ### 👈 Começar
    
    Selecione uma página no menu lateral para começar.
    """
)

# Show a metrics overview
col1, col2, col3 = st.columns(3)

with col1:
    st.metric(
        label="🤖 Agentes IA",
        value="16",
        help="Agentes especializados disponíveis"
    )

with col2:
    st.metric(
        label="📋 Módulos",
        value="7",
        help="Módulos principais do sistema"
    )

with col3:
    st.metric(
        label="⚡ Status",
        value="Online",
        delta="Operacional",
        help="Sistema operacional"
    )

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
