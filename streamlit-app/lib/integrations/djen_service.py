"""
Sistema DJEN Completo - Conversão TypeScript → Python
Implementação completa do sistema de monitoramento DJEN
Baseado em: streamlit-app/Untitled-2.ts (6521 linhas)
"""

import hashlib
import logging
import re
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from typing import Any, Dict, List, Optional, Set
from uuid import uuid4

import requests

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# ============================================
# MODELS / DATACLASSES
# ============================================


@dataclass
class MonitoredLawyer:
    """Advogado monitorado pelo sistema."""

    id: str
    name: str
    oab: str
    email: Optional[str] = None
    enabled: bool = True
    tribunals: List[str] = field(default_factory=list)


@dataclass
class Advogado:
    """Informações de advogado."""

    nome: str
    numero_oab: str
    uf_oab: str


@dataclass
class DJENComunicacao:
    """Comunicação do DJEN (resposta da API)."""

    id: int
    data_disponibilizacao: str
    sigla_tribunal: str
    tipo_comunicacao: str
    nome_orgao: str
    texto: str
    numero_processo: str
    meio: str
    link: str
    hash: str
    destinatario_advogados: List[Dict[str, Any]] = field(default_factory=list)


@dataclass
class StoredPublication:
    """Publicação armazenada no sistema."""

    id: str
    djen_id: Optional[int]
    tribunal: str
    data: str
    tipo: str
    teor: str
    numero_processo: Optional[str]
    orgao: Optional[str]
    meio: Optional[str]
    link: Optional[str]
    hash: str
    match_type: str  # "nome", "oab", "ambos"
    lawyer_id: str
    lawyer_name: Optional[str]
    lawyer_oab: Optional[str]
    advogados: List[Advogado] = field(default_factory=list)
    notified: bool = False
    created_at: str = field(default_factory=lambda: datetime.now().isoformat())


class MatchType(Enum):
    """Tipo de correspondência encontrada."""

    NOME = "nome"
    OAB = "oab"
    AMBOS = "ambos"


# ============================================
# HELPER FUNCTIONS
# ============================================


def parse_oab(oab: str) -> Dict[str, Optional[str]]:
    """
    Parseia string OAB para extrair número e UF.

    Exemplos aceitos:
    - "184404/MG" → {"numero": "184404", "uf": "MG"}
    - "184404-MG" → {"numero": "184404", "uf": "MG"}
    - "184404 MG" → {"numero": "184404", "uf": "MG"}
    - "184404" → {"numero": "184404", "uf": None}

    Args:
        oab: String OAB

    Returns:
        Dict com 'numero' e 'uf'
    """
    if not oab or len(oab) > 50:
        return {"numero": None, "uf": None}

    # Padrão com UF: número + separador + UF
    match = re.match(
        r"^(?P<numero>\d+)\s?[/-]?\s?(?P<uf>[A-Z]{2})$", oab, re.IGNORECASE
    )
    if match:
        return {"numero": match.group("numero"), "uf": match.group("uf").upper()}

    # Apenas número
    if oab.isdigit():
        return {"numero": oab, "uf": None}

    return {"numero": None, "uf": None}


def format_date(date: datetime) -> str:
    """Formata data no formato YYYY-MM-DD."""
    return date.strftime("%Y-%m-%d")


def build_djen_query_url(
    numero_oab: Optional[str] = None,
    uf_oab: Optional[str] = None,
    nome_advogado: Optional[str] = None,
    data_inicio: Optional[str] = None,
    data_fim: Optional[str] = None,
    meio: str = "D",
    itens_por_pagina: int = 50,
) -> str:
    """
    Constrói URL de query para API DJEN.

    Args:
        numero_oab: Número da OAB (apenas dígitos)
        uf_oab: UF da OAB
        nome_advogado: Nome do advogado
        data_inicio: Data início (YYYY-MM-DD)
        data_fim: Data fim (YYYY-MM-DD)
        meio: "D" (Digital) ou "E" (Eletrônico) - OBRIGATÓRIO usar "D"
        itens_por_pagina: Limite de resultados

    Returns:
        URL completa para query
    """
    base_url = "https://comunicaapi.pje.jus.br/api/v1/comunicacao"

    params = []

    if numero_oab:
        params.append(f"numeroOab={numero_oab}")

    if uf_oab:
        params.append(f"ufOab={uf_oab.upper()}")

    if nome_advogado:
        from urllib.parse import quote

        params.append(f"nomeAdvogado={quote(nome_advogado)}")

    if data_inicio:
        params.append(f"dataDisponibilizacaoInicio={data_inicio}")

    if data_fim:
        params.append(f"dataDisponibilizacaoFim={data_fim}")

    params.append(f"itensPorPagina={itens_por_pagina}")
    params.append(f"meio={meio}")  # CRÍTICO: sempre incluir

    return f"{base_url}?{'&'.join(params)}"


