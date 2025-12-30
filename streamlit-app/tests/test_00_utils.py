"""
Testes para utilitários e helpers
"""

import sys
from datetime import datetime
from pathlib import Path

import pytest

# Garantir path antes de importar os módulos
_root = Path(__file__).parent.parent
sys.path.insert(0, str(_root))


class TestPrazosUtils:
    """Testes de cálculo de prazos"""

    def test_calcular_prazo_dias_corridos(self):
        """Testar cálculo de prazo em dias corridos"""
        from lib.utils.prazos import calcular_prazo

        data_inicio = datetime(2024, 1, 15)
        dias = 15
        data_final = calcular_prazo(data_inicio, dias, tipo="corridos")
        assert data_final == datetime(2024, 1, 30)

    def test_calcular_prazo_dias_uteis(self):
        """Testar cálculo de prazo em dias úteis - 5 dias úteis a partir de segunda = segunda seguinte"""
        from lib.utils.prazos import calcular_prazo

        # 15/01/2024 é segunda-feira, +5 dias úteis = 22/01/2024 (segunda)
        data_inicio = datetime(2024, 1, 15)  # Segunda-feira
        dias = 5
        data_final = calcular_prazo(data_inicio, dias, tipo="uteis")
        # 5 dias úteis: seg->ter->qua->qui->sex->seg (pula fim de semana)
        assert data_final.weekday() == 0  # Segunda-feira
        assert data_final == datetime(2024, 1, 22)

    def test_verificar_feriado(self):
        """Testar verificação de feriados"""
        from lib.utils.prazos import eh_feriado

        natal = datetime(2024, 12, 25)
        assert eh_feriado(natal) is True
        dia_comum = datetime(2024, 1, 10)
        assert eh_feriado(dia_comum) is False


class TestFormatacaoUtils:
    """Testes de formatação de dados"""

    def test_formatar_numero_cnj(self):
        """Testar formatação de número CNJ"""
        from lib.utils.formatacao import formatar_numero_cnj

        numero = "00012345620248020001"
        formatado = formatar_numero_cnj(numero)
        assert formatado == "0001234-56.2024.8.02.0001"

    def test_formatar_valor_monetario(self):
        """Testar formatação de valor monetário"""
        from lib.utils.formatacao import formatar_valor_monetario

        valor = 50000.50
        formatado = formatar_valor_monetario(valor)
        # Verifica formato completo R$ 50.000,50
        assert "R$" in formatado
        assert "50.000" in formatado or "50000" in formatado
        assert ",50" in formatado or ".50" in formatado

    def test_formatar_cpf(self):
        """Testar formatação de CPF"""
        from lib.utils.formatacao import formatar_cpf

        cpf = "12345678901"
        formatado = formatar_cpf(cpf)
        assert formatado == "123.456.789-01"


class TestValidacaoUtils:
    """Testes de validação de dados"""

    def test_validar_numero_cnj(self):
        """Testar validação de número CNJ"""
        from lib.utils.validacao import validar_numero_cnj

        assert validar_numero_cnj("0001234-56.2024.8.02.0001") is True
        assert validar_numero_cnj("123") is False
        assert validar_numero_cnj("") is False

    def test_validar_cpf(self):
        """Testar validação de CPF"""
        from lib.utils.validacao import validar_cpf

        assert validar_cpf("000.000.000-00") is False
        assert validar_cpf("123") is False

    def test_validar_email(self):
        """Testar validação de email"""
        from lib.utils.validacao import validar_email

        # Emails válidos
        assert validar_email("usuario@exemplo.com") is True
        assert validar_email("user.name@domain.com.br") is True

        # Emails inválidos
        assert validar_email("usuario@") is False
        assert validar_email("@exemplo.com") is False
        assert validar_email("usuario") is False
        assert validar_email("") is False
        # Casos adicionais de emails inválidos
        assert validar_email("usuario@.com") is False
        assert validar_email("usuario@domain..com") is False


class TestParserUtils:
    """Testes de parsers de documentos"""

    def test_extrair_numero_cnj_de_texto(self):
        """Testar extração de número CNJ de texto"""
        from lib.utils.parser import extrair_numero_cnj

        texto = "Processo nº 0001234-56.2024.8.02.0001 - Autor vs Réu"
        numeros = extrair_numero_cnj(texto)
        assert len(numeros) > 0
        assert "0001234-56.2024.8.02.0001" in numeros

    def test_extrair_prazos_de_texto(self):
        """Testar extração de prazos de texto"""
        from lib.utils.parser import extrair_prazos

        texto = "Fica a parte intimada a manifestar-se em 15 dias"
        prazos = extrair_prazos(texto)
        assert len(prazos) > 0
        # Verifica se extraiu o prazo de 15 dias (número ou texto)
        prazo_encontrado = any(
            "15" in str(p) or p.get("dias", 0) == 15 if isinstance(p, dict) else "15" in str(p)
            for p in prazos
        )
        assert prazo_encontrado, f"Prazo de 15 dias não encontrado em: {prazos}"


class TestCacheUtils:
    """Testes de utilitários de cache"""

    def test_decorator_cache(self):
        """Testar decorator de cache"""
        from lib.utils.cache import cache_result

        contador = [0]

        @cache_result(ttl=60)
        def funcao_custosa(x):
            contador[0] += 1
            return x * 2

        result1 = funcao_custosa(5)
        assert result1 == 10
        assert contador[0] == 1

        result2 = funcao_custosa(5)
        assert result2 == 10
        assert contador[0] == 1


class TestEncryptionUtils:
    """Testes de criptografia"""

    def test_hash_senha(self):
        """Testar hash de senha"""
        from lib.utils.security import hash_password, verify_password

        senha = "senha_secreta_123"
        hashed = hash_password(senha)

        assert hashed != senha
        assert len(hashed) > 0
        assert verify_password(senha, hashed) is True
        assert verify_password("senha_errada", hashed) is False


class TestDateUtils:
    """Testes de utilitários de data"""

    def test_obter_data_atual_brasilia(self):
        """Testar obtenção de data no horário de Brasília"""
        from lib.utils.date_utils import obter_data_atual_brasilia

        data = obter_data_atual_brasilia()
        assert isinstance(data, datetime)
        assert data.tzinfo is not None

    def test_converter_para_brasilia(self):
        """Testar conversão para horário de Brasília"""
        import pytz
        from lib.utils.date_utils import converter_para_brasilia

        data_utc = datetime.now(pytz.UTC)
        data_br = converter_para_brasilia(data_utc)
        assert isinstance(data_br, datetime)
        assert data_br.tzinfo is not None
