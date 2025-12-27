# 🎯 CHAT 3 - AUTOMAÇÕES E DEPLOY (SEMANA 3)

**Responsabilidade:** Selenium + PyAutoGUI + ML + Deploy Produção
**Prazo:** Dias 15-21
**Prioridade:** 🟠 ALTA

---

## 📋 ESCOPO DESTE CHAT

Você é responsável por implementar:

### 1️⃣ Selenium Scrapers (Dias 15-16)
- `streamlit-app/lib/integrations/djen.py` - DJEN scraping
- `streamlit-app/lib/integrations/datajud.py` - DataJud API
- `streamlit-app/lib/integrations/pje.py` - PJe scraping
- `streamlit-app/lib/automation/pje_automation.py` - Automação completa PJe
- `streamlit-app/lib/automation/form_filler.py` - PyAutoGUI

### 2️⃣ Cron Jobs (Dia 17)
- `streamlit-app/backend/cron_jobs.py` - APScheduler
  - DJEN monitor (2x/dia - 12:00, 20:00)
  - DataJud sync (1x/dia - 16:00)
  - Fila agentes (15min)
  - Alertas prazos (11:55)
  - Backup (03:00)

### 3️⃣ Machine Learning (Dia 18)
- `streamlit-app/lib/ml/predictor.py` - Predição sucesso
- `streamlit-app/lib/ml/duration_estimator.py` - Estimativa duração
- `streamlit-app/lib/ml/clustering.py` - K-Means
- `streamlit-app/lib/ml/sentiment.py` - Análise sentimento
- `streamlit-app/models/` - Modelos treinados (.pkl)

### 4️⃣ Testes (Dia 19)
- `streamlit-app/tests/` - Suite de testes
- Testes unitários (pytest)
- Testes de integração
- Validação end-to-end

### 5️⃣ Deploy (Dias 20-21)
- Deploy backend (Railway)
- Deploy Streamlit (Streamlit Cloud)
- Configuração variáveis ambiente
- DNS e certificados
- Monitoramento

---

## 🚀 COMANDOS PARA ESTE CHAT

```bash
# Ambiente
cd streamlit-app
source venv/bin/activate

# Instalar dependências
pip install selenium webdriver-manager
pip install pyautogui pillow
pip install scikit-learn nltk textblob
pip install beautifulsoup4 lxml
pip install pytest pytest-asyncio

# Executar scrapers
python -m lib.integrations.djen
python -m lib.integrations.pje

# Treinar modelos ML
python -m lib.ml.train_models

# Testes
pytest tests/ -v
pytest tests/integration/ -v

# Deploy
railway login
railway up
```

---

## 📝 TEMPLATES DE CÓDIGO

### DJEN Scraper
```python
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.chrome.service import Service
from typing import List, Dict
import logging

logger = logging.getLogger(__name__)

class DJENScraper:
    """Scraper para Diário de Justiça Eletrônico Nacional"""

    def __init__(self, headless: bool = True):
        options = webdriver.ChromeOptions()
        if headless:
            options.add_argument('--headless')
        options.add_argument('--no-sandbox')
        options.add_argument('--disable-dev-shm-usage')

        service = Service(ChromeDriverManager().install())
        self.driver = webdriver.Chrome(service=service, options=options)
        self.wait = WebDriverWait(self.driver, 10)

    def buscar_por_oab(self, numero_oab: str, uf: str) -> List[Dict]:
        """Busca publicações por número OAB"""
        try:
            logger.info(f"Buscando OAB {numero_oab}/{uf} no DJEN")

            self.driver.get("https://www.in.gov.br/consulta")

            # Preencher busca
            campo_busca = self.wait.until(
                EC.presence_of_element_located((By.ID, "campo-busca"))
            )
            campo_busca.clear()
            campo_busca.send_keys(f"OAB {uf} {numero_oab}")

            # Clicar em buscar
            btn_buscar = self.driver.find_element(By.ID, "btn-buscar")
            btn_buscar.click()

            # Aguardar resultados
            self.wait.until(
                EC.presence_of_element_located((By.CLASS_NAME, "resultado-item"))
            )

            # Extrair publicações
            publicacoes = []
            elementos = self.driver.find_elements(By.CLASS_NAME, "resultado-item")

            for el in elementos:
                publicacoes.append({
                    'data': el.find_element(By.CLASS_NAME, "data").text,
                    'orgao': el.find_element(By.CLASS_NAME, "orgao").text,
                    'texto': el.find_element(By.CLASS_NAME, "texto").text,
                    'url': el.find_element(By.TAG_NAME, "a").get_attribute("href")
                })

            logger.info(f"✅ {len(publicacoes)} publicações encontradas")
            return publicacoes

        except Exception as e:
            logger.error(f"❌ Erro ao buscar DJEN: {str(e)}")
            return []
        finally:
            self.driver.quit()

# Uso
if __name__ == "__main__":
    scraper = DJENScraper()
    publicacoes = scraper.buscar_por_oab("12345", "AL")
    print(f"Encontradas: {len(publicacoes)} publicações")
```