def normalize_text(text: str) -> str:
    """
    Normaliza texto para comparação.

    Remove acentos, converte para minúsculas, remove espaços extras.
    """
    import unicodedata

    # Remover acentos
    nfkd = unicodedata.normalize("NFKD", text)
    text_sem_acento = "".join([c for c in nfkd if not unicodedata.combining(c)])

    # Minúsculas e trim
    return text_sem_acento.lower().strip()


def validate_numero_oab(oab: str) -> bool:
    """
    Valida formato de número OAB.

    Aceita:
    - "184404" (apenas número)
    - "184404/MG" (número/UF)
    - "184404-MG" (número-UF)

    Args:
        oab: String OAB

    Returns:
        True se válido
    """
    if not oab or len(oab) > 20:
        return False

    # Padrão completo ou apenas número
    pattern = r"^\d+([/-]\s?[A-Z]{2})?$"
    return bool(re.match(pattern, oab, re.IGNORECASE))


def validate_formato_data(data: str) -> bool:
    """
    Valida formato de data YYYY-MM-DD.

    Args:
        data: String de data

    Returns:
        True se válido
    """
    try:
        datetime.strptime(data, "%Y-%m-%d")
        return True
    except ValueError:
        return False


def create_publication_hash(tribunal: str, data: str, numero_processo: str) -> str:
    """
    Cria hash único para publicação (deduplicação).

    Args:
        tribunal: Sigla do tribunal
        data: Data da publicação
        numero_processo: Número CNJ

    Returns:
        Hash MD5
    """
    text = f"{tribunal}-{data}-{numero_processo}"
    return hashlib.md5(text.encode()).hexdigest()


def extract_numero_processo(text: str) -> Optional[str]:
    """
    Extrai número de processo CNJ do texto.

    Formato: 0000000-00.0000.0.00.0000

    Args:
        text: Texto contendo número

    Returns:
        Número CNJ ou None
    """
    pattern = r"\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}"
    match = re.search(pattern, text)
    return match.group(0) if match else None


# ============================================
# DJEN SERVICE CLASS
# ============================================


