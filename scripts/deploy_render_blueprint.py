import json

import requests

API_KEY = "rnd_FbkZVMfmVXk6zqnKExVsMYMNEFHT"
OWNER_ID = "tea-d58pgabuibrs73asqr8g"
REPO_URL = "https://github.com/portprojetoautomacao-debug/thiagobodevanadv-alt-assistente-jur-dico-principal"
HEADERS = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json",
    "Accept": "application/json",
}


def create_blueprint():
    print("🚀 Creating Render Blueprint...")
    payload = {
        "ownerId": OWNER_ID,
        "name": "assistente-juridico-blueprint",
        "repo": REPO_URL,
        "branch": "main",
        "autoDeploy": True,
    }

    response = requests.post(
        "https://api.render.com/v1/blueprints", headers=HEADERS, json=payload
    )

    if response.status_code == 201:
        data = response.json()
        print("✅ Blueprint created successfully!")
        print(f"Blueprint ID: {data['id']}")
        print(f"Status: {data['status']}")
        print("The services defined in render.yaml are being provisioned.")
    else:
        print(f"❌ Error creating blueprint: {response.status_code}")
        print(response.text)


if __name__ == "__main__":
    create_blueprint()