### PyAutoGUI Automation
```python
import pyautogui
import time
from typing import Tuple

class FormFiller:
    """Automação de preenchimento de formulários com PyAutoGUI"""

    def __init__(self):
        # Configurar segurança
        pyautogui.FAILSAFE = True  # Mover mouse para canto para parar
        pyautogui.PAUSE = 0.5  # Pausa entre comandos

    def preencher_peticao_inicial(self, dados: dict) -> bool:
        """Preenche formulário de petição inicial"""
        try:
            # Clicar no primeiro campo (ajustar coordenadas)
            pyautogui.click(x=100, y=200)
            time.sleep(0.5)

            # Nome do autor
            pyautogui.write(dados['nome_autor'])
            pyautogui.press('tab')

            # CPF
            pyautogui.write(dados['cpf'])
            pyautogui.press('tab')

            # Endereço
            pyautogui.write(dados['endereco'])
            pyautogui.press('tab')

            # Valor da causa
            pyautogui.write(str(dados['valor_causa']))
            pyautogui.press('tab')

            return True
        except Exception as e:
            print(f"❌ Erro: {str(e)}")
            return False

    def tirar_screenshot(self, filename: str = "screenshot.png"):
        """Captura screenshot da tela"""
        screenshot = pyautogui.screenshot()
        screenshot.save(filename)
        return filename

    def localizar_e_clicar(self, imagem: str, confianca: float = 0.8):
        """Localiza imagem na tela e clica"""
        try:
            posicao = pyautogui.locateCenterOnScreen(imagem, confidence=confianca)
            if posicao:
                pyautogui.click(posicao)
                return True
            return False
        except:
            return False
```

### Cron Jobs Manager
```python
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class CronJobsManager:
    """Gerenciador de jobs agendados"""

    def __init__(self):
        self.scheduler = BackgroundScheduler(timezone='America/Sao_Paulo')

    def start(self):
        """Inicia todos os jobs"""

        # Job 1: DJEN (2x/dia)
        self.scheduler.add_job(
            self.monitor_djen,
            CronTrigger(hour='12,20', minute='0'),
            id='djen_monitor',
            name='Monitor DJEN',
            replace_existing=True
        )

        # Job 2: DataJud (1x/dia)
        self.scheduler.add_job(
            self.sync_datajud,
            CronTrigger(hour='16', minute='0'),
            id='datajud_sync',
            name='Sync DataJud'
        )

        # Job 3: Fila agentes (15min)
        self.scheduler.add_job(
            self.process_agent_queue,
            'interval',
            minutes=15,
            id='agent_queue'
        )

        # Job 4: Prazos (1x/dia)
        self.scheduler.add_job(
            self.deadline_alerts,
            CronTrigger(hour='11', minute='55'),
            id='deadline_alerts'
        )

        # Job 5: Backup (1x/dia)
        self.scheduler.add_job(
            self.backup_database,
            CronTrigger(hour='3', minute='0'),
            id='backup'
        )

        self.scheduler.start()
        logger.info("✅ Cron jobs iniciados")

    def monitor_djen(self):
        from lib.integrations.djen import DJENScraper
        scraper = DJENScraper()
        publicacoes = scraper.buscar_novas_publicacoes()
        logger.info(f"📰 DJEN: {len(publicacoes)} novas")

    def sync_datajud(self):
        logger.info("🔄 DataJud sincronizado")

    def process_agent_queue(self):
        logger.info("🤖 Fila de agentes processada")

    def deadline_alerts(self):
        logger.info("⏰ Alertas de prazo enviados")

    def backup_database(self):
        logger.info("💾 Backup realizado")

    def stop(self):
        self.scheduler.shutdown()
```