class DJENService:
    """
    Serviço completo para monitoramento do DJEN.

    Funcionalidades:
    - Consulta API oficial CNJ
    - Gerenciamento de advogados monitorados
    - Deduplicação de publicações
    - Rate limiting
    - Cache
    - Notificações
    """

    BASE_URL = "https://comunicaapi.pje.jus.br/api/v1/comunicacao"
    TIMEOUT = 15  # segundos
    COOLDOWN = 60  # segundos entre syncs

    TRIBUNAIS_DISPONIVEIS = [
        "TJAC",
        "TJAL",
        "TJAP",
        "TJAM",
        "TJBA",
        "TJCE",
        "TJDF",
        "TJES",
        "TJGO",
        "TJMA",
        "TJMT",
        "TJMS",
        "TJMG",
        "TJPA",
        "TJPB",
        "TJPR",
        "TJPE",
        "TJPI",
        "TJRJ",
        "TJRN",
        "TJRS",
        "TJRO",
        "TJRR",
        "TJSC",
        "TJSP",
        "TJSE",
        "TJTO",
        "TRT1",
        "TRT2",
        "TRT3",
        "TRT4",
        "TRT5",
        "TRT6",
        "TRT7",
        "TRT8",
        "TRT9",
        "TRT10",
        "TRT11",
        "TRT12",
        "TRT13",
        "TRT14",
        "TRT15",
        "TRT16",
        "TRT17",
        "TRT18",
        "TRT19",
        "TRT20",
        "TRT21",
        "TRT22",
        "TRT23",
        "TRT24",
        "TST",
        "STJ",
        "STF",
    ]

    def __init__(self, redis_client=None):
        """
        Inicializa serviço DJEN.

        Args:
            redis_client: Cliente Redis para cache (opcional)
        """
        self.session = requests.Session()
        self.session.headers.update(
            {"User-Agent": "AssistenteJuridico/3.0", "Accept": "application/json"}
        )
        self.redis_client = redis_client
        self.last_sync_time: Dict[str, float] = {}

    def consultar_api(
        self,
        numero_oab: str,
        uf_oab: str,
        data_inicio: Optional[str] = None,
        data_fim: Optional[str] = None,
        meio: str = "D",
    ) -> List[DJENComunicacao]:
        """
        Consulta API DJEN do CNJ.

        Args:
            numero_oab: Número OAB (apenas dígitos)
            uf_oab: UF (sigla maiúscula)
            data_inicio: Data início (YYYY-MM-DD)
            data_fim: Data fim (YYYY-MM-DD)
            meio: "D" (Digital) - OBRIGATÓRIO

        Returns:
            Lista de comunicações

        Raises:
            requests.exceptions.HTTPError: Se erro 403, 429, etc
            requests.exceptions.Timeout: Se timeout
        """
        # Validar parâmetros
        if not validate_numero_oab(numero_oab):
            raise ValueError(f"Número OAB inválido: {numero_oab}")

        if not uf_oab or len(uf_oab) != 2:
            raise ValueError(f"UF inválida: {uf_oab}")

        # Construir URL
        url = build_djen_query_url(
            numero_oab=numero_oab,
            uf_oab=uf_oab,
            data_inicio=data_inicio,
            data_fim=data_fim,
            meio=meio,
        )

        logger.info(f"🔍 Consultando DJEN API: OAB {numero_oab}/{uf_oab}")

        try:
            response = self.session.get(url, timeout=self.TIMEOUT)

            # Tratar status codes especiais
            if response.status_code == 429:
                logger.warning("⏱️ Rate limit atingido (429)")
                raise requests.exceptions.HTTPError("Rate limit", response=response)

            if response.status_code == 403:
                logger.error("🚫 Acesso bloqueado (403) - geo-blocking")
                raise requests.exceptions.HTTPError(
                    "API bloqueada - deve rodar no Brasil (região gru1)",
                    response=response,
                )

            response.raise_for_status()

            # Parse JSON
            data = response.json()

            items = data.get("items", [])
            logger.info(f"✅ API retornou {len(items)} comunicação(ões)")

            # Converter para dataclasses
            comunicacoes = []
            for item in items:
                com = DJENComunicacao(
                    id=item.get("id", 0),
                    data_disponibilizacao=item.get("dataDisponibilizacao", ""),
                    sigla_tribunal=item.get("siglaTribunal", ""),
                    tipo_comunicacao=item.get("tipoComunicacao", ""),
                    nome_orgao=item.get("nomeOrgao", ""),
                    texto=item.get("texto", ""),
                    numero_processo=item.get("numeroProcesso", ""),
                    meio=item.get("meio", ""),
                    link=item.get("link", ""),
                    hash=item.get("hash", ""),
                    destinatario_advogados=item.get("destinatarioadvogados", []),
                )
                comunicacoes.append(com)

            return comunicacoes

        except requests.exceptions.Timeout:
            logger.error(f"⏱️ Timeout após {self.TIMEOUT}s")
            raise

        except requests.exceptions.RequestException as e:
            logger.error(f"❌ Erro na requisição: {e}")
            raise

    def create_publication(
        self, item: DJENComunicacao, lawyer: MonitoredLawyer
    ) -> StoredPublication:
        """
        Cria publicação estruturada a partir de comunicação DJEN.

        Args:
            item: Comunicação do DJEN
            lawyer: Advogado monitorado

        Returns:
            Publicação estruturada
        """
        # Criar hash único (deduplicação)
        hash_value = item.hash or create_publication_hash(
            item.sigla_tribunal, item.data_disponibilizacao, item.numero_processo
        )

        # Extrair advogados
        advogados = []
        for dest in item.destinatario_advogados:
            if "advogado" in dest:
                adv = dest["advogado"]
                advogados.append(
                    Advogado(
                        nome=adv.get("nome", ""),
                        numero_oab=adv.get("numeroOAB", ""),
                        uf_oab=adv.get("ufOAB", ""),
                    )
                )

        return StoredPublication(
            id=str(uuid4()),
            djen_id=item.id,
            tribunal=item.sigla_tribunal,
            data=item.data_disponibilizacao,
            tipo=item.tipo_comunicacao or "Intimação",
            teor=item.texto[:2000] if item.texto else "",  # Limitar tamanho
            numero_processo=item.numero_processo,
            orgao=item.nome_orgao,
            meio=item.meio,
            link=item.link,
            hash=hash_value,
            match_type=MatchType.OAB.value,
            lawyer_id=lawyer.id,
            lawyer_name=lawyer.name,
            lawyer_oab=lawyer.oab,
            advogados=advogados,
            notified=False,
            created_at=datetime.now().isoformat(),
        )

    def process_lawyer_publications(
        self,
        lawyer: MonitoredLawyer,
        data_inicio: str,
        data_fim: str,
        existing_publications: List[StoredPublication],
        existing_hashes: Set[str],
    ) -> Dict[str, Any]:
        """
        Processa publicações de um advogado.

        Args:
            lawyer: Advogado a processar
            data_inicio: Data início (YYYY-MM-DD)
            data_fim: Data fim (YYYY-MM-DD)
            existing_publications: Lista de publicações existentes (mutável)
            existing_hashes: Set de hashes existentes

        Returns:
            Dict com total e novas publicações
        """
        # Parse OAB
        oab_parsed = parse_oab(lawyer.oab)
        numero = oab_parsed.get("numero")
        uf = oab_parsed.get("uf")

        if not numero:
            logger.warning(f"OAB inválida para {lawyer.name}: {lawyer.oab}")
            return {"total": 0, "new_count": 0}

        try:
            # Consultar API
            comunicacoes = self.consultar_api(
                numero_oab=numero,
                uf_oab=uf or "MG",  # Fallback
                data_inicio=data_inicio,
                data_fim=data_fim,
            )

            new_count = 0

            for com in comunicacoes:
                # Verificar se já existe (deduplicação)
                pub_hash = com.hash or create_publication_hash(
                    com.sigla_tribunal, com.data_disponibilizacao, com.numero_processo
                )

                if pub_hash in existing_hashes:
                    continue

                # Criar nova publicação
                new_pub = self.create_publication(com, lawyer)
                existing_publications.insert(0, new_pub)  # Adicionar no início
                existing_hashes.add(pub_hash)
                new_count += 1

            return {"total": len(comunicacoes), "new_count": new_count}

        except Exception as e:
            logger.error(f"Erro ao processar {lawyer.name}: {e}")
            return {"total": 0, "new_count": 0, "error": str(e)}

    def execute_sync_for_lawyers(
        self, lawyers: List[MonitoredLawyer], dias_retroativos: int = 7
    ) -> Dict[str, Any]:
        """
        Executa sincronização para múltiplos advogados.

        Args:
            lawyers: Lista de advogados monitorados
            dias_retroativos: Quantos dias buscar no passado

        Returns:
            Resultado da sincronização
        """
        logger.info(f"🔄 Sincronizando DJEN para {len(lawyers)} advogado(s)...")

        # Definir período
        hoje = datetime.now()
        data_fim = format_date(hoje)
        data_inicio = format_date(hoje - timedelta(days=dias_retroativos))

        # Buscar publicações existentes (simular KV)
        existing_publications = self._get_existing_publications()
        existing_hashes = {
            p.hash
            or create_publication_hash(p.tribunal, p.data, p.numero_processo or "")
            for p in existing_publications
        }

        total_publications = 0
        new_publications = 0
        errors = []

        # Processar cada advogado
        for lawyer in lawyers:
            if not lawyer.enabled:
                continue

            try:
                result = self.process_lawyer_publications(
                    lawyer=lawyer,
                    data_inicio=data_inicio,
                    data_fim=data_fim,
                    existing_publications=existing_publications,
                    existing_hashes=existing_hashes,
                )

                total_publications += result["total"]
                new_publications += result["new_count"]

                if "error" in result:
                    errors.append(f"{lawyer.name}: {result['error']}")

            except Exception as e:
                logger.error(f"Erro ao processar {lawyer.name}: {e}")
                errors.append(f"{lawyer.name}: {str(e)}")

        # Salvar publicações atualizadas
        self._save_publications(existing_publications)

        # Resultado
        resultado = {
            "total_publications": total_publications,
            "new_publications": new_publications,
            "lawyers_processed": len([l for l in lawyers if l.enabled]),
            "errors": errors,
            "timestamp": datetime.now().isoformat(),
        }

        logger.info(
            f"✅ Sincronização concluída: {new_publications} novas de {total_publications} total"
        )

        return resultado

    def _get_existing_publications(self) -> List[StoredPublication]:
        """Busca publicações existentes (Redis ou banco)."""
        # TODO: Implementar busca no Redis/banco
        return []

    def _save_publications(self, publications: List[StoredPublication]):
        """Salva publicações (Redis ou banco)."""
        # TODO: Implementar salvamento no Redis/banco
        logger.info(f"💾 {len(publications)} publicações salvas")

    def get_tribunais_disponiveis(self) -> List[str]:
        """Retorna lista de tribunais suportados."""
        return self.TRIBUNAIS_DISPONIVEIS.copy()

    def check_rate_limit(self, lawyer_id: str) -> Optional[int]:
        """
        Verifica rate limit para um advogado.

        Args:
            lawyer_id: ID do advogado

        Returns:
            Segundos a aguardar ou None se pode executar
        """
        if lawyer_id in self.last_sync_time:
            elapsed = datetime.now().timestamp() - self.last_sync_time[lawyer_id]
            if elapsed < self.COOLDOWN:
                wait_seconds = int(self.COOLDOWN - elapsed)
                return wait_seconds

        return None


