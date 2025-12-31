#!/bin/bash

# Post-create script for devcontainer setup
set -e

echo "🚀 Setting up development environment..."

# Upgrade pip and install build tools
echo "📦 Upgrading pip and installing build tools..."
python -m pip install --upgrade pip setuptools wheel

# Install Python dependencies
echo "📦 Installing Python dependencies..."
cd streamlit-app
pip install -r requirements.txt

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from example..."
    if [ -f .env.example ]; then
        cp .env.example .env
        echo "✅ Created .env from .env.example"
    else
        echo "⚠️ No .env.example found, creating basic .env file..."
        cat > .env << 'EOF'
# LangSmith Configuration
LANGSMITH_API_KEY=your_langsmith_api_key_here
LANGSMITH_PROJECT=legal-assistant-dev

# Google AI
GOOGLE_API_KEY=your_google_api_key_here

# Redis (local)
REDIS_URI_CUSTOM=redis://localhost:6379/0

# PostgreSQL (local)
POSTGRES_URI_CUSTOM=postgresql://user:pass@localhost:5432/legal_assistant
EOF
        echo "✅ Created basic .env file - please update with your credentials"
    fi
fi

# Install pre-commit hooks if available
if [ -f .pre-commit-config.yaml ]; then
    echo "🔧 Installing pre-commit hooks..."
    pip install pre-commit
    pre-commit install
fi

# Download NLTK data if needed
echo "📚 Downloading NLTK data..."
python -c "import nltk; nltk.download('punkt', quiet=True); nltk.download('stopwords', quiet=True); nltk.download('wordnet', quiet=True)" || true

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p .langgraph_api
mkdir -p logs

# Git configuration
echo "🔧 Configuring git..."
git config --global --add safe.directory /workspaces/*

cd ..

echo "✅ Setup complete! You can now run:"
echo "   cd streamlit-app"
echo "   streamlit run app.py"
echo "   or"
echo "   langgraph dev"
