"""
Módulo de automação GUI com PyAutoGUI.

Automatiza interações com interfaces gráficas:
- PJe (Processo Judicial Eletrônico)
- Formulários diversos
- Capturas de tela
- Preenchimento automatizado
"""

import pyautogui
import time
from typing import List, Tuple, Optional
from config import PYAUTOGUI_CONFIG
import logging

# Configurar PyAutoGUI
pyautogui.FAILSAFE = PYAUTOGUI_CONFIG["failsafe"]
pyautogui.PAUSE = PYAUTOGUI_CONFIG["pause"]

logger = logging.getLogger(__name__)

class PyAutoGUIAutomation:
    """Automação GUI com PyAutoGUI."""

    def __init__(self):
        self.screen_size = pyautogui.size()
        logger.info(f"PyAutoGUI inicializado. Resolução: {self.screen_size}")

    # ============================================
    # Operações Básicas
    # ============================================

    def click(self, x: int, y: int, clicks: int = 1, button: str = 'left'):
        """Clica em coordenadas específicas."""
        try:
            pyautogui.click(x, y, clicks=clicks, button=button)
            logger.info(f"Click em ({x}, {y})")
            return True
        except Exception as e:
            logger.error(f"Erro ao clicar: {e}")
            return False

    def type_text(self, text: str, interval: float = 0.1):
        """Digita texto."""
        try:
            pyautogui.write(text, interval=interval)
            logger.info(f"Texto digitado: {text[:50]}...")
            return True
        except Exception as e:
            logger.error(f"Erro ao digitar: {e}")
            return False

    def press_key(self, key: str, presses: int = 1):
        """Pressiona tecla."""
        try:
            pyautogui.press(key, presses=presses)
            logger.info(f"Tecla pressionada: {key}")
            return True
        except Exception as e:
            logger.error(f"Erro ao pressionar tecla: {e}")
            return False

    def hotkey(self, *keys):
        """Executa combinação de teclas."""
        try:
            pyautogui.hotkey(*keys)
            logger.info(f"Hotkey: {'+'.join(keys)}")
            return True
        except Exception as e:
            logger.error(f"Erro no hotkey: {e}")
            return False

    def screenshot(self, region: Optional[Tuple[int, int, int, int]] = None) -> Optional[str]:
        """Captura tela."""
        try:
            filename = f"screenshot_{int(time.time())}.png"
            if region:
                pyautogui.screenshot(filename, region=region)
            else:
                pyautogui.screenshot(filename)
            logger.info(f"Screenshot salvo: {filename}")
            return filename
        except Exception as e:
            logger.error(f"Erro no screenshot: {e}")
            return None

    # ============================================
    # Localização de Elementos
    # ============================================

    def locate_on_screen(self, image_path: str, confidence: float = 0.8) -> Optional[Tuple[int, int]]:
        """Localiza imagem na tela."""
        try:
            location = pyautogui.locateOnScreen(image_path, confidence=confidence)
            if location:
                center = pyautogui.center(location)
                logger.info(f"Imagem encontrada em: {center}")
                return center
            return None
        except Exception as e:
            logger.error(f"Erro ao localizar imagem: {e}")
            return None

    def locate_all_on_screen(self, image_path: str, confidence: float = 0.8) -> List[Tuple[int, int]]:
        """Localiza todas ocorrências de imagem."""
        try:
            locations = list(pyautogui.locateAllOnScreen(image_path, confidence=confidence))
            centers = [pyautogui.center(loc) for loc in locations]
            logger.info(f"Encontradas {len(centers)} ocorrências")
            return centers
        except Exception as e:
            logger.error(f"Erro ao localizar imagens: {e}")
            return []

    def wait_for_image(self, image_path: str, timeout: int = 30, confidence: float = 0.8) -> Optional[Tuple[int, int]]:
        """Aguarda imagem aparecer na tela."""
        start_time = time.time()
        while time.time() - start_time < timeout:
            location = self.locate_on_screen(image_path, confidence)
            if location:
                return location
            time.sleep(1)
        logger.warning(f"Timeout aguardando imagem: {image_path}")
        return None

    # ============================================
    # Automações Específicas para PJe
    # ============================================

    def pje_login(self, usuario: str, senha: str, certificado_digital: bool = False) -> bool:
        """Automatiza login no PJe."""
        try:
            logger.info("Iniciando automação de login PJe...")

            # Aguardar campo usuário
            usuario_img = self.wait_for_image("assets/pje_usuario_field.png", timeout=15)
            if not usuario_img:
                logger.error("Campo usuário não encontrado")
                return False

            # Clicar e digitar usuário
            self.click(usuario_img[0], usuario_img[1])
            time.sleep(0.5)
            self.type_text(usuario)

            # Tab para senha
            self.press_key('tab')
            time.sleep(0.5)
            self.type_text(senha)

            # Enter para logar
            self.press_key('enter')

            logger.info("Login executado com sucesso")
            return True

        except Exception as e:
            logger.error(f"Erro no login PJe: {e}")
            return False

    def pje_protocolar_peticao(self, caminho_pdf: str, tipo_peticao: str) -> bool:
        """Automatiza protocolo de petição no PJe."""
        try:
            logger.info("Iniciando protocolo de petição...")

            # 1. Clicar em "Petição Intermediária"
            peticao_btn = self.wait_for_image("assets/pje_peticao_btn.png")
            if not peticao_btn:
                return False
            self.click(peticao_btn[0], peticao_btn[1])
            time.sleep(2)

            # 2. Selecionar tipo
            tipo_combo = self.wait_for_image("assets/pje_tipo_combo.png")
            if tipo_combo:
                self.click(tipo_combo[0], tipo_combo[1])
                time.sleep(1)
                self.type_text(tipo_peticao)
                self.press_key('enter')

            # 3. Upload do PDF
            upload_btn = self.wait_for_image("assets/pje_upload_btn.png")
            if upload_btn:
                self.click(upload_btn[0], upload_btn[1])
                time.sleep(1)

                # Digitar caminho do arquivo
                self.type_text(caminho_pdf)
                self.press_key('enter')
                time.sleep(3)

            # 4. Confirmar protocolo
            confirmar_btn = self.wait_for_image("assets/pje_confirmar_btn.png")
            if confirmar_btn:
                self.click(confirmar_btn[0], confirmar_btn[1])
                logger.info("Petição protocolada com sucesso!")
                return True

            return False

        except Exception as e:
            logger.error(f"Erro ao protocolar petição: {e}")
            return False

    def pje_consultar_processo(self, numero_processo: str) -> bool:
        """Automatiza consulta de processo."""
        try:
            logger.info(f"Consultando processo: {numero_processo}")

            # Buscar campo de pesquisa
            search_field = self.wait_for_image("assets/pje_search_field.png")
            if not search_field:
                # Fallback: usar atalho
                self.hotkey('ctrl', 'f')
                time.sleep(1)
            else:
                self.click(search_field[0], search_field[1])

            # Digitar número
            self.type_text(numero_processo)
            self.press_key('enter')
            time.sleep(2)

            logger.info("Consulta realizada")
            return True

        except Exception as e:
            logger.error(f"Erro ao consultar processo: {e}")
            return False

    # ============================================
    # Preenchimento de Formulários Genéricos
    # ============================================

    def preencher_formulario(self, campos: dict) -> bool:
        """Preenche formulário genérico."""
        try:
            logger.info(f"Preenchendo formulário com {len(campos)} campos...")

            for campo, valor in campos.items():
                # Tab para próximo campo
                self.press_key('tab')
                time.sleep(0.3)

                # Digitar valor
                self.type_text(str(valor))
                logger.info(f"Campo '{campo}' preenchido")

            logger.info("Formulário preenchido com sucesso")
            return True

        except Exception as e:
            logger.error(f"Erro ao preencher formulário: {e}")
            return False

    # ============================================
    # Utilitários
    # ============================================

    def get_mouse_position(self) -> Tuple[int, int]:
        """Retorna posição atual do mouse."""
        return pyautogui.position()

    def move_mouse(self, x: int, y: int, duration: float = 0.5):
        """Move mouse para posição."""
        pyautogui.moveTo(x, y, duration=duration)

    def scroll(self, clicks: int):
        """Rola página."""
        pyautogui.scroll(clicks)

    def alert(self, text: str, title: str = "PyAutoGUI"):
        """Exibe alerta."""
        pyautogui.alert(text, title)

    def confirm(self, text: str, title: str = "Confirmar") -> str:
        """Exibe confirmação."""
        return pyautogui.confirm(text, title, buttons=['OK', 'Cancelar'])
