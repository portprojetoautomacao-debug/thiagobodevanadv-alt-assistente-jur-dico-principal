"""
PJe Scraper - Processo Judicial Eletrônico
Scraping e automação completa do PJe usando Selenium + PyAutoGUI
"""

import logging
import os
import time
from datetime import datetime
from typing import Dict, List, Optional, Tuple

try:
    import pyautogui
except ImportError:
    pyautogui = None
except KeyError:
    # Handle headless environment (DISPLAY not set)
    pyautogui = None

from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait
from webdriver_manager.chrome import ChromeDriverManager

logger = logging.getLogger(__name__)


# Constantes
ERRO_LOGIN_NECESSARIO = "❌ É necessário fazer login primeiro"

class PJeScraper:
    """
    Scraper e automação para PJe (Processo Judicial Eletrônico)

    Funcionalidades:
    - Login automático
    - Listagem de processos
    - Busca de expedientes
    - Consulta de intimações
    - Download de documentos
    - Protocolo de petições (com PyAutoGUI para janelas nativas)
    """

    # URLs por tribunal (exemplos)
    PJE_URLS = {
        "TJAL": "https://pje.tjal.jus.br",
        "TRT19": "https://pje.trt19.jus.br",
        "TRF5": "https://pje.trf5.jus.br",
    }

    TIMEOUT = 15  # segundos

    def __init__(self, tribunal: str = "TJAL", headless: bool = True):
        """
        Inicializar scraper PJe

        Args:
            tribunal: Código do tribunal (TJAL, TRT19, etc)
            headless: Rodar browser em modo headless
        """
        self.tribunal = tribunal
        self.base_url = self.PJE_URLS.get(tribunal, self.PJE_URLS["TJAL"])
        self.headless = headless
        self.driver = None
        self.wait = None
        self.logged_in = False

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

            # Download automático
            prefs = {
                "download.default_directory": "/tmp/pje_downloads",
                "download.prompt_for_download": False,
                "download.directory_upgrade": True,
                "plugins.always_open_pdf_externally": True,
            }
            options.add_experimental_option("prefs", prefs)

            # User agent real
            options.add_argument(
                "user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            )

            service = Service(ChromeDriverManager().install())
            self.driver = webdriver.Chrome(service=service, options=options)
            self.wait = WebDriverWait(self.driver, self.TIMEOUT)

            logger.info(f"✅ WebDriver Chrome inicializado para {self.tribunal}")

        except Exception as e:
            logger.error(f"❌ Erro ao inicializar WebDriver: {str(e)}")
            raise

    def _close_driver(self):
        """Fechar WebDriver"""
        if self.driver:
            try:
                self.driver.quit()
                self.logged_in = False
                logger.info("✅ WebDriver fechado")
            except Exception:
                pass

    def fazer_login(self, cpf: str, senha: str, certificado: bool = False) -> bool:
        """
        Fazer login no PJe

        Args:
            cpf: CPF do usuário
            senha: Senha
            certificado: True se usar certificado digital

        Returns:
            True se login bem-sucedido
        """
        try:
            logger.info(f"🔐 Fazendo login no PJe {self.tribunal}")

            if not self.driver:
                self._init_driver()

            # Acessar página de login
            self.driver.get(f"{self.base_url}/login")

            # Aguardar formulário de login
            self.wait.until(EC.presence_of_element_located((By.ID, "username")))

            if certificado:
                # Login com certificado digital
                logger.info("🔒 Usando certificado digital")
                btn_certificado = self.driver.find_element(By.ID, "btnCertificado")
                btn_certificado.click()

                # Aguardar seleção manual do certificado
                time.sleep(5)

            else:
                # Login com CPF e senha
                logger.info("🔑 Usando CPF e senha")

                campo_cpf = self.driver.find_element(By.ID, "username")
                campo_senha = self.driver.find_element(By.ID, "password")

                campo_cpf.clear()
                campo_cpf.send_keys(cpf)

                campo_senha.clear()
                campo_senha.send_keys(senha)

                # Submit
                btn_login = self.driver.find_element(By.ID, "btnEntrar")
                btn_login.click()

            # Aguardar redirecionamento para página principal
            self.wait.until(EC.url_contains("/app"))

            self.logged_in = True
            logger.info("✅ Login realizado com sucesso")
            return True

        except Exception as e:
            logger.error(f"❌ Erro ao fazer login: {str(e)}")
            return False

    def listar_processos(self, filtro: Optional[str] = None) -> List[Dict]:
        """
        Listar processos do usuário logado

        Args:
            filtro: Filtro de busca (ex: "Trabalhista")

        Returns:
            Lista de processos
        """
        if not self.logged_in:
            logger.error(ERRO_LOGIN_NECESSARIO)
            return []

        try:
            logger.info("📋 Listando processos")

            # Navegar para lista de processos
            self.driver.get(f"{self.base_url}/app/processos")

            # Aguardar tabela carregar
            self.wait.until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "table.processos"))
            )

            # Aplicar filtro se fornecido
            if filtro:
                campo_filtro = self.driver.find_element(By.ID, "filtroProcesso")
                campo_filtro.clear()
                campo_filtro.send_keys(filtro)
                campo_filtro.send_keys(Keys.ENTER)
                time.sleep(2)  # Aguardar atualização

            # Extrair processos da tabela
            processos = self._extrair_processos_tabela()

            logger.info(f"✅ {len(processos)} processos encontrados")
            return processos

        except Exception as e:
            logger.error(f"❌ Erro ao listar processos: {str(e)}")
            return []

    def buscar_processo(self, numero_cnj: str) -> Optional[Dict]:
        """
        Buscar processo específico por número CNJ

        Args:
            numero_cnj: Número CNJ completo

        Returns:
            Dados do processo ou None
        """
        if not self.logged_in:
            logger.error(ERRO_LOGIN_NECESSARIO)
            return None

        try:
            logger.info(f"🔍 Buscando processo {numero_cnj}")

            # Navegar para busca
            self.driver.get(f"{self.base_url}/app/consulta")

            # Preencher número CNJ
            campo_numero = self.wait.until(
                EC.presence_of_element_located((By.ID, "numeroProcesso"))
            )
            campo_numero.clear()
            campo_numero.send_keys(numero_cnj)

            # Buscar
            btn_buscar = self.driver.find_element(By.ID, "btnBuscar")
            btn_buscar.click()

            # Aguardar resultado
            self.wait.until(
                EC.presence_of_element_located((By.CLASS_NAME, "processo-detalhe"))
            )

            # Extrair dados
            processo = self._extrair_dados_processo()

            logger.info(f"✅ Processo {numero_cnj} encontrado")
            return processo

        except Exception as e:
            logger.error(f"❌ Erro ao buscar processo: {str(e)}")
            return None

    def buscar_expedientes(self, numero_cnj: str) -> List[Dict]:
        """
        Buscar expedientes/intimações de um processo

        Args:
            numero_cnj: Número CNJ do processo

        Returns:
            Lista de expedientes
        """
        if not self.logged_in:
            logger.error(ERRO_LOGIN_NECESSARIO)
            return []

        try:
            logger.info(f"📬 Buscando expedientes de {numero_cnj}")

            # Buscar processo primeiro
            processo = self.buscar_processo(numero_cnj)
            if not processo:
                return []

            # Navegar para aba de expedientes
            self.driver.get(f"{self.base_url}/app/processo/{numero_cnj}/expedientes")

            # Aguardar lista carregar
            self.wait.until(
                EC.presence_of_element_located((By.CLASS_NAME, "expediente-item"))
            )

            # Extrair expedientes
            expedientes = self._extrair_expedientes()

            logger.info(f"✅ {len(expedientes)} expedientes encontrados")
            return expedientes

        except Exception as e:
            logger.error(f"❌ Erro ao buscar expedientes: {str(e)}")
            return []

    def protocolar_peticao(
        self,
        numero_cnj: str,
        tipo_peticao: str,
        arquivo_pdf: str,
        texto: Optional[str] = None,
    ) -> bool:
        """
        Protocolar petição no PJe

        Args:
            numero_cnj: Número CNJ do processo
            tipo_peticao: Tipo da petição (ex: "Contestação", "Recurso")
            arquivo_pdf: Caminho completo do arquivo PDF
            texto: Texto da petição (opcional)

        Returns:
            True se protocolo bem-sucedido
        """
        if not self.logged_in:
            logger.error(ERRO_LOGIN_NECESSARIO)
            return False

        try:
            logger.info(f"📝 Protocolando petição em {numero_cnj}")

            # Navegar para protocolo
            self.driver.get(f"{self.base_url}/app/processo/{numero_cnj}/peticionar")

            # Aguardar formulário
            self.wait.until(EC.presence_of_element_located((By.ID, "tipoPeticao")))

            # Selecionar tipo de petição
            select_tipo = self.driver.find_element(By.ID, "tipoPeticao")
            select_tipo.click()

            # Buscar opção (ajustar seletor conforme necessário)
            opcao = self.driver.find_element(
                By.XPATH, f"//option[contains(text(), '{tipo_peticao}')]"
            )
            opcao.click()

            # Preencher texto se fornecido
            if texto:
                campo_texto = self.driver.find_element(By.ID, "textoPeticao")
                campo_texto.clear()
                campo_texto.send_keys(texto)

            # Upload de arquivo usando PyAutoGUI (janela nativa do SO)
            logger.info("📎 Fazendo upload do arquivo...")

            # Clicar no botão de upload
            btn_upload = self.driver.find_element(By.ID, "btnUpload")
            btn_upload.click()

            # Aguardar janela de upload abrir
            time.sleep(1)

            # Usar PyAutoGUI para preencher janela nativa
            pyautogui.write(arquivo_pdf)
            time.sleep(0.5)
            pyautogui.press("enter")

            # Aguardar upload processar
            time.sleep(3)

            # Protocolar
            btn_protocolar = self.wait.until(
                EC.element_to_be_clickable((By.ID, "btnProtocolar"))
            )
            btn_protocolar.click()

            # Aguardar confirmação
            self.wait.until(
                EC.presence_of_element_located((By.CLASS_NAME, "mensagem-sucesso"))
            )

            logger.info("✅ Petição protocolada com sucesso")
            return True

        except Exception as e:
            logger.error(f"❌ Erro ao protocolar petição: {str(e)}")
            return False

    def _extrair_processos_tabela(self) -> List[Dict]:
        """Extrair processos da tabela"""
        processos = []

        try:
            linhas = self.driver.find_elements(
                By.CSS_SELECTOR, "table.processos tbody tr"
            )

            for linha in linhas:
                try:
                    colunas = linha.find_elements(By.TAG_NAME, "td")

                    if len(colunas) >= 4:
                        processo = {
                            "numeroCNJ": colunas[0].text.strip(),
                            "classe": colunas[1].text.strip(),
                            "assunto": colunas[2].text.strip(),
                            "dataDistribuicao": colunas[3].text.strip(),
                            "source": "PJe",
                            "tribunal": self.tribunal,
                            "retrieved_at": datetime.now().isoformat(),
                        }
                        processos.append(processo)

                except Exception as e:
                    logger.warning(f"⚠️ Erro ao extrair linha: {str(e)}")
                    continue

        except Exception as e:
            logger.error(f"❌ Erro ao extrair processos: {str(e)}")

        return processos

    def _extrair_dados_processo(self) -> Optional[Dict]:
        """Extrair dados detalhados do processo"""
        try:
            processo = {
                "numeroCNJ": self._get_text_safe(By.ID, "numeroProcesso"),
                "classe": self._get_text_safe(By.CLASS_NAME, "classe"),
                "assunto": self._get_text_safe(By.CLASS_NAME, "assunto"),
                "autor": self._get_text_safe(By.CLASS_NAME, "parte-autor"),
                "reu": self._get_text_safe(By.CLASS_NAME, "parte-reu"),
                "comarca": self._get_text_safe(By.CLASS_NAME, "comarca"),
                "vara": self._get_text_safe(By.CLASS_NAME, "vara"),
                "dataDistribuicao": self._get_text_safe(
                    By.CLASS_NAME, "data-distribuicao"
                ),
                "valorCausa": self._get_text_safe(By.CLASS_NAME, "valor-causa"),
                "source": "PJe",
                "tribunal": self.tribunal,
                "retrieved_at": datetime.now().isoformat(),
            }

            return processo

        except Exception as e:
            logger.error(f"❌ Erro ao extrair dados: {str(e)}")
            return None

    def _extrair_expedientes(self) -> List[Dict]:
        """Extrair expedientes da lista"""
        expedientes = []

        try:
            itens = self.driver.find_elements(By.CLASS_NAME, "expediente-item")

            for item in itens:
                try:
                    expediente = {
                        "id": item.get_attribute("data-id"),
                        "tipo": self._get_text_safe_from_element(
                            item, By.CLASS_NAME, "tipo"
                        ),
                        "titulo": self._get_text_safe_from_element(
                            item, By.CLASS_NAME, "titulo"
                        ),
                        "dataRecebimento": self._get_text_safe_from_element(
                            item, By.CLASS_NAME, "data"
                        ),
                        "lido": "nao-lido" not in item.get_attribute("class"),
                        "source": "PJe",
                        "retrieved_at": datetime.now().isoformat(),
                    }
                    expedientes.append(expediente)

                except Exception as e:
                    logger.warning(f"⚠️ Erro ao extrair expediente: {str(e)}")
                    continue

        except Exception as e:
            logger.error(f"❌ Erro ao extrair expedientes: {str(e)}")

        return expedientes

    def _get_text_safe(self, by: By, value: str) -> str:
        """Buscar texto de elemento com segurança"""
        try:
            element = self.driver.find_element(by, value)
            return element.text.strip()
        except Exception:
            return ""

    def _get_text_safe_from_element(self, parent, by: By, value: str) -> str:
        """Buscar texto de sub-elemento com segurança"""
        try:
            element = parent.find_element(by, value)
            return element.text.strip()
        except Exception:
            return ""


# Função de teste standalone
if __name__ == "__main__":
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    )

    print("🧪 Testando PJe Scraper...\n")

    # Credenciais de teste (substituir por reais)
    CPF_TESTE = os.getenv("PJE_CPF", "12345678900")
    SENHA_TESTE = os.getenv("PJE_SENHA", "senha123")

    scraper = PJeScraper(tribunal="TJAL", headless=False)

    # Teste 1: Login
    print("1️⃣ Teste: Login")
    login_ok = scraper.fazer_login(CPF_TESTE, SENHA_TESTE)
    print(f"   Login: {'✅ Sucesso' if login_ok else '❌ Falhou'}\n")

    if login_ok:
        # Teste 2: Listar processos
        print("2️⃣ Teste: Listar processos")
        processos = scraper.listar_processos()
        print(f"   Encontrados: {len(processos)} processos\n")

        if processos:
            # Teste 3: Buscar expedientes do primeiro processo
            print("3️⃣ Teste: Buscar expedientes")
            primeiro_processo = processos[0]["numeroCNJ"]
            expedientes = scraper.buscar_expedientes(primeiro_processo)
            print(f"   Expedientes: {len(expedientes)}\n")

    scraper._close_driver()
    print("✅ Testes concluídos!")
