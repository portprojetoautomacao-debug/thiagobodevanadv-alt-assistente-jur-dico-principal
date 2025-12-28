"""
Form Filler - Preenchimento automático de formulários
Automação GUI usando PyAutoGUI para janelas nativas do sistema operacional
"""

import logging
import time
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import pyautogui

logger = logging.getLogger(__name__)


class FormFiller:
    """
    Automação de preenchimento de formulários usando PyAutoGUI

    Funcionalidades:
    - Preenchimento automático de campos
    - Navegação por TAB
    - Cliques em coordenadas
    - Detecção de imagens na tela
    - Screenshots
    - Controle de mouse e teclado
    """

    def __init__(self):
        """Inicializar Form Filler com configurações de segurança"""
        # Configurar segurança
        pyautogui.FAILSAFE = True  # Mover mouse para canto superior esquerdo para parar
        pyautogui.PAUSE = 0.5  # Pausa de 0.5s entre comandos

        # Obter tamanho da tela
        self.screen_width, self.screen_height = pyautogui.size()

        logger.info(
            f"✅ FormFiller inicializado (tela: {self.screen_width}x{self.screen_height})"
        )

    def preencher_campos(self, campos: Dict[str, str], usar_tab: bool = True) -> bool:
        """
        Preencher múltiplos campos de formulário

        Args:
            campos: Dicionário {nome_campo: valor}
            usar_tab: Usar TAB para navegar entre campos

        Returns:
            True se preenchimento bem-sucedido
        """
        try:
            logger.info(f"📝 Preenchendo {len(campos)} campos")

            for nome_campo, valor in campos.items():
                logger.debug(f"  - {nome_campo}: {valor}")

                # Digitar valor
                pyautogui.write(str(valor), interval=0.1)

                # Navegar para próximo campo
                if usar_tab:
                    pyautogui.press("tab")
                    time.sleep(0.3)

            logger.info("✅ Campos preenchidos com sucesso")
            return True

        except Exception as e:
            logger.error(f"❌ Erro ao preencher campos: {str(e)}")
            return False

    def preencher_peticao_inicial(self, dados: Dict) -> bool:
        """
        Preencher formulário de petição inicial

        Args:
            dados: Dicionário com dados da petição:
                - nome_autor: Nome do autor
                - cpf_autor: CPF do autor
                - endereco: Endereço completo
                - telefone: Telefone de contato
                - email: E-mail
                - valor_causa: Valor da causa
                - fatos: Descrição dos fatos
                - pedidos: Pedidos

        Returns:
            True se preenchimento bem-sucedido
        """
        try:
            logger.info("📝 Preenchendo petição inicial")

            campos = {
                "nome_autor": dados.get("nome_autor", ""),
                "cpf_autor": dados.get("cpf_autor", ""),
                "endereco": dados.get("endereco", ""),
                "telefone": dados.get("telefone", ""),
                "email": dados.get("email", ""),
                "valor_causa": dados.get("valor_causa", ""),
            }

            # Preencher campos básicos
            if not self.preencher_campos(campos):
                return False

            # Preencher campos de texto longo (fatos e pedidos)
            if "fatos" in dados and dados["fatos"]:
                logger.debug("  - Preenchendo fatos")
                pyautogui.write(dados["fatos"], interval=0.05)
                pyautogui.press("tab")
                time.sleep(0.5)

            if "pedidos" in dados and dados["pedidos"]:
                logger.debug("  - Preenchendo pedidos")
                pyautogui.write(dados["pedidos"], interval=0.05)

            logger.info("✅ Petição inicial preenchida")
            return True

        except Exception as e:
            logger.error(f"❌ Erro ao preencher petição: {str(e)}")
            return False

    def clicar_em(self, x: int, y: int, clicks: int = 1, button: str = "left") -> bool:
        """
        Clicar em coordenadas específicas

        Args:
            x: Coordenada X
            y: Coordenada Y
            clicks: Número de cliques (1 = simples, 2 = duplo)
            button: 'left', 'right' ou 'middle'

        Returns:
            True se clique bem-sucedido
        """
        try:
            logger.debug(f"🖱️ Clicando em ({x}, {y})")

            # Mover mouse
            pyautogui.moveTo(x, y, duration=0.3)
            time.sleep(0.2)

            # Clicar
            pyautogui.click(clicks=clicks, button=button)

            return True

        except Exception as e:
            logger.error(f"❌ Erro ao clicar: {str(e)}")
            return False

    def localizar_imagem(
        self, imagem: str, confianca: float = 0.8
    ) -> Optional[Tuple[int, int]]:
        """
        Localizar imagem na tela e retornar coordenadas do centro

        Args:
            imagem: Caminho para arquivo de imagem (PNG)
            confianca: Nível de confiança (0.0 a 1.0)

        Returns:
            Tupla (x, y) com coordenadas ou None se não encontrado
        """
        try:
            logger.debug(f"🔍 Procurando imagem: {imagem}")

            # Verificar se arquivo existe
            if not Path(imagem).exists():
                logger.warning(f"⚠️ Arquivo não encontrado: {imagem}")
                return None

            # Localizar imagem
            posicao = pyautogui.locateCenterOnScreen(imagem, confidence=confianca)

            if posicao:
                logger.info(f"✅ Imagem encontrada em: {posicao}")
                return posicao
            else:
                logger.warning("⚠️ Imagem não encontrada na tela")
                return None

        except Exception as e:
            logger.error(f"❌ Erro ao localizar imagem: {str(e)}")
            return None

    def clicar_em_imagem(
        self, imagem: str, confianca: float = 0.8, clicks: int = 1
    ) -> bool:
        """
        Localizar imagem e clicar nela

        Args:
            imagem: Caminho para arquivo de imagem
            confianca: Nível de confiança
            clicks: Número de cliques

        Returns:
            True se clicou com sucesso
        """
        try:
            posicao = self.localizar_imagem(imagem, confianca)

            if not posicao:
                return False

            x, y = posicao
            return self.clicar_em(x, y, clicks=clicks)

        except Exception as e:
            logger.error(f"❌ Erro ao clicar em imagem: {str(e)}")
            return False

    def tirar_screenshot(
        self,
        filename: Optional[str] = None,
        region: Optional[Tuple[int, int, int, int]] = None,
    ) -> str:
        """
        Capturar screenshot da tela

        Args:
            filename: Nome do arquivo (None = gera automático)
            region: Tupla (x, y, width, height) para capturar região específica

        Returns:
            Caminho do arquivo salvo
        """
        try:
            if not filename:
                timestamp = time.strftime("%Y%m%d_%H%M%S")
                filename = f"screenshot_{timestamp}.png"

            logger.info(f"📸 Capturando screenshot: {filename}")

            # Capturar screenshot
            if region:
                screenshot = pyautogui.screenshot(region=region)
            else:
                screenshot = pyautogui.screenshot()

            # Salvar
            screenshot.save(filename)

            logger.info(f"✅ Screenshot salvo: {filename}")
            return filename

        except Exception as e:
            logger.error(f"❌ Erro ao capturar screenshot: {str(e)}")
            return ""

    def digitar_texto(self, texto: str, interval: float = 0.1) -> bool:
        """
        Digitar texto com intervalo entre teclas

        Args:
            texto: Texto a digitar
            interval: Intervalo entre teclas (segundos)

        Returns:
            True se digitação bem-sucedida
        """
        try:
            logger.debug(f"⌨️ Digitando: {texto[:50]}...")

            pyautogui.write(texto, interval=interval)

            return True

        except Exception as e:
            logger.error(f"❌ Erro ao digitar: {str(e)}")
            return False

    def pressionar_tecla(self, tecla: str, presses: int = 1) -> bool:
        """
        Pressionar tecla específica

        Args:
            tecla: Nome da tecla (ex: 'enter', 'tab', 'esc')
            presses: Número de vezes

        Returns:
            True se pressionou com sucesso
        """
        try:
            logger.debug(f"⌨️ Pressionando: {tecla} ({presses}x)")

            pyautogui.press(tecla, presses=presses)

            return True

        except Exception as e:
            logger.error(f"❌ Erro ao pressionar tecla: {str(e)}")
            return False

    def atalho_teclado(self, *teclas: str) -> bool:
        """
        Executar atalho de teclado (ex: Ctrl+C, Ctrl+Shift+V)

        Args:
            teclas: Sequência de teclas (ex: 'ctrl', 'c')

        Returns:
            True se executou com sucesso
        """
        try:
            logger.debug(f"⌨️ Atalho: {'+'.join(teclas)}")

            pyautogui.hotkey(*teclas)

            return True

        except Exception as e:
            logger.error(f"❌ Erro ao executar atalho: {str(e)}")
            return False

    def arrastar_para(self, x: int, y: int, duration: float = 0.5) -> bool:
        """
        Arrastar mouse da posição atual para coordenadas

        Args:
            x: Coordenada X de destino
            y: Coordenada Y de destino
            duration: Duração da animação (segundos)

        Returns:
            True se arrastou com sucesso
        """
        try:
            logger.debug(f"🖱️ Arrastando para ({x}, {y})")

            pyautogui.drag(x, y, duration=duration)

            return True

        except Exception as e:
            logger.error(f"❌ Erro ao arrastar: {str(e)}")
            return False

    def obter_posicao_mouse(self) -> Tuple[int, int]:
        """
        Obter posição atual do mouse

        Returns:
            Tupla (x, y) com coordenadas
        """
        return pyautogui.position()

    def aguardar_imagem(
        self, imagem: str, timeout: int = 30, confianca: float = 0.8
    ) -> Optional[Tuple[int, int]]:
        """
        Aguardar imagem aparecer na tela

        Args:
            imagem: Caminho para arquivo de imagem
            timeout: Tempo máximo de espera (segundos)
            confianca: Nível de confiança

        Returns:
            Coordenadas da imagem ou None se timeout
        """
        logger.info(f"⏳ Aguardando imagem: {imagem} (timeout: {timeout}s)")

        inicio = time.time()

        while (time.time() - inicio) < timeout:
            posicao = self.localizar_imagem(imagem, confianca)
            if posicao:
                logger.info(f"✅ Imagem encontrada após {int(time.time() - inicio)}s")
                return posicao

            time.sleep(0.5)

        logger.warning(f"⚠️ Timeout ao aguardar imagem")
        return None

    def desabilitar_failsafe(self):
        """Desabilitar failsafe (mover mouse para canto para parar)"""
        pyautogui.FAILSAFE = False
        logger.warning("⚠️ FAILSAFE DESABILITADO - Use com cuidado!")

    def habilitar_failsafe(self):
        """Habilitar failsafe"""
        pyautogui.FAILSAFE = True
        logger.info("✅ FAILSAFE habilitado")


# Função de teste standalone
if __name__ == "__main__":
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    )

    print("🧪 Testando Form Filler...\n")

    filler = FormFiller()

    # Teste 1: Obter posição do mouse
    print("1️⃣ Teste: Posição do mouse")
    x, y = filler.obter_posicao_mouse()
    print(f"   Mouse em: ({x}, {y})\n")

    # Teste 2: Screenshot
    print("2️⃣ Teste: Screenshot")
    screenshot_path = filler.tirar_screenshot()
    print(f"   Salvo em: {screenshot_path}\n")

    # Teste 3: Digitar texto (em 5 segundos - posicione cursor)
    print("3️⃣ Teste: Digitar texto (você tem 5s para posicionar o cursor)")
    for i in range(5, 0, -1):
        print(f"   {i}...")
        time.sleep(1)

    filler.digitar_texto("Teste de digitação automática com PyAutoGUI")
    print("   ✅ Texto digitado\n")

    print("✅ Testes concluídos!")
