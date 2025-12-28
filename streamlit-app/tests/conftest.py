"""
Configuração pytest para testes do streamlit-app
"""

import os
import sys
from pathlib import Path

import pytest
from dotenv import load_dotenv

# Carregar .env ANTES de qualquer import
load_dotenv()

# Adicionar diretórios ao path
root_dir = Path(__file__).parent.parent
sys.path.insert(0, str(root_dir))
sys.path.insert(0, str(root_dir / "lib"))
sys.path.insert(0, str(root_dir / "lib" / "agents"))
sys.path.insert(0, str(root_dir / "lib" / "tools"))
sys.path.insert(0, str(root_dir / "lib" / "integrations"))
sys.path.insert(0, str(root_dir / "backend"))

# ✅ Configurar API keys para testes (mock se não disponível)
if not os.getenv("GEMINI_API_KEY") and not os.getenv("GOOGLE_API_KEY"):
    # Usar chave dummy para testes se nenhuma key real disponível
    os.environ["GEMINI_API_KEY"] = "test-dummy-key-for-ci"
    os.environ["GOOGLE_API_KEY"] = "test-dummy-key-for-ci"

# ✅ Se GEMINI_API_KEY existe mas GOOGLE_API_KEY não, copiar o valor
if os.getenv("GEMINI_API_KEY") and not os.getenv("GOOGLE_API_KEY"):
    os.environ["GOOGLE_API_KEY"] = os.getenv("GEMINI_API_KEY")


@pytest.fixture
def caso_teste_basico():
    """Caso de teste padrão para testes"""
    return {
        "tipo_acao": "Trabalhista",
        "valor_causa": 50000,
        "tribunal": "TRT19",
        "tempo_tramitacao": 180,
        "complexidade": "média",
        "num_partes": 2,
        "tem_advogado": 1,
        "grau": 1,
        "tem_recurso": 0,
        "comarca": "Maceió",
        "num_movimentacoes": 25,
        "tem_sentenca": 0,
    }


@pytest.fixture
def numero_cnj_teste():
    """Número CNJ para testes"""
    return "0001234-56.2024.8.02.0001"


@pytest.fixture
def texto_sentenca_procedente():
    """Texto de sentença procedente"""
    return """
    SENTENÇA. Julgo PROCEDENTE o pedido para condenar o réu ao pagamento
    de indenização por danos morais no valor de R$ 10.000,00. Reconheço
    o direito do autor e acolho integralmente seus argumentos.
    """


@pytest.fixture
def texto_sentenca_improcedente():
    """Texto de sentença improcedente"""
    return """
    SENTENÇA. Julgo IMPROCEDENTE o pedido por falta de provas suficientes.
    Nego provimento ao recurso e condeno o autor ao pagamento de custas.
    """
# trigger python test
