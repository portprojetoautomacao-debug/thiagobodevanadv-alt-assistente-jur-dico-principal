import json
import time

import requests

API_KEY = "rnd_FbkZVMfmVXk6zqnKExVsMYMNEFHT"
OWNER_ID = "tea-d58pgabuibrs73asqr8g"
REPO_URL = "https://github.com/portprojetoautomacao-debug/thiagobodevanadv-alt-assistente-jur-dico-principal"
HEADERS = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json",
    "Accept": "application/json",
}


def create_service(payload):
    response = requests.post(
        "https://api.render.com/v1/services", headers=HEADERS, json=payload
    )
    if response.status_code == 201:
        return response.json()
    else:
        print(f"Error creating service: {response.status_code}")
        print(response.text)
        return None


def main():
    print("🚀 Starting Render Deployment via API...")

    # 1. Create Backend
    print("\n📡 Creating Backend Service...")
    backend_payload = {
        "ownerId": OWNER_ID,
        "name": "assistente-juridico-backend",
        "repo": REPO_URL,
        "branch": "main",
        "rootDir": "streamlit-app",
        "serviceDetails": {
            "type": "web_service",
            "env": "python",
            "region": "oregon",
            "plan": "free",
            "buildCommand": "pip install -r requirements.txt",
            "startCommand": "uvicorn backend.main:app --host 0.0.0.0 --port $PORT",
            "envVars": [
                {"key": "PYTHON_VERSION", "value": "3.11.7"},
                {
                    "key": "GEMINI_API_KEY",
                    "value": "AIzaSyCpQSA3H1t_eD6GyRXx1JQrrFS0rfX4vvQ",
                },
                {
                    "key": "ALLOWED_ORIGINS",
                    "value": "https://assistente-juridico-streamlit.onrender.com",
                },
                {"key": "DJEN_USERNAME", "value": "placeholder"},
                {"key": "DJEN_PASSWORD", "value": "placeholder"},
                {"key": "UPSTASH_REDIS_REST_URL", "value": "placeholder"},
                {"key": "UPSTASH_REDIS_REST_TOKEN", "value": "placeholder"},
            ],
        },
    }

    backend_response = create_service(backend_payload)
    if not backend_response:
        return

    backend_url = backend_response["service"]["serviceDetails"]["url"]
    print(f"✅ Backend created! URL: {backend_url}")

    # 2. Create Frontend
    print("\n💻 Creating Frontend Service...")
    frontend_payload = {
        "ownerId": OWNER_ID,
        "name": "assistente-juridico-streamlit",
        "repo": REPO_URL,
        "branch": "main",
        "rootDir": "streamlit-app",
        "serviceDetails": {
            "type": "web_service",
            "env": "python",
            "region": "oregon",
            "plan": "free",
            "buildCommand": "pip install -r requirements.txt",
            "startCommand": "streamlit run app.py --server.port $PORT --server.address 0.0.0.0",
            "envVars": [
                {"key": "PYTHON_VERSION", "value": "3.11.7"},
                {
                    "key": "GEMINI_API_KEY",
                    "value": "AIzaSyCpQSA3H1t_eD6GyRXx1JQrrFS0rfX4vvQ",
                },
                {
                    "key": "QDRANT_URL",
                    "value": "https://4aee698c-53f6-4571-8f41-eb80f56ff1f2.us-east4-0.gcp.cloud.qdrant.io:6333",
                },
                {
                    "key": "QDRANT_API_KEY",
                    "value": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3MiOiJtIn0.TqZHXs0l7tUQRRrKTI4EO44Yao5QXg2zosFL1pl8IJo",
                },
                {"key": "REACT_API_URL", "value": backend_url},
            ],
        },
    }

    frontend_response = create_service(frontend_payload)
    if frontend_response:
        frontend_url = frontend_response["service"]["serviceDetails"]["url"]
        print(f"✅ Frontend created! URL: {frontend_url}")
        print("\n🎉 Deployment configuration complete!")
        print(f"Backend: {backend_url}")
        print(f"Frontend: {frontend_url}")


if __name__ == "__main__":
    main()
