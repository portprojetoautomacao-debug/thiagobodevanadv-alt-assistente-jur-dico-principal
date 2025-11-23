#!/bin/bash
set -e

# Configurações
PROJECT_ID="sonic-terminal-474321-s1"
REGION="us-central1"
CLUSTER_NAME="autopilot-cluster-1"

echo "🔐 Criando secrets no Google Secret Manager..."

# Verificar se gcloud está configurado
if ! command -v gcloud &> /dev/null; then
    echo "❌ Erro: gcloud CLI não encontrado."
    exit 1
fi

# Criar secrets no Secret Manager (se não existirem)
create_secret() {
    local SECRET_NAME=$1
    local SECRET_VALUE=$2
    
    # Verificar se o secret já existe
    if gcloud secrets describe $SECRET_NAME --project=$PROJECT_ID &> /dev/null; then
        echo "⏭️  Secret '$SECRET_NAME' já existe, atualizando versão..."
        echo -n "$SECRET_VALUE" | gcloud secrets versions add $SECRET_NAME --data-file=- --project=$PROJECT_ID
    else
        echo "➕ Criando secret '$SECRET_NAME'..."
        echo -n "$SECRET_VALUE" | gcloud secrets create $SECRET_NAME --data-file=- --project=$PROJECT_ID
    fi
}

# Ler valores do .env local (se existir)
if [ -f .env ]; then
    echo "📖 Lendo configurações do arquivo .env..."
    source .env
else
    echo "⚠️  Arquivo .env não encontrado. Por favor, configure as variáveis manualmente."
    exit 1
fi

# Criar secrets
create_secret "assistente-juridico-app-env" "${VITE_APP_ENV:-production}"
create_secret "assistente-juridico-google-client-id" "$VITE_GOOGLE_CLIENT_ID"
create_secret "assistente-juridico-google-api-key" "$VITE_GOOGLE_API_KEY"
create_secret "assistente-juridico-todoist-api-key" "$VITE_TODOIST_API_KEY"

echo "🔌 Conectando ao cluster GKE..."
gcloud container clusters get-credentials $CLUSTER_NAME --region $REGION --project $PROJECT_ID

echo "📦 Criando Kubernetes Secrets a partir do Secret Manager..."

# Criar namespace (se não existir)
kubectl create namespace assistente-juridico --dry-run=client -o yaml | kubectl apply -f -

# Criar Kubernetes secret com referências ao Secret Manager
cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: Secret
metadata:
  name: assistente-juridico-secrets
  namespace: default
type: Opaque
stringData:
  app-env: "${VITE_APP_ENV:-production}"
  google-client-id: "$VITE_GOOGLE_CLIENT_ID"
  google-api-key: "$VITE_GOOGLE_API_KEY"
  todoist-api-key: "$VITE_TODOIST_API_KEY"
EOF

echo "✅ Secrets configurados com sucesso!"
echo ""
echo "📝 Próximos passos:"
echo "1. Execute: skaffold run --default-repo=gcr.io/$PROJECT_ID"
echo "2. Ou use o Cloud Code no VS Code para fazer deploy"
