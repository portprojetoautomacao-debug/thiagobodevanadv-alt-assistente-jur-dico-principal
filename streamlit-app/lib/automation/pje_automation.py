"""
PJe Automation - Automação completa do PJe
Combina Selenium WebDriver + PyAutoGUI para automação end-to-end
"""

import logging
import time
from typing import Dict, Optional

from ..integrations.pje import PJeScraper
from .form_filler import FormFiller

logger = logging.getLogger(__name__)


class PJeAutomation:
    """
    Automação completa do PJe combinando Selenium + PyAutoGUI

    Funcionalidades:
    - Login automático
    - Navegação de processos
    - Protocolo automático de petições
    - Download de documentos
    - Preenchimento de formulários nativos
    """

    def __init__(self, tribunal: str = "TJAL", headless: bool = True):
        """
        Inicializar automação PJe

        Args:
            tribunal: Código do tribunal
            headless: Modo headless (True para produção)
        """
        self.tribunal = tribunal
        self.headless = headless
        self.scraper = PJeScraper(tribunal=tribunal, headless=headless)
        self.filler = FormFiller()
        self.logged_in = False

    def login(self, cpf: str, senha: str) -> bool:
        """
        Fazer login no PJe

        Args:
            cpf: CPF do usuário
            senha: Senha

        Returns:
            True se login bem-sucedido
        """
        try:
            logger.info(f"🔐 Iniciando login no PJe {self.tribunal}")

            # Usar Selenium para login
            success = self.scraper.fazer_login(cpf, senha)

            if success:
                self.logged_in = True
                logger.info("✅ Login realizado com sucesso")
            else:
                logger.error("❌ Falha no login")

            return success

        except Exception as e:
            logger.error(f"❌ Erro no login: {str(e)}")
            return False

    def protocolar_peticao_completa(self, dados: Dict) -> bool:
        """
        Protocolar petição completa (Selenium + PyAutoGUI)

        Args:
            dados: Dicionário com:
                - numero_cnj: Número do processo
                - tipo_peticao: Tipo da petição
                - arquivo_pdf: Caminho do PDF
                - texto_peticao: Texto (opcional)
                - anexos: Lista de anexos (opcional)

        Returns:
            True se protocolo bem-sucedido
        """
        if not self.logged_in:
            logger.error("❌ É necessário fazer login primeiro")
            return False

        try:
            numero_cnj = dados["numero_cnj"]
            tipo_peticao = dados["tipo_peticao"]
            arquivo_pdf = dados["arquivo_pdf"]

            logger.info(f"📝 Protocolando petição em {numero_cnj}")

            # Etapa 1: Navegar e preencher com Selenium
            self.scraper.driver.get(
                f"{self.scraper.base_url}/app/processo/{numero_cnj}/peticionar"
            )

            # Aguardar formulário
            self.scraper.wait.until(lambda d: d.find_element("id", "tipoPeticao"))

            # Selecionar tipo
            select_tipo = self.scraper.driver.find_element("id", "tipoPeticao")
            select_tipo.click()
            time.sleep(0.5)

            # Buscar e clicar na opção
            opcao = self.scraper.driver.find_element(
                "xpath", f"//option[contains(text(), '{tipo_peticao}')]"
            )
            opcao.click()

            # Preencher texto se houver
            if "texto_peticao" in dados and dados["texto_peticao"]:
                campo_texto = self.scraper.driver.find_element("id", "textoPeticao")
                campo_texto.clear()
                campo_texto.send_keys(dados["texto_peticao"])

            # Etapa 2: Upload com PyAutoGUI
            logger.info("📎 Fazendo upload do arquivo com PyAutoGUI")

            # Clicar no botão de upload (Selenium)
            btn_upload = self.scraper.driver.find_element("id", "btnUpload")
            btn_upload.click()

            # Aguardar janela nativa abrir
            time.sleep(2)

            # Preencher caminho do arquivo (PyAutoGUI)
            self.filler.digitar_texto(arquivo_pdf, interval=0.05)
            time.sleep(0.5)
            self.filler.pressionar_tecla("enter")

            # Aguardar upload processar
            logger.info("⏳ Aguardando upload processar...")
            time.sleep(5)

            # Etapa 3: Adicionar anexos se houver
            if "anexos" in dados and dados["anexos"]:
                logger.info(f"📎 Adicionando {len(dados['anexos'])} anexos")

                for anexo in dados["anexos"]:
                    # Clicar em adicionar anexo
                    btn_anexo = self.scraper.driver.find_element(
                        "id", "btnAdicionarAnexo"
                    )
                    btn_anexo.click()
                    time.sleep(1)

                    # PyAutoGUI para janela de anexo
                    self.filler.digitar_texto(anexo, interval=0.05)
                    time.sleep(0.5)
                    self.filler.pressionar_tecla("enter")
                    time.sleep(3)

            # Etapa 4: Protocolar
            logger.info("✍️ Protocolando petição")

            btn_protocolar = self.scraper.wait.until(
                lambda d: d.find_element("id", "btnProtocolar")
            )
            btn_protocolar.click()

            # Aguardar confirmação
            self.scraper.wait.until(
                lambda d: d.find_element("class name", "mensagem-sucesso")
            )

            logger.info("✅ Petição protocolada com sucesso!")
            return True

        except Exception as e:
            logger.error(f"❌ Erro ao protocolar petição: {str(e)}")

            # Capturar screenshot do erro
            screenshot = self.filler.tirar_screenshot(
                f"erro_protocolo_{int(time.time())}.png"
            )
            logger.info(f"📸 Screenshot do erro salvo: {screenshot}")

            return False

    def preencher_contestacao(self, dados: Dict) -> bool:
        """
        Preencher formulário de contestação

        Args:
            dados: Dicionário com dados da contestação

        Returns:
            True se preenchimento bem-sucedido
        """
        try:
            logger.info("📝 Preenchendo contestação")

            # Campos específicos de contestação
            campos_contestacao = {
                "preliminares": dados.get("preliminares", ""),
                "merito": dados.get("merito", ""),
                "provas": dados.get("provas", ""),
                "pedidos": dados.get("pedidos", ""),
            }

            # Usar FormFiller para preencher
            for campo, valor in campos_contestacao.items():
                if valor:
                    logger.debug(f"  - Preenchendo {campo}")
                    self.filler.digitar_texto(valor, interval=0.05)
                    self.filler.pressionar_tecla("tab")
                    time.sleep(0.5)

            logger.info("✅ Contestação preenchida")
            return True

        except Exception as e:
            logger.error(f"❌ Erro ao preencher contestação: {str(e)}")
            return False

    def download_documentos(
        self, numero_cnj: str, tipos: Optional[list] = None
    ) -> list:
        """
        Download automático de documentos do processo

        Args:
            numero_cnj: Número CNJ do processo
            tipos: Lista de tipos de documento (None = todos)

        Returns:
            Lista de caminhos dos arquivos baixados
        """
        if not self.logged_in:
            logger.error("❌ É necessário fazer login primeiro")
            return []

        try:
            logger.info(f"📥 Fazendo download de documentos de {numero_cnj}")

            # Navegar para página de documentos
            self.scraper.driver.get(
                f"{self.scraper.base_url}/app/processo/{numero_cnj}/documentos"
            )

            # Aguardar lista carregar
            self.scraper.wait.until(
                lambda d: d.find_element("class name", "documento-item")
            )

            # Buscar links de download
            links_download = self.scraper.driver.find_elements(
                "class name", "btn-download"
            )

            arquivos_baixados = []

            for i, link in enumerate(links_download):
                try:
                    logger.debug(f"  - Download {i+1}/{len(links_download)}")

                    # Clicar no link
                    link.click()
                    time.sleep(2)  # Aguardar download

                    # TODO: Verificar arquivo baixado na pasta de downloads

                except Exception as e:
                    logger.warning(f"⚠️ Erro no download {i+1}: {str(e)}")
                    continue

            logger.info(f"✅ {len(arquivos_baixados)} documentos baixados")
            return arquivos_baixados

        except Exception as e:
            logger.error(f"❌ Erro ao fazer download: {str(e)}")
            return []

    def consultar_intimacoes_nao_lidas(self) -> list:
        """
        Consultar intimações não lidas

        Returns:
            Lista de intimações não lidas
        """
        if not self.logged_in:
            logger.error("❌ É necessário fazer login primeiro")
            return []

        try:
            logger.info("📬 Consultando intimações não lidas")

            # Navegar para caixa de intimações
            self.scraper.driver.get(f"{self.scraper.base_url}/app/intimacoes")

            # Aguardar lista carregar
            self.scraper.wait.until(
                lambda d: d.find_element("class name", "intimacao-item")
            )

            # Filtrar não lidas
            intimacoes_nao_lidas = self.scraper.driver.find_elements(
                "css selector", ".intimacao-item.nao-lida"
            )

            intimacoes = []

            for item in intimacoes_nao_lidas:
                try:
                    intimacao = {
                        "id": item.get_attribute("data-id"),
                        "processo": item.find_element(
                            "class name", "processo-numero"
                        ).text,
                        "tipo": item.find_element("class name", "tipo").text,
                        "data": item.find_element("class name", "data").text,
                        "prazo": (
                            item.find_element("class name", "prazo").text
                            if item.find_elements("class name", "prazo")
                            else None
                        ),
                    }
                    intimacoes.append(intimacao)

                except Exception as e:
                    logger.warning(f"⚠️ Erro ao extrair intimação: {str(e)}")
                    continue

            logger.info(f"✅ {len(intimacoes)} intimações não lidas encontradas")
            return intimacoes

        except Exception as e:
            logger.error(f"❌ Erro ao consultar intimações: {str(e)}")
            return []

    def marcar_intimacao_como_lida(self, intimacao_id: str) -> bool:
        """
        Marcar intimação como lida

        Args:
            intimacao_id: ID da intimação

        Returns:
            True se marcado com sucesso
        """
        try:
            logger.info(f"✔️ Marcando intimação {intimacao_id} como lida")

            # Buscar elemento da intimação
            intimacao = self.scraper.driver.find_element(
                "css selector", f"[data-id='{intimacao_id}']"
            )

            # Clicar no botão "Marcar como lida"
            btn_lida = intimacao.find_element("class name", "btn-marcar-lida")
            btn_lida.click()

            time.sleep(1)

            logger.info("✅ Intimação marcada como lida")
            return True

        except Exception as e:
            logger.error(f"❌ Erro ao marcar intimação: {str(e)}")
            return False

    def fechar(self):
        """Fechar drivers e limpar recursos"""
        try:
            self.scraper._close_driver()
            self.logged_in = False
            logger.info("✅ Automação PJe encerrada")
        except:
            pass


