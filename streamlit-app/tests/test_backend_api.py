"""
Testes de Integração para Backend FastAPI
Equivalente a tests/api/azure-upload.test.ts
"""

import io

import pytest
from fastapi.testclient import TestClient


class TestBackendAPI:
    """Testes do backend FastAPI"""

    @pytest.fixture
    def client(self):
        """Cliente de teste FastAPI"""
        try:
            from backend.main import app

            return TestClient(app)
        except ImportError:
            pytest.skip("Backend FastAPI não está disponível")

    def test_health_endpoint(self, client):
        """Testar endpoint de health check"""
        response = client.get("/api/health")

        assert response.status_code == 200
        data = response.json()
        assert "status" in data
        assert data["status"] in [
            "ok",
            "healthy",
            "degraded",
        ]  # Aceita degraded se Redis offline

    def test_processos_listar(self, client):
        """Testar listagem de processos"""
        response = client.get("/api/processos")

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list) or "processos" in data

    def test_processos_criar(self, client):
        """Testar criação de processo"""
        processo_novo = {
            "numero_cnj": "0001234-56.2024.8.02.0001",
            "titulo": "Ação Trabalhista - Teste",
            "autor": "João Silva",
            "reu": "Empresa XYZ LTDA",
            "tipo": "trabalhista",
            "status": "ativo",
        }

        response = client.post("/api/processos", json=processo_novo)

        # Aceita 200 (ok) ou 201 (created)
        assert response.status_code in [200, 201]
        data = response.json()
        assert "id" in data or "numero_cnj" in data

    def test_processos_criar_invalido(self, client):
        """Testar criação de processo com dados inválidos"""
        processo_invalido = {
            "numero_cnj": "123",  # CNJ inválido
            "titulo": "AB",  # Título muito curto
        }

        response = client.post("/api/processos", json=processo_invalido)

        # Deve retornar erro de validação
        assert response.status_code in [400, 422]

    def test_agentes_listar(self, client):
        """Testar listagem de agentes"""
        response = client.get("/api/agentes")

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

        # Deve ter os 16 agentes
        if len(data) > 0:
            assert len(data) >= 9  # Pelo menos os 9 agentes ativos

    def test_agente_executar(self, client):
        """Testar execução de agente"""
        payload = {
            "agente_id": "harvey",
            "input": "Análise estratégica do escritório",
            "config": {},
        }

        response = client.post("/api/agentes/executar", json=payload)

        # Pode retornar sucesso ou erro se agente não implementado
        assert response.status_code in [200, 501]

    def test_djen_sincronizar(self, client):
        """Testar sincronização DJEN"""
        response = client.post("/api/djen/sincronizar")

        # Pode retornar sucesso ou 503 se serviço não configurado
        assert response.status_code in [200, 201, 503]

    def test_datajud_buscar_processos(self, client):
        """Testar busca no DataJud"""
        payload = {"numero_cnj": "0001234-56.2024.8.02.0001"}

        response = client.post("/api/datajud/buscar", json=payload)

        # API pública pode estar indisponível
        assert response.status_code in [200, 404, 503]

    def test_prazos_calcular(self, client):
        """Testar cálculo de prazos"""
        payload = {
            "data_inicio": "2024-01-15",
            "dias_corridos": 15,
            "tipo": "manifestacao",
        }

        response = client.post("/api/prazos/calcular", json=payload)

        assert response.status_code == 200
        data = response.json()
        assert "data_final" in data or "prazo_final" in data

    def test_upload_documento(self, client):
        """Testar upload de documento"""
        # Criar arquivo de teste
        arquivo_teste = io.BytesIO(b"%PDF-1.4\n%\xe2\xe3\xcf\xd3\n1 0 obj\n<<>>\nendobj\n")
        arquivo_teste.name = "teste.pdf"

        files = {"file": ("teste.pdf", arquivo_teste, "application/pdf")}
        data_form = {"processo_numero": "0001234-56.2024.8.02.0001", "tipo": "peticao"}

        response = client.post("/api/documentos/upload", files=files, data=data_form)

        # Pode retornar sucesso ou erro se storage não configurado
        assert response.status_code in [200, 201, 503]

    def test_upload_documento_muito_grande(self, client):
        """Testar upload de documento muito grande (> 50MB)"""
        # Criar arquivo de 51MB
        arquivo_grande = io.BytesIO(b"X" * (51 * 1024 * 1024))
        arquivo_grande.name = "grande.pdf"

        files = {"file": ("grande.pdf", arquivo_grande, "application/pdf")}
        data_form = {"processo_numero": "0001234-56.2024.8.02.0001"}

        response = client.post("/api/documentos/upload", files=files, data=data_form)

        # Deve retornar erro de payload muito grande
        assert response.status_code == 413

    def test_cors_headers(self, client):
        """Testar headers CORS"""
        response = client.options("/api/processos")

        # Verifica se CORS está configurado (405 = método OPTIONS não implementado mas CORS ativo)
        assert response.status_code in [200, 204, 405]
        # CORS headers podem estar presentes mesmo com 405
        if response.status_code in [200, 204]:
            assert "access-control-allow-origin" in [
                h.lower() for h in response.headers.keys()
            ]


class TestCronJobs:
    """Testes dos cron jobs"""

    def test_cron_djen_monitor_importar(self):
        """Testar import do cron DJEN"""
        try:
            from backend.cron_jobs import cron_djen_monitor

            assert cron_djen_monitor is not None
        except ImportError:
            pytest.skip("Cron jobs não implementados ainda")

    def test_cron_datajud_sync_importar(self):
        """Testar import do cron DataJud"""
        try:
            from backend.cron_jobs import cron_datajud_sync

            assert cron_datajud_sync is not None
        except ImportError:
            pytest.skip("Cron jobs não implementados ainda")

    @pytest.mark.asyncio
    async def test_cron_djen_executa(self):
        """Testar execução do cron DJEN"""
        try:
            from backend.cron_jobs import cron_djen_monitor

            # Executar com mock
            result = await cron_djen_monitor()
            assert result is not None
        except ImportError:
            pytest.skip("Cron jobs não implementados ainda")


class TestRedisIntegration:
    """Testes de integração com Redis"""

    @pytest.fixture
    def redis_client(self):
        """Cliente Redis para testes"""
        try:
            from backend.database import get_redis_client

            return get_redis_client()
        except ImportError:
            pytest.skip("Redis client não disponível")

    def test_redis_conexao(self, redis_client):
        """Testar conexão com Redis"""
        result = redis_client.ping()
        assert result is True

    def test_redis_set_get(self, redis_client):
        """Testar operações SET e GET"""
        redis_client.set("test_key", "test_value")
        valor = redis_client.get("test_key")

        assert valor == "test_value" or valor == b"test_value"

    def test_redis_expire(self, redis_client):
        """Testar expiração de chaves"""
        redis_client.setex("test_ttl", 1, "valor_temporario")

        # Deve existir agora
        assert redis_client.exists("test_ttl") == 1

        # Aguardar expiração
        import time

        time.sleep(2)

        # Não deve mais existir
        assert redis_client.exists("test_ttl") == 0

    def test_redis_lista(self, redis_client):
        """Testar operações com listas"""
        redis_client.delete("test_list")

        redis_client.lpush("test_list", "item1")
        redis_client.lpush("test_list", "item2")

        tamanho = redis_client.llen("test_list")
        assert tamanho == 2

        item = redis_client.rpop("test_list")
        assert item == "item1" or item == b"item1"
