"""
Configuração do Backend
========================
Carrega variáveis de ambiente e configurações do sistema.
"""

import os
from pathlib import Path
from dotenv import load_dotenv

# Carregar .env do diretório backend
env_path = Path(__file__).parent.parent / ".env"
load_dotenv(dotenv_path=env_path, override=True)


def load_config() -> dict:
    """
    Carrega configurações do ambiente.

    Returns:
        dict: Dicionário com configurações
    """
    return {
        # Redis/Upstash
        "redis_url": os.getenv("REDIS_URL", ""),
        "upstash_redis_rest_url": os.getenv("UPSTASH_REDIS_REST_URL", ""),
        "upstash_redis_rest_token": os.getenv("UPSTASH_REDIS_REST_TOKEN", ""),

        # Environment
        "environment": os.getenv("ENVIRONMENT", "development"),
        "log_level": os.getenv("LOG_LEVEL", "INFO"),
        "debug": os.getenv("DEBUG", "false").lower() == "true",

        # API Keys (opcional)
        "gemini_api_key": os.getenv("VITE_GEMINI_API_KEY", ""),
        "openai_api_key": os.getenv("VITE_OPENAI_API_KEY", ""),
    }


def get_redis_config() -> dict:
    """
    Retorna apenas configurações do Redis.

    Returns:
        dict: Configurações Redis
    """
    config = load_config()
    return {
        "url": config["redis_url"],
        "rest_url": config["upstash_redis_rest_url"],
        "rest_token": config["upstash_redis_rest_token"],
    }


# Exportar config global
CONFIG = load_config()
