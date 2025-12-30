"""
Configuração centralizada do app Streamlit.
"""

import os
from pathlib import Path

from dotenv import load_dotenv

# Load .env
env_path = Path(__file__).parent.parent / ".env"
load_dotenv(env_path)

# App Config
APP_CONFIG = {
    "title": os.getenv("APP_TITLE", "Assistente Jurídico PJe"),
    "icon": os.getenv("APP_ICON", "⚖️"),
    "layout": os.getenv("APP_LAYOUT", "wide"),
    "debug": os.getenv("DEBUG", "false").lower() == "true",
}

# Backend React/Vercel
_react_api_url = os.getenv("REACT_API_URL", "http://localhost:8000/api")

# Ensure URL has schema
if not _react_api_url.startswith("http"):
    _react_api_url = f"https://{_react_api_url}"

# Ensure URL ends with /api if not present (assuming standard Render host)
if "onrender.com" in _react_api_url and not _react_api_url.endswith("/api"):
    _react_api_url = f"{_react_api_url}/api"

BACKEND_CONFIG = {
    "url": _react_api_url,
    "api_key": os.getenv("REACT_API_KEY", ""),
    "timeout": 30,
}

# Redis (Upstash)
REDIS_CONFIG = {
    "url": os.getenv("UPSTASH_REDIS_REST_URL", ""),
    "token": os.getenv("UPSTASH_REDIS_REST_TOKEN", ""),
}

# LLM Providers
LLM_CONFIG = {
    "gemini_api_key": os.getenv("GEMINI_API_KEY", "")
    or os.getenv("GOOGLE_API_KEY", ""),
    "openai_api_key": os.getenv("OPENAI_API_KEY", ""),
    "default_provider": "gemini",
    "temperature": 0.7,
    "max_tokens": 2000,
}

# Qdrant
QDRANT_CONFIG = {
    "url": os.getenv("QDRANT_URL", ""),
    "api_key": os.getenv("QDRANT_API_KEY", ""),
    "collection": os.getenv("QDRANT_COLLECTION", "legal_docs"),
    "vector_size": 768,
}

# Selenium
SELENIUM_CONFIG = {
    "headless": os.getenv("SELENIUM_HEADLESS", "true").lower() == "true",
    "timeout": int(os.getenv("SELENIUM_TIMEOUT", "30")),
    "driver": "chrome",
}

# PyAutoGUI
PYAUTOGUI_CONFIG = {
    "failsafe": os.getenv("PYAUTOGUI_FAILSAFE", "true").lower() == "true",
    "pause": float(os.getenv("PYAUTOGUI_PAUSE", "0.5")),
}

# DJEN
DJEN_CONFIG = {
    "url": os.getenv("DJEN_URL", ""),
    "check_interval": int(os.getenv("DJEN_CHECK_INTERVAL", "3600")),
}

# Sentry
SENTRY_CONFIG = {
    "dsn": os.getenv("SENTRY_DSN", ""),
    "environment": os.getenv("SENTRY_ENVIRONMENT", "development"),
    "traces_sample_rate": 0.1,
}


def load_config():
    """Valida e retorna todas as configs."""
    return {
        "app": APP_CONFIG,
        "backend": BACKEND_CONFIG,
        "redis": REDIS_CONFIG,
        "llm": LLM_CONFIG,
        "qdrant": QDRANT_CONFIG,
        "selenium": SELENIUM_CONFIG,
        "pyautogui": PYAUTOGUI_CONFIG,
        "djen": DJEN_CONFIG,
        "sentry": SENTRY_CONFIG,
    }