### Modelo ML
```python
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import LabelEncoder
import pandas as pd
import pickle

class SuccessPredictor:
    """Modelo de predição de sucesso processual"""

    def __init__(self):
        self.model = RandomForestClassifier(n_estimators=100, random_state=42)
        self.encoders = {}

    def treinar(self, df: pd.DataFrame):
        """Treina modelo com dados históricos"""

        # Features
        features = ['tipo_acao', 'valor_causa', 'tribunal', 'tempo_tramitacao']
        X = df[features].copy()
        y = df['sucesso']  # 1 = sucesso, 0 = insucesso

        # Encoding
        for col in ['tipo_acao', 'tribunal']:
            self.encoders[col] = LabelEncoder()
            X[col] = self.encoders[col].fit_transform(X[col])

        # Treinar
        self.model.fit(X, y)

        # Validação cruzada
        scores = cross_val_score(self.model, X, y, cv=5)
        print(f"✅ Acurácia média: {scores.mean():.2%}")

        return scores.mean()

    def prever(self, caso: dict) -> float:
        """Prevê probabilidade de sucesso"""
        # Preparar features
        X = pd.DataFrame([caso])

        # Encoding
        for col, encoder in self.encoders.items():
            if col in X.columns:
                X[col] = encoder.transform(X[col])

        # Prever
        proba = self.model.predict_proba(X)[0][1]
        return proba

    def salvar(self, filename: str = "models/success_predictor.pkl"):
        """Salva modelo treinado"""
        with open(filename, 'wb') as f:
            pickle.dump({'model': self.model, 'encoders': self.encoders}, f)

    @classmethod
    def carregar(cls, filename: str = "models/success_predictor.pkl"):
        """Carrega modelo treinado"""
        with open(filename, 'rb') as f:
            data = pickle.load(f)

        predictor = cls()
        predictor.model = data['model']
        predictor.encoders = data['encoders']
        return predictor
```

---

## ✅ CHECKLIST DE ENTREGA (SEMANA 3)

### Dia 15-16: Selenium
- [ ] DJENScraper implementado
- [ ] PJeScraper implementado
- [ ] DataJud API client
- [ ] PyAutoGUI form filler
- [ ] ChromeDriver instalado
- [ ] Testes de scraping funcionando

### Dia 17: Cron Jobs
- [ ] CronJobsManager implementado
- [ ] 5 jobs configurados
- [ ] APScheduler rodando
- [ ] Logs estruturados
- [ ] Integração com backend

### Dia 18: ML
- [ ] 4 modelos implementados
- [ ] Dados sintéticos gerados
- [ ] Modelos treinados
- [ ] Modelos salvos em .pkl
- [ ] Integração com Streamlit

### Dia 19: Testes
- [ ] Suite pytest criada
- [ ] Testes unitários (20+)
- [ ] Testes integração (10+)
- [ ] Coverage > 70%
- [ ] CI/CD configurado

### Dia 20-21: Deploy
- [ ] Backend em Railway
- [ ] Streamlit em Cloud
- [ ] Variáveis configuradas
- [ ] DNS configurado
- [ ] SSL/TLS ativo
- [ ] Monitoramento ativo

### Final Semana 3
- [ ] Sistema 100% funcional
- [ ] Automações rodando
- [ ] ML predizendo
- [ ] Deploy em produção
- [ ] Documentação completa
- [ ] Sistema antigo desligado

---

## 🔗 COORDENAÇÃO COM OUTROS CHATS

### Com Chat 1 (Backend):
- Integrar scrapers nos routers
- Implementar endpoints de cron
- Testar performance

### Com Chat 2 (Frontend):
- Adicionar UI para controlar scrapers
- Exibir resultados ML
- Mostrar status dos jobs

---

## 📚 DOCUMENTOS DE REFERÊNCIA

- **Plano completo:** `PLANO_MIGRACAO_ACELERADA_PYTHON.md`
- **Instruções gerais:** `.github/copilot-instructions.md`
- **⚠️ MAPEAMENTO DE FUNCIONALIDADES:** `MAPEAMENTO_FUNCIONALIDADES.md` ⭐ **LEIA ANTES DE IMPLEMENTAR**
- **Sistema atual:** `api/cron.ts` (para referência de jobs e lógica)
- **Chrome Extension:** `chrome-extension-pje/` (para entender scraping PJe)

---

## 🚨 REGRAS IMPORTANTES

1. **⚠️ CONSULTAR MAPEAMENTO** - Ler `MAPEAMENTO_FUNCIONALIDADES.md` ANTES de implementar
2. **Preservar TODOS os cron jobs** - 8 jobs com horários exatos (UTC)
3. **Lógica de scraping compatível** - Selenium deve extrair mesmos dados que Extension
4. **Selenium headless** - `--headless` em produção
5. **Timeouts curtos** - 10s padrão
6. **Error handling** - try/except/finally sempre
7. **Logs detalhados** - logger.info/error
8. **PyAutoGUI FAILSAFE** - Sempre ativo
9. **ML com validação** - Cross-validation obrigatória
10. **Modelos versionados** - Salvar com data/versão
11. **Deploy incremental** - Staging → Produção

---

**Status:** ⏳ Aguardando conclusão da Semana 2 (Chat 2)
**Responsável:** Chat 3 - Automações e Deploy
**Contato com:** Chat 1 (Backend) e Chat 2 (Frontend)
