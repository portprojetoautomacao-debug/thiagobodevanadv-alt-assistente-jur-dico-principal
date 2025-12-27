#!/bin/bash

# Heavy Processor Quick Start
# Inicializa o microserviço Java 21 localmente

set -e

echo "🚀 Heavy Processor - Quick Start"
echo "=================================="
echo ""

cd "$(dirname "$0")/../microservices/heavy-processor"

# Verifica Java 21
echo "📋 Verificando Java 21..."
java_version=$(java -version 2>&1 | head -n 1 | cut -d'"' -f2 | cut -d'.' -f1)

if [ "$java_version" != "21" ]; then
    echo "❌ Java 21 não encontrado!"
    echo "Versão atual: $java_version"
    echo ""
    echo "Instale Java 21 LTS:"
    echo "  - SDKMAN: sdk install java 21-open"
    echo "  - Homebrew: brew install openjdk@21"
    echo "  - Manual: https://adoptium.net/"
    exit 1
fi

echo "✅ Java 21.0.$(java -version 2>&1 | grep version | cut -d'.' -f3 | cut -d'_' -f1) detectado"
echo ""

# Build com Maven
echo "🔨 Building com Maven..."
if ! command -v mvn &> /dev/null; then
    echo "❌ Maven não encontrado!"
    echo "Instale: brew install maven (macOS) ou apt install maven (Linux)"
    exit 1
fi

mvn clean package -DskipTests

echo ""
echo "✅ Build concluído!"
echo ""

# Iniciar aplicação
echo "🌐 Iniciando Heavy Processor na porta 8080..."
echo ""
java -jar target/heavy-processor-1.0.0.jar

# Health check
echo ""
echo "🏥 Health Check: http://localhost:8080/actuator/health"
echo "📊 API Endpoint: http://localhost:8080/api/v1/process/batch"
echo ""
echo "Para testar:"
echo "  curl http://localhost:8080/actuator/health"
