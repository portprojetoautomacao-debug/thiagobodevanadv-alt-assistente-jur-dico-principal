"""
Configuração pytest para streamlit-app (nível raiz)
"""

import os
import sys
from pathlib import Path

# Garantir que o diretório atual está no path ANTES de qualquer coleta de testes
root_dir = Path(__file__).parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))
