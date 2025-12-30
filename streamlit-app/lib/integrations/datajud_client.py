"""
Cliente DataJud - API Pública do CNJ
Acesso aos dados abertos do Poder Judiciário
"""

import logging
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

import requests

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class DataJudClient:
    """Cliente para API DataJud do CNJ."""

    def __init__(self):
        """Inicializa cliente DataJud."""
        self.base_url = "https://api-publica.datajud.cnj.jus.br/api_publica"
        self.session = requests.Session()
        self.session.headers.update(
            {
                "User-Agent": "Mozilla/5.0 (compatible; AssistenteJuridico/2.0)",
                "Accept": "application/json",
            }
        )

    def buscar_processos(
        self,
        numero_processo: Optional[str] = None,
        tribunal: Optional[str] = None,
        classe: Optional[str] = None,
        assunto: Optional[str] = None,
        data_inicio: Optional[str] = None,
        data_fim: Optional[str] = None,
        limit: int = 100,
    ) -> List[Dict[str, Any]]:
        """
        Busca processos na API DataJud.

        Args:
            numero_processo: Número CNJ do processo
            tribunal: Código do tribunal (ex: 'TRT2', 'TJSP')
            classe: Classe processual
            assunto: Assunto ou palavra-chave
            data_inicio: Data início (YYYY-MM-DD)
            data_fim: Data fim (YYYY-MM-DD)
            limit: Limite de resultados

        Returns:
            Lista de processos encontrados
        """
        try:
            endpoint = f"{self.base_url}/_search"

            # Construir query
            query = self._build_query(
                numero_processo=numero_processo,
                tribunal=tribunal,
                classe=classe,
                assunto=assunto,
                data_inicio=data_inicio,
                data_fim=data_fim,
                limit=limit,
            )

            logger.info(f"Buscando processos na API DataJud (limit={limit})")

            response = self.session.post(endpoint, json=query, timeout=30)
            response.raise_for_status()

            data = response.json()
            processos = data.get("hits", {}).get("hits", [])

            logger.info(f"Encontrados {len(processos)} processos")

            return [self._parse_processo(p.get("_source", {})) for p in processos]

        except requests.exceptions.RequestException as e:
            logger.error(f"Erro ao buscar processos: {e}")
            return []

    def _build_query(
        self,
        numero_processo: Optional[str],
        tribunal: Optional[str],
        classe: Optional[str],
        assunto: Optional[str],
        limit: int,
    ) -> Dict[str, Any]:
        """Constrói query para API."""
        query = {"size": limit, "query": {"bool": {"must": []}}}

        must_clauses = query["query"]["bool"]["must"]

        if numero_processo:
            must_clauses.append({"match": {"numeroProcesso": numero_processo}})

        if tribunal:
            must_clauses.append({"match": {"tribunal": tribunal}})

        if classe:
            must_clauses.append({"match": {"classe.nome": classe}})

        if assunto:
            must_clauses.append({"match": {"assuntos.nome": assunto}})

        return query

    def _parse_processo(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Parseia dados do processo."""
        return {
            "numero": data.get("numeroProcesso"),
            "tribunal": data.get("tribunal"),
            "classe": data.get("classe", {}).get("nome"),
            "assuntos": [a.get("nome") for a in data.get("assuntos", [])],
            "data_ajuizamento": data.get("dataAjuizamento"),
            "grau": data.get("grau"),
            "orgao_julgador": data.get("orgaoJulgador", {}).get("nome"),
        }

    def _parse_processo(self, raw_data: Dict[str, Any]) -> Dict[str, Any]:
        """Parseia dados do processo da API."""
        source = raw_data.get("_source", {})

        return {
            "id": raw_data.get("_id"),
            "numero": source.get("numeroProcesso"),
            "tribunal": source.get("tribunal"),
            "classe": source.get("classe", {}).get("nome"),
            "assunto": (
                source.get("assunto", [{}])[0].get("nome")
                if source.get("assunto")
                else None
            ),
            "data_ajuizamento": source.get("dataAjuizamento"),
            "valor_causa": source.get("valorCausa"),
            "orgao_julgador": source.get("orgaoJulgador", {}).get("nome"),
            "grau": source.get("grau"),
            "sistema": source.get("sistema"),
            "formato": source.get("formato"),
            "timestamp": datetime.now().isoformat(),
        }

    def buscar_movimentacoes(
        self, numero_processo: str, tribunal: str
    ) -> List[Dict[str, Any]]:
        """
        Busca movimentações de um processo específico.

        Args:
            numero_processo: Número CNJ do processo
            tribunal: Código do tribunal

        Returns:
            Lista de movimentações
        """
        try:
            endpoint = f"{self.base_url}/processos/{numero_processo}/movimentacoes"

            params = {"tribunal": tribunal}

            logger.info(f"Buscando movimentações do processo {numero_processo}")

            response = self.session.get(endpoint, params=params, timeout=30)
            response.raise_for_status()

            movimentacoes = response.json().get("movimentacoes", [])

            logger.info(f"Encontradas {len(movimentacoes)} movimentações")

            return [self._parse_movimentacao(m) for m in movimentacoes]

        except requests.exceptions.RequestException as e:
            logger.error(f"Erro ao buscar movimentações: {e}")
            return []

    def _parse_movimentacao(self, raw_data: Dict[str, Any]) -> Dict[str, Any]:
        """Parseia dados de movimentação."""
        return {
            "codigo": raw_data.get("codigo"),
            "nome": raw_data.get("nome"),
            "data": raw_data.get("data"),
            "complemento": raw_data.get("complemento"),
            "tipo": raw_data.get("tipo"),
            "timestamp": datetime.now().isoformat(),
        }

    def estatisticas_tribunal(self, tribunal: str, ano: int = None) -> Dict[str, Any]:
        """
        Obtém estatísticas de um tribunal.

        Args:
            tribunal: Código do tribunal
            ano: Ano (None = ano atual)

        Returns:
            Dicionário com estatísticas
        """
        if ano is None:
            ano = datetime.now().year

        try:
            endpoint = f"{self.base_url}/estatisticas/{tribunal}/{ano}"

            logger.info(f"Buscando estatísticas de {tribunal} - {ano}")

            response = self.session.get(endpoint, timeout=30)
            response.raise_for_status()

            stats = response.json()

            return {
                "tribunal": tribunal,
                "ano": ano,
                "total_processos": stats.get("totalProcessos", 0),
                "processos_novos": stats.get("processosNovos", 0),
                "processos_baixados": stats.get("processosBaixados", 0),
                "processos_pendentes": stats.get("processosPendentes", 0),
                "taxa_congestionamento": stats.get("taxaCongestionamento", 0),
                "timestamp": datetime.now().isoformat(),
            }

        except requests.exceptions.RequestException as e:
            logger.error(f"Erro ao buscar estatísticas: {e}")
            return {}

    def sincronizar_processos_escritorio(
        self, lista_numeros: List[str], tribunal: str
    ) -> Dict[str, Any]:
        """
        Sincroniza múltiplos processos do escritório.

        Args:
            lista_numeros: Lista de números CNJ
            tribunal: Código do tribunal

        Returns:
            Resultado da sincronização
        """
        logger.info(f"Sincronizando {len(lista_numeros)} processos...")

        resultados = {
            "total": len(lista_numeros),
            "sucesso": 0,
            "erro": 0,
            "processos": [],
        }

        for numero in lista_numeros:
            try:
                processos = self.buscar_processos(
                    numero_processo=numero, tribunal=tribunal, limit=1
                )

                if processos:
                    resultados["processos"].append(processos[0])
                    resultados["sucesso"] += 1
                else:
                    resultados["erro"] += 1
                    logger.warning(f"Processo não encontrado: {numero}")

            except Exception as e:
                resultados["erro"] += 1
                logger.error(f"Erro ao buscar {numero}: {e}")

        logger.info(
            f"Sincronização concluída: {resultados['sucesso']}/{resultados['total']}"
        )

        return resultados


# Exemplo de uso
if __name__ == "__main__":
    client = DataJudClient()

    # Buscar processos
    print("\n1. Buscando processos...")
    processos = client.buscar_processos(
        tribunal="TRT2", data_inicio="2025-01-01", limit=5
    )
    print(f"✅ Encontrados {len(processos)} processos")

    # Estatísticas
    print("\n2. Estatísticas do tribunal...")
    stats = client.estatisticas_tribunal("TRT2", 2025)
    if stats:
        print(f"✅ Total de processos: {stats.get('total_processos')}")

    # Sincronizar
    print("\n3. Sincronizando processos do escritório...")
    numeros = ["0001234-56.2025.5.02.0001", "0001235-56.2025.5.02.0001"]
    resultado = client.sincronizar_processos_escritorio(numeros, "TRT2")
    print(f"✅ Sincronizados: {resultado['sucesso']}/{resultado['total']}")
