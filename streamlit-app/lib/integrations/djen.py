"""
DJEN Scraper - Diário de Justiça Eletrônico Nacional
Scraping automatizado de publicações do DJEN usando Selenium
"""

import logging
import os
from datetime import datetime
from typing import Dict, List, Optional

from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait
from webdriver_manager.chrome import ChromeDriverManager

logger = logging.getLogger(__name__)

# Constantes
INPUT_SEARCH_SELECTOR = "input[type='search']"
NENHUM_RESULTADO = "⚠️ Nenhum resultado encontrado"


class DJENScraper:
    """
    Scraper para Diário de Justiça Eletrônico Nacional

    Funcionalidades:
    - Busca por número OAB
    - Busca por número CNJ
    - Busca por palavras-chave
    - Extração de publicações e intimações
    - Detecção automática de prazos
    """

    DJEN_URL = "https://www.in.gov.br/consulta"
    TIMEOUT = 10  # segundos

    def __init__(self, headless: bool = True):
        """
        Inicializar scraper

        Args:
            headless: Rodar browser em modo headless (sem GUI)
        """
        self.headless = headless
        self.driver = None
        self.wait = None

    def _init_driver(self):
        """Inicializar WebDriver Chrome"""
        try:
            options = Options()

            if self.headless:
                options.add_argument("--headless")

            # Opções de segurança e performance
            options.add_argument("--no-sandbox")
            options.add_argument("--disable-dev-shm-usage")
            options.add_argument("--disable-gpu")
            options.add_argument("--window-size=1920,1080")
            options.add_argument("--disable-blink-features=AutomationControlled")
            options.add_experimental_option("excludeSwitches", ["enable-automation"])
            options.add_experimental_option("useAutomationExtension", False)

            # User agent real
            options.add_argument(
                "user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            )

            service = Service(ChromeDriverManager().install())
            self.driver = webdriver.Chrome(service=service, options=options)
            self.wait = WebDriverWait(self.driver, self.TIMEOUT)

            logger.info("✅ WebDriver Chrome inicializado")

        except Exception as e:
            logger.error(f"❌ Erro ao inicializar WebDriver: {str(e)}")
            raise

    def _close_driver(self):
        """Fechar WebDriver"""
        if self.driver:
            try:
                self.driver.quit()
                logger.info("✅ WebDriver fechado")
            except Exception:
                pass

    def buscar_por_oab(self, numero_oab: str, uf: str = "AL") -> List[Dict]:
        """
        Buscar publicações por número OAB

        Args:
            numero_oab: Número da OAB (ex: "12345")
            uf: UF da OAB (ex: "AL")

        Returns:
            Lista de publicações encontradas
        """
        try:
            logger.info(f"🔍 Buscando OAB {numero_oab}/{uf} no DJEN")

            self._init_driver()
            self.driver.get(self.DJEN_URL)

            # Aguardar página carregar
            self.wait.until(EC.presence_of_element_located((By.TAG_NAME, "body")))

            # Buscar campo de pesquisa (ajustar seletores conforme site real)
            try:
                campo_busca = self.wait.until(
                    EC.presence_of_element_located((By.NAME, "q"))
                )
            except Exception:
                # Fallback: tentar outros seletores comuns
                campo_busca = self.driver.find_element(
                    By.CSS_SELECTOR, INPUT_SEARCH_SELECTOR
                )

            # Preencher busca
            termo_busca = f"OAB {uf} {numero_oab}"
            campo_busca.clear()
            campo_busca.send_keys(termo_busca)

            # Submit form
            campo_busca.submit()

            # Aguardar resultados
            try:
                self.wait.until(
                    EC.presence_of_element_located((By.CLASS_NAME, "resultado"))
                )
            except Exception:
                logger.warning(NENHUM_RESULTADO)
                return []

            # Extrair publicações
            publicacoes = self._extrair_publicacoes()

            logger.info(f"✅ {len(publicacoes)} publicações encontradas")
            return publicacoes

        except Exception as e:
            logger.error(f"❌ Erro ao buscar DJEN: {str(e)}")
            return []

        finally:
            self._close_driver()

    def buscar_por_cnj(self, numero_cnj: str) -> List[Dict]:
        """
        Buscar publicações por número CNJ

        Args:
            numero_cnj: Número CNJ completo (ex: "0001234-56.2024.8.02.0001")

        Returns:
            Lista de publicações encontradas
        """
        try:
            logger.info(f"🔍 Buscando CNJ {numero_cnj} no DJEN")

            self._init_driver()
            self.driver.get(self.DJEN_URL)

            # Aguardar página carregar
            self.wait.until(EC.presence_of_element_located((By.TAG_NAME, "body")))

            # Buscar campo de pesquisa
            try:
                campo_busca = self.wait.until(
                    EC.presence_of_element_located((By.NAME, "q"))
                )
            except Exception:
                campo_busca = self.driver.find_element(
                    By.CSS_SELECTOR, INPUT_SEARCH_SELECTOR
                )

            # Preencher busca
            campo_busca.clear()
            campo_busca.send_keys(numero_cnj)
            campo_busca.submit()

            # Aguardar resultados
            try:
                self.wait.until(
                    EC.presence_of_element_located((By.CLASS_NAME, "resultado"))
                )
            except Exception:
                logger.warning(NENHUM_RESULTADO)
                return []

            # Extrair publicações
            publicacoes = self._extrair_publicacoes()

            logger.info(f"✅ {len(publicacoes)} publicações encontradas")
            return publicacoes

        except Exception as e:
            logger.error(f"❌ Erro ao buscar DJEN: {str(e)}")
            return []

        finally:
            self._close_driver()

    def buscar_por_palavras_chave(
        self,
        palavras_chave: str,
        data_inicio: Optional[str] = None,
        data_fim: Optional[str] = None,
    ) -> List[Dict]:
        """
        Buscar publicações por palavras-chave

        Args:
            palavras_chave: Termos de busca
            data_inicio: Data inicial (formato: YYYY-MM-DD)
            data_fim: Data final (formato: YYYY-MM-DD)

        Returns:
            Lista de publicações encontradas
        """
        try:
            logger.info(f"🔍 Buscando '{palavras_chave}' no DJEN")

            self._init_driver()
            self.driver.get(self.DJEN_URL)

            # Aguardar página carregar
            self.wait.until(EC.presence_of_element_located((By.TAG_NAME, "body")))

            # Buscar campo de pesquisa
            try:
                campo_busca = self.wait.until(
                    EC.presence_of_element_located((By.NAME, "q"))
                )
            except Exception:
                campo_busca = self.driver.find_element(
                    By.CSS_SELECTOR, INPUT_SEARCH_SELECTOR
                )

            # Preencher busca
            campo_busca.clear()
            campo_busca.send_keys(palavras_chave)

            # TODO: Implementar filtro de datas se disponível

            campo_busca.submit()

            # Aguardar resultados
            try:
                self.wait.until(
                    EC.presence_of_element_located((By.CLASS_NAME, "resultado"))
                )
            except Exception:
                logger.warning(NENHUM_RESULTADO)
                return []

            # Extrair publicações
            publicacoes = self._extrair_publicacoes()

            logger.info(f"✅ {len(publicacoes)} publicações encontradas")
            return publicacoes

        except Exception as e:
            logger.error(f"❌ Erro ao buscar DJEN: {str(e)}")
            return []

        finally:
            self._close_driver()

    def _extrair_publicacoes(self) -> List[Dict]:
        """
        Extrair dados das publicações da página de resultados

        Returns:
            Lista de dicionários com dados das publicações
        """
        publicacoes = []

        try:
            # Buscar elementos de resultado (ajustar seletores conforme site real)
            elementos = self.driver.find_elements(By.CLASS_NAME, "resultado")

            if not elementos:
                # Tentar seletores alternativos
                elementos = self.driver.find_elements(
                    By.CSS_SELECTOR, "[class*='result']"
                )

            for elemento in elementos:
                try:
                    publicacao = self._extrair_dados_elemento(elemento)
                    if publicacao:
                        publicacoes.append(publicacao)
                except Exception as e:
                    logger.warning(f"⚠️ Erro ao extrair elemento: {str(e)}")
                    continue

        except Exception as e:
            logger.error(f"❌ Erro ao extrair publicações: {str(e)}")

        return publicacoes

    def _extrair_dados_elemento(self, elemento) -> Optional[Dict]:
        """
        Extrair dados de um elemento de publicação

        Args:
            elemento: WebElement do Selenium

        Returns:
            Dicionário com dados da publicação ou None
        """
        try:
            # Extrair texto completo
            texto_completo = elemento.text.strip()

            if not texto_completo:
                return None

            # Extrair data (tentar vários formatos)
            data = self._extrair_data(elemento)

            # Extrair órgão
            orgao = self._extrair_orgao(elemento)

            # Extrair URL se houver
            try:
                link = elemento.find_element(By.TAG_NAME, "a")
                url = link.get_attribute("href")
            except Exception:
                url = None

            # Detectar tipo de publicação
            tipo = self._detectar_tipo_publicacao(texto_completo)

            # Detectar se é intimação
            is_intimacao = any(
                palavra in texto_completo.lower()
                for palavra in [
                    "intimação",
                    "intimacao",
                    "intimar",
                    "citação",
                    "citacao",
                ]
            )

            # Detectar prazo se houver
            prazo = self._detectar_prazo(texto_completo) if is_intimacao else None

            publicacao = {
                "id": f"djen_{datetime.now().timestamp()}",
                "source": "DJEN",
                "data": data,
                "orgao": orgao,
                "texto": texto_completo,
                "url": url,
                "tipo": tipo,
                "is_intimacao": is_intimacao,
                "prazo": prazo,
                "urgente": prazo and prazo.get("dias", 999) <= 2 if prazo else False,
                "lido": False,
                "processado": False,
                "created_at": datetime.now().isoformat(),
            }

            return publicacao

        except Exception as e:
            logger.warning(f"⚠️ Erro ao extrair dados do elemento: {str(e)}")
            return None

    def _extrair_data(self, elemento) -> Optional[str]:
        """Extrair data da publicação"""
        try:
            # Tentar classe específica
            data_elem = elemento.find_element(By.CLASS_NAME, "data")
            return data_elem.text.strip()
        except Exception:
            # Tentar regex no texto completo
            import re

            texto = elemento.text
            match = re.search(r"(\d{2}/\d{2}/\d{4})", texto)
            if match:
                return match.group(1)
            return datetime.now().strftime("%d/%m/%Y")

    def _extrair_orgao(self, elemento) -> Optional[str]:
        """Extrair órgão da publicação"""
        try:
            # Tentar classe específica
            orgao_elem = elemento.find_element(By.CLASS_NAME, "orgao")
            return orgao_elem.text.strip()
        except Exception:
            # Tentar regex no texto
            import re

            texto = elemento.text
            match = re.search(r"(TJAL|TRT|STF|STJ|TST|TRF)", texto)
            if match:
                return match.group(1)
            return "Não identificado"

    def _detectar_tipo_publicacao(self, texto: str) -> str:
        """Detectar tipo de publicação pelo conteúdo"""
        texto_lower = texto.lower()

        if any(
            palavra in texto_lower for palavra in ["intimação", "intimacao", "intimar"]
        ):
            return "intimacao"
        elif any(palavra in texto_lower for palavra in ["citação", "citacao", "citar"]):
            return "citacao"
        elif any(
            palavra in texto_lower
            for palavra in ["sentença", "sentenca", "decisão", "decisao"]
        ):
            return "sentenca"
        elif any(palavra in texto_lower for palavra in ["despacho"]):
            return "despacho"
        else:
            return "outro"

    def _detectar_prazo(self, texto: str) -> Optional[Dict]:
        """
        Detectar prazo no texto da intimação

        Returns:
            Dicionário com informações do prazo ou None
        """
        import re

        texto_lower = texto.lower()

        # Padrões de prazo
        padroes = [
            r"prazo de (\d+) dias? (úteis|corridos)?",
            r"no prazo de (\d+) dias?",
            r"(\d+) dias? para",
        ]

        for padrao in padroes:
            match = re.search(padrao, texto_lower)
            if match:
                dias = int(match.group(1))
                tipo = match.group(2) if len(match.groups()) > 1 else "úteis"

                return {"dias": dias, "tipo": tipo, "descricao": f"{dias} dias {tipo}"}

        return None


# Função de teste standalone
if __name__ == "__main__":
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    )

    print("🧪 Testando DJEN Scraper...\n")

    scraper = DJENScraper(headless=False)  # Com GUI para debug

    # Teste 1: Busca por OAB
    print("1️⃣ Teste: Busca por OAB")
    publicacoes_oab = scraper.buscar_por_oab("12345", "AL")
    print(f"   Encontradas: {len(publicacoes_oab)} publicações\n")

    # Teste 2: Busca por CNJ
    print("2️⃣ Teste: Busca por CNJ")
    publicacoes_cnj = scraper.buscar_por_cnj("0001234-56.2024.8.02.0001")
    print(f"   Encontradas: {len(publicacoes_cnj)} publicações\n")

    # Teste 3: Busca por palavras-chave
    print("3️⃣ Teste: Busca por palavras-chave")
    publicacoes_kw = scraper.buscar_por_palavras_chave("trabalhista intimação")
    print(f"   Encontradas: {len(publicacoes_kw)} publicações\n")

    print("✅ Testes concluídos!")
