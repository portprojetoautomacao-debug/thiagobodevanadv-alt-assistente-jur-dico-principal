"""
Módulo de web scraping com Selenium.

Implementa scrapers para:
- DJEN (Diário Eletrônico)
- PJe (Processo Judicial Eletrônico)
- DataJud (CNJ)
- Tribunais estaduais
"""

from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException
from typing import List, Dict, Any
import time
from config import SELENIUM_CONFIG, DJEN_CONFIG

class SeleniumScraper:
    """Base class para scrapers com Selenium."""

    def __init__(self):
        self.options = Options()

        if SELENIUM_CONFIG["headless"]:
            self.options.add_argument("--headless")

        self.options.add_argument("--no-sandbox")
        self.options.add_argument("--disable-dev-shm-usage")
        self.options.add_argument("--disable-gpu")

        self.timeout = SELENIUM_CONFIG["timeout"]
        self.driver = None

    def start_driver(self):
        """Inicia driver Selenium."""
        if not self.driver:
            self.driver = webdriver.Chrome(options=self.options)
            self.driver.set_page_load_timeout(self.timeout)

    def stop_driver(self):
        """Para driver Selenium."""
        if self.driver:
            self.driver.quit()
            self.driver = None

    def wait_for_element(self, by: By, value: str, timeout: int = 10):
        """Aguarda elemento estar presente."""
        return WebDriverWait(self.driver, timeout).until(
            EC.presence_of_element_located((by, value))
        )

class DJENScraper(SeleniumScraper):
    """Scraper do Diário Eletrônico Nacional."""

    def scrape_publicacoes(self, oab: str) -> List[Dict[str, Any]]:
        """Busca publicações por OAB."""
        self.start_driver()

        try:
            # Navegar para DJEN
            self.driver.get(DJEN_CONFIG["url"])

            # Aguardar formulário
            self.wait_for_element(By.ID, "campo_oab")

            # Preencher OAB
            input_oab = self.driver.find_element(By.ID, "campo_oab")
            input_oab.send_keys(oab)

            # Submeter busca
            btn_buscar = self.driver.find_element(By.ID, "btn_buscar")
            btn_buscar.click()

            # Aguardar resultados
            time.sleep(3)

            # Extrair publicações
            publicacoes = []
            elementos = self.driver.find_elements(By.CLASS_NAME, "publicacao")

            for elem in elementos:
                try:
                    publicacao = {
                        "numero_processo": elem.find_element(By.CLASS_NAME, "numero").text,
                        "tipo": elem.find_element(By.CLASS_NAME, "tipo").text,
                        "conteudo": elem.find_element(By.CLASS_NAME, "conteudo").text,
                        "data": elem.find_element(By.CLASS_NAME, "data").text
                    }
                    publicacoes.append(publicacao)
                except Exception as e:
                    print(f"Erro ao extrair publicação: {e}")
                    continue

            return publicacoes

        except TimeoutException:
            print("Timeout ao carregar DJEN")
            return []
        except Exception as e:
            print(f"Erro no scraping DJEN: {e}")
            return []
        finally:
            self.stop_driver()

class PJEScraper(SeleniumScraper):
    """Scraper do PJe."""

    def login(self, usuario: str, senha: str) -> bool:
        """Realiza login no PJe."""
        self.start_driver()

        try:
            # URL PJe (exemplo - ajustar para tribunal específico)
            self.driver.get("https://pje.tjal.jus.br/")

            # Aguardar formulário de login
            self.wait_for_element(By.ID, "username")

            # Preencher credenciais
            self.driver.find_element(By.ID, "username").send_keys(usuario)
            self.driver.find_element(By.ID, "password").send_keys(senha)

            # Submeter
            self.driver.find_element(By.ID, "btnEntrar").click()

            # Aguardar dashboard
            self.wait_for_element(By.CLASS_NAME, "dashboard", timeout=15)

            return True

        except Exception as e:
            print(f"Erro no login PJe: {e}")
            return False

    def buscar_processos(self, filtros: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Busca processos no PJe."""
        if not self.driver:
            raise Exception("Driver não iniciado. Faça login primeiro.")

        try:
            # Navegar para busca
            self.driver.get("https://pje.tjal.jus.br/pje/Processo/ConsultaProcesso/listView.seam")

            # Aplicar filtros
            if filtros.get("numero"):
                input_numero = self.wait_for_element(By.ID, "numeroProcesso")
                input_numero.send_keys(filtros["numero"])

            # Buscar
            btn_buscar = self.driver.find_element(By.ID, "btnPesquisar")
            btn_buscar.click()

            # Aguardar resultados
            time.sleep(3)

            # Extrair processos
            processos = []
            linhas = self.driver.find_elements(By.CSS_SELECTOR, "table.resultados tbody tr")

            for linha in linhas:
                try:
                    colunas = linha.find_elements(By.TAG_NAME, "td")
                    processo = {
                        "numero": colunas[0].text,
                        "classe": colunas[1].text,
                        "assunto": colunas[2].text,
                        "data_distribuicao": colunas[3].text,
                        "vara": colunas[4].text
                    }
                    processos.append(processo)
                except Exception as e:
                    print(f"Erro ao extrair processo: {e}")
                    continue

            return processos

        except Exception as e:
            print(f"Erro na busca de processos: {e}")
            return []

class DataJudScraper(SeleniumScraper):
    """Scraper da API DataJud (CNJ)."""

    def buscar_jurisprudencia(self, query: str, tribunal: str = "STJ") -> List[Dict[str, Any]]:
        """Busca jurisprudência no DataJud."""
        # DataJud tem API REST, mas mantemos scraper como fallback

        self.start_driver()

        try:
            # URL DataJud
            self.driver.get(f"https://datajud.cnj.jus.br/consulta?q={query}&tribunal={tribunal}")

            # Aguardar resultados
            self.wait_for_element(By.CLASS_NAME, "resultado", timeout=15)

            # Extrair decisões
            decisoes = []
            elementos = self.driver.find_elements(By.CLASS_NAME, "resultado")

            for elem in elementos[:10]:  # Limitar a 10 resultados
                try:
                    decisao = {
                        "numero": elem.find_element(By.CLASS_NAME, "numero-processo").text,
                        "ementa": elem.find_element(By.CLASS_NAME, "ementa").text,
                        "data": elem.find_element(By.CLASS_NAME, "data-julgamento").text,
                        "relator": elem.find_element(By.CLASS_NAME, "relator").text,
                        "tribunal": tribunal
                    }
                    decisoes.append(decisao)
                except Exception as e:
                    print(f"Erro ao extrair decisão: {e}")
                    continue

            return decisoes

        except Exception as e:
            print(f"Erro no scraping DataJud: {e}")
            return []
        finally:
            self.stop_driver()