# Função de teste standalone
if __name__ == "__main__":
    import os

    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    )

    print("🧪 Testando PJe Automation...\n")

    # Credenciais de teste
    CPF = os.getenv("PJE_CPF", "12345678900")
    SENHA = os.getenv("PJE_SENHA", "senha123")

    automation = PJeAutomation(tribunal="TJAL", headless=False)

    # Teste 1: Login
    print("1️⃣ Teste: Login")
    login_ok = automation.login(CPF, SENHA)
    print(f"   Login: {'✅ Sucesso' if login_ok else '❌ Falhou'}\n")

    if login_ok:
        # Teste 2: Consultar intimações
        print("2️⃣ Teste: Consultar intimações não lidas")
        intimacoes = automation.consultar_intimacoes_nao_lidas()
        print(f"   Encontradas: {len(intimacoes)} intimações\n")

        # Teste 3: Protocolar petição (comentado - requer dados reais)
        # dados_peticao = {
        #     'numero_cnj': '0001234-56.2024.8.02.0001',
        #     'tipo_peticao': 'Contestação',
        #     'arquivo_pdf': '/path/to/peticao.pdf',
        #     'texto_peticao': 'Texto da contestação...'
        # }
        # print("3️⃣ Teste: Protocolar petição")
        # protocolo_ok = automation.protocolar_peticao_completa(dados_peticao)
        # print(f"   Protocolo: {'✅ Sucesso' if protocolo_ok else '❌ Falhou'}\n")

    automation.fechar()
    print("✅ Testes concluídos!")