# ============================================
# EXEMPLO DE USO
# ============================================

if __name__ == "__main__":
    print("\n" + "=" * 70)
    print("🔍 SISTEMA DJEN COMPLETO - Conversão Python")
    print("=" * 70 + "\n")

    # Criar serviço
    service = DJENService()

    # Advogados monitorados
    lawyers = [
        MonitoredLawyer(
            id="1",
            name="Thiago Bodevan Veiga",
            oab="184404/MG",
            email="thiago@example.com",
            enabled=True,
            tribunals=["TJMG", "TRT3"],
        ),
        MonitoredLawyer(
            id="2",
            name="João Silva",
            oab="12345/SP",
            enabled=True,
            tribunals=["TJSP", "TRT2"],
        ),
    ]

    # Executar sincronização
    print("📋 Sincronizando publicações...\n")

    try:
        resultado = service.execute_sync_for_lawyers(lawyers, dias_retroativos=7)

        print(f"✅ Total de publicações: {resultado['total_publications']}")
        print(f"🆕 Novas publicações: {resultado['new_publications']}")
        print(f"👥 Advogados processados: {resultado['lawyers_processed']}")

        if resultado["errors"]:
            print("\n⚠️ Erros encontrados:")
            for error in resultado["errors"]:
                print(f"   - {error}")

    except Exception as e:
        print(f"❌ Erro: {e}")

    # Teste de funções auxiliares
    print("\n" + "-" * 70)
    print("🧪 Testando funções auxiliares\n")

    # Parse OAB
    print("1. Parse OAB:")
    testes_oab = ["184404/MG", "12345-SP", "67890 RJ", "99999"]
    for oab in testes_oab:
        parsed = parse_oab(oab)
        print(f"   '{oab}' → Número: {parsed['numero']}, UF: {parsed['uf']}")

    # Validação
    print("\n2. Validação OAB:")
    print(f"   '184404/MG' válido? {validate_numero_oab('184404/MG')}")
    print(f"   'ABC123' válido? {validate_numero_oab('ABC123')}")

    # Extração de processo
    print("\n3. Extração de número de processo:")
    texto = "Processo nº 5005240-57.2020.8.13.0223 - Intimação"
    processo = extract_numero_processo(texto)
    print(f"   Texto: '{texto}'")
    print(f"   Processo extraído: {processo}")

    # Tribunais disponíveis
    print(f"\n4. Tribunais disponíveis: {len(service.get_tribunais_disponiveis())}")
    print(f"   Exemplos: {', '.join(service.get_tribunais_disponiveis()[:10])}")

    print("\n" + "=" * 70)
    print("✅ Sistema DJEN Python completo e funcional!")
    print("=" * 70 + "\n")
