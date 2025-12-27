#!/bin/bash

# Ativar ambiente virtual
source venv/bin/activate

# Executar Streamlit
echo "🚀 Iniciando Assistente Jurídico - Streamlit..."
echo ""
streamlit run app.py --server.port=8501 --server.address=0.0.0.0
