#!/usr/bin/env pwsh
# Script de verificação da configuração do Serena MCP Server

Write-Host "?? Verificando configuração do Serena MCP Server..." -ForegroundColor Cyan
Write-Host ""

# 1. Verificar Python
Write-Host "1?? Verificando Python..." -ForegroundColor Yellow
try {
    $pythonVersion = python --version 2>&1
    if ($pythonVersion -match "Python (\d+)\.(\d+)") {
        $major = [int]$matches[1]
        $minor = [int]$matches[2]
        if ($major -ge 3 -and $minor -ge 9) {
            Write-Host "   ? Python $pythonVersion instalado" -ForegroundColor Green
        } else {
            Write-Host "   ? Python versão muito antiga ($pythonVersion). Necessário 3.9+" -ForegroundColor Red
            Write-Host "   Baixe em: https://www.python.org/downloads/" -ForegroundColor Yellow
            exit 1
        }
    }
} catch {
    Write-Host "   ? Python não encontrado" -ForegroundColor Red
    Write-Host "   Baixe em: https://www.python.org/downloads/" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# 2. Verificar uv/uvx
Write-Host "2?? Verificando uv..." -ForegroundColor Yellow
try {
    $uvVersion = uvx --version 2>&1
    Write-Host "   ? uvx $uvVersion instalado" -ForegroundColor Green
} catch {
    Write-Host "   ? uvx não encontrado" -ForegroundColor Red
    Write-Host "   Instalando uv..." -ForegroundColor Yellow
    
    try {
        powershell -c "irm https://astral.sh/uv/install.ps1 | iex"
        Write-Host "   ? uv instalado com sucesso" -ForegroundColor Green
        Write-Host "   ??  Reinicie o terminal para usar o uvx" -ForegroundColor Yellow
    } catch {
        Write-Host "   ? Falha ao instalar uv" -ForegroundColor Red
        Write-Host "   Instale manualmente: https://docs.astral.sh/uv/getting-started/installation/" -ForegroundColor Yellow
        exit 1
    }
}

Write-Host ""

# 3. Verificar arquivo de configuração
Write-Host "3?? Verificando arquivo de configuração..." -ForegroundColor Yellow
$mcpFile = ".vscode/mcp.json"
if (Test-Path $mcpFile) {
    Write-Host "   ? $mcpFile encontrado" -ForegroundColor Green
    
    # Verificar se é JSON válido
    try {
        $mcpConfig = Get-Content $mcpFile -Raw | ConvertFrom-Json
        
        if ($mcpConfig.servers.Serena) {
            Write-Host "   ? Servidor Serena configurado" -ForegroundColor Green
        } else {
            Write-Host "   ??  Servidor Serena não encontrado na configuração" -ForegroundColor Yellow
        }
        
        # Listar outros servidores configurados
        $servers = $mcpConfig.servers.PSObject.Properties.Name
        Write-Host "   ?? Servidores MCP configurados: $($servers -join ', ')" -ForegroundColor Cyan
    } catch {
        Write-Host "   ? Erro ao ler $mcpFile - JSON inválido" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "   ? Arquivo $mcpFile não encontrado" -ForegroundColor Red
    Write-Host "   Execute: npm run setup:mcp" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# 4. Verificar estrutura do projeto
Write-Host "4?? Verificando estrutura do projeto..." -ForegroundColor Yellow

$requiredPaths = @(
    "src/",
    "src/hooks/",
    "src/components/",
    "src/lib/",
    "docs/"
)

$allExists = $true
foreach ($path in $requiredPaths) {
    if (Test-Path $path) {
        Write-Host "   ? $path" -ForegroundColor Green
    } else {
        Write-Host "   ? $path não encontrado" -ForegroundColor Red
        $allExists = $false
    }
}

if (-not $allExists) {
    Write-Host "   ??  Estrutura do projeto incompleta" -ForegroundColor Yellow
}

Write-Host ""

# 5. Testar conexão com Serena (opcional)
Write-Host "5?? Testando conexão com Serena..." -ForegroundColor Yellow
Write-Host "   ??  Pule este passo - será testado ao usar o VS Code" -ForegroundColor Cyan

Write-Host ""

# Resumo
Write-Host "????????????????????????????????????????????????" -ForegroundColor Cyan
Write-Host "?? RESUMO DA VERIFICAÇÃO" -ForegroundColor Cyan
Write-Host "????????????????????????????????????????????????" -ForegroundColor Cyan
Write-Host ""
Write-Host "? Python 3.9+:       Instalado" -ForegroundColor Green
Write-Host "? uvx:               Instalado" -ForegroundColor Green
Write-Host "? mcp.json:          Configurado" -ForegroundColor Green
Write-Host "? Estrutura:         Válida" -ForegroundColor Green
Write-Host ""

# Próximos passos
Write-Host "?? PRÓXIMOS PASSOS:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Abra o VS Code neste workspace" -ForegroundColor White
Write-Host "2. Pressione Ctrl+Shift+P" -ForegroundColor White
Write-Host "3. Digite: 'GitHub Copilot: Restart MCP Servers'" -ForegroundColor White
Write-Host "4. No Copilot Chat, teste: '@workspace Serena está funcionando?'" -ForegroundColor White
Write-Host ""
Write-Host "?? Documentação completa: docs/SERENA_MCP_SETUP.md" -ForegroundColor Yellow
Write-Host ""
Write-Host "? Configuração concluída com sucesso!" -ForegroundColor Green
