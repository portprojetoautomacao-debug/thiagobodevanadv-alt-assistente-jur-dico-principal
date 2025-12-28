# 🚀 Guia de Migração - Opção 1: Repositórios Separados

**Estratégia Escolhida**: Repositórios Separados  
**Data de Decisão**: 28/12/2024  
**Status**: Em Implementação

---

## 🎯 Objetivo

Separar completamente os aplicativos **Python/Streamlit** e **TypeScript/React** em dois repositórios independentes, eliminando todos os conflitos e permitindo desenvolvimento e deploy independentes.

---

## 📋 Plano de Execução

### Fase 1: Preparação ✅ (Concluída)
- [x] Documentação completa criada
- [x] Conflitos mapeados
- [x] Estratégia aprovada

### Fase 2: Validação Python (Em andamento)
- [ ] Executar testes Python
- [ ] Validar integrações
- [ ] Verificar dependências

### Fase 3: Criar Repositório Python
- [ ] Criar novo repositório `assistente-juridico-python`
- [ ] Copiar conteúdo de `streamlit-app/`
- [ ] Mover documentação relevante
- [ ] Configurar GitHub Actions

### Fase 4: Limpar Repositório TypeScript
- [ ] Remover `streamlit-app/` do repo atual
- [ ] Manter apenas código TypeScript
- [ ] Atualizar documentação principal

### Fase 5: Deploy e Validação
- [ ] Deploy Python (Render.com)
- [ ] Deploy TypeScript (Vercel - já existe)
- [ ] Testar ambos funcionando

---

## 📦 Novo Repositório Python

### Informações

**Nome**: `assistente-juridico-python`  
**Descrição**: Sistema de gestão jurídica com Python, Streamlit, FastAPI e Machine Learning  
**Visibilidade**: Privado (mesmo do atual)

### Estrutura Final

```
assistente-juridico-python/
├── .github/
│   └── workflows/
│       ├── tests.yml
│       └── deploy.yml
├── lib/
│   ├── agents/          (15 agentes)
│   ├── integrations/    (DJEN, DataJud, PJe, Google)
│   ├── ml/             (3 modelos)
│   └── automation/
├── backend/
│   ├── main.py
│   ├── routers/
│   └── cron_jobs.py
├── pages/              (8 páginas Streamlit)
├── tests/              (12 arquivos pytest)
├── docs/
│   ├── ARCHITECTURE.md
│   ├── DEPLOY.md
│   └── API.md
├── scripts/
├── .env.example
├── requirements.txt
├── render.yaml
├── README.md
├── LICENSE
└── .gitignore
```

---

## 🔧 Passos Detalhados

### 1. Criar Novo Repositório no GitHub

```bash
# Via GitHub Web UI
1. Acessar https://github.com/organizations/portprojetoautomacao-debug/repositories/new
2. Nome: assistente-juridico-python
3. Descrição: Sistema de gestão jurídica com Python/Streamlit, FastAPI e ML
4. Privado: Sim
5. Criar repositório
```

### 2. Clonar e Preparar Repositório Python

```bash
# Em sua máquina local
git clone https://github.com/portprojetoautomacao-debug/assistente-juridico-python.git
cd assistente-juridico-python

# Copiar conteúdo de streamlit-app/
cp -r ../thiagobodevanadv-alt-assistente-jur-dico-principal/streamlit-app/* .

# Mover para raiz
mv app.py .
mv backend/ .
mv lib/ .
mv pages/ .
mv tests/ .
mv requirements.txt .
mv render.yaml .
```

### 3. Criar Documentação Específica

```bash
mkdir docs

# Copiar docs relevantes do repo original
cp ../thiagobodevanadv-alt-assistente-jur-dico-principal/docs/PYTHON_APP_ARCHITECTURE.md docs/ARCHITECTURE.md
cp ../thiagobodevanadv-alt-assistente-jur-dico-principal/docs/LGPD_COMPLIANCE.md docs/
```

### 4. Criar README Principal

```bash
# Usar o streamlit-app/README.md como base
cp ../thiagobodevanadv-alt-assistente-jur-dico-principal/streamlit-app/README.md README.md

# Editar para remover referências ao repo TypeScript
```

### 5. Criar .gitignore Específico Python

```bash
cat > .gitignore << 'EOF'
# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
build/
develop-eggs/
dist/
downloads/
eggs/
.eggs/
lib64/
parts/
sdist/
var/
wheels/
*.egg-info/
.installed.cfg
*.egg

# Virtual Environment
venv/
ENV/
env/
.venv

# Streamlit
.streamlit/secrets.toml
.streamlit/config.toml

# IDEs
.vscode/
.idea/
*.swp
*.swo

# Environment
.env
.env.local

# Testing
.pytest_cache/
.coverage
htmlcov/

# OS
.DS_Store
Thumbs.db

# Logs
*.log
EOF
```

### 6. Configurar GitHub Actions

```bash
mkdir -p .github/workflows

cat > .github/workflows/tests.yml << 'EOF'
name: Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Python 3.11
      uses: actions/setup-python@v4
      with:
        python-version: '3.11'
    
    - name: Install dependencies
      run: |
        python -m pip install --upgrade pip
        pip install -r requirements.txt
        pip install pytest pytest-cov
    
    - name: Run tests
      run: |
        pytest tests/ -v --cov=lib --cov=backend
    
    - name: Upload coverage
      uses: codecov/codecov-action@v3
EOF
```

### 7. Commit Inicial

```bash
git add .
git commit -m "Initial commit: Python/Streamlit app separated from TypeScript repo"
git push origin main
```

---

## 🧹 Limpar Repositório TypeScript Atual

### No Repositório Principal

```bash
cd thiagobodevanadv-alt-assistente-jur-dico-principal

# Remover diretório streamlit-app/
git rm -r streamlit-app/

# Remover requirements.txt da raiz (DSPy Bridge pode ficar em scripts/)
git rm requirements.txt

# Atualizar .gitignore para remover regras Python
# Editar manualmente para manter apenas regras TypeScript/Node.js

# Commit
git add .
git commit -m "Remove Python app (moved to assistente-juridico-python repo)"
git push origin main
```

### Atualizar README Principal

```bash
# Adicionar link para novo repositório Python
# Explicar que agora são dois repos separados
```

---

## 📝 Documentação a Atualizar

### No Repositório Python

1. **README.md** - Guia completo do app Python
2. **docs/ARCHITECTURE.md** - Arquitetura detalhada
3. **docs/DEPLOY.md** - Guia de deploy (Render/Railway)
4. **docs/API.md** - Documentação da API FastAPI
5. **CONTRIBUTING.md** - Como contribuir
6. **LICENSE** - Licença (MIT)

### No Repositório TypeScript

1. **README.md** - Adicionar seção sobre repo Python
2. **docs/** - Manter apenas docs TypeScript
3. Remover referências ao Python

---

## 🚀 Deploy

### Python (Render.com)

```bash
# No Render.com Dashboard
1. New Web Service
2. Connect Repository: assistente-juridico-python
3. Name: assistente-juridico-pje-python
4. Environment: Python
5. Build Command: pip install -r requirements.txt
6. Start Command: streamlit run app.py --server.port=$PORT
7. Plan: Free (ou Starter $7/mês)
8. Environment Variables:
   - UPSTASH_REDIS_REST_URL
   - UPSTASH_REDIS_REST_TOKEN
   - GEMINI_API_KEY
9. Deploy
```

### TypeScript (Vercel - já existe)

Nenhuma mudança necessária, apenas remover streamlit-app/ do repo.

---

## ✅ Checklist de Validação

### Antes da Separação
- [ ] Todos os testes Python passando
- [ ] Integrações validadas (DJEN, DataJud)
- [ ] Backup do repo atual criado
- [ ] Documentação revisada

### Durante a Separação
- [ ] Novo repo Python criado
- [ ] Código copiado corretamente
- [ ] .gitignore configurado
- [ ] GitHub Actions configuradas
- [ ] README atualizado

### Após a Separação
- [ ] Testes Python passando no novo repo
- [ ] Deploy Python funcionando
- [ ] Repo TypeScript limpo
- [ ] Links entre repos atualizados
- [ ] Documentação sincronizada

---

## 🔄 Rollback Plan

Se algo der errado:

```bash
# 1. Não deletar streamlit-app/ até confirmar que novo repo funciona
# 2. Manter backup local:
cp -r streamlit-app/ ~/backup-streamlit-app-$(date +%Y%m%d)

# 3. Se precisar reverter:
git revert <commit-hash>
git push origin main
```

---

## 📞 Comunicação

### Para a Equipe

**Anúncio**:
```
📢 Mudança de Repositórios

A partir de hoje, temos dois repositórios separados:

1. TypeScript/React (Produção):
   https://github.com/portprojetoautomacao-debug/thiagobodevanadv-alt-assistente-jur-dico-principal

2. Python/Streamlit (Admin/ML):
   https://github.com/portprojetoautomacao-debug/assistente-juridico-python

Razão: Eliminar conflitos de dependências e deploy.

Impacto: Desenvolvimento mais limpo e independente.
```

---

## 📈 Timeline Estimada

| Fase | Duração | Status |
|------|---------|--------|
| Preparação | 4 horas | ✅ Concluída |
| Validação Python | 2 horas | 🔄 Em andamento |
| Criar Repo Python | 1 hora | ⏳ Pendente |
| Limpar Repo TypeScript | 30 min | ⏳ Pendente |
| Deploy e Validação | 2 horas | ⏳ Pendente |
| **TOTAL** | **~10 horas** | **40% completo** |

---

## 🎯 Resultado Esperado

Ao final da migração:

✅ **Repositório Python**:
- Código limpo e independente
- Deploy em Render.com
- CI/CD configurado
- Documentação completa

✅ **Repositório TypeScript**:
- Apenas código TypeScript/React
- Deploy em Vercel (existente)
- Sem conflitos Python
- Documentação atualizada

✅ **Benefícios**:
- Zero conflitos de dependências
- Deploys independentes
- CI/CD específico para cada tecnologia
- Manutenção mais fácil
- Histórico Git limpo para cada app

---

**Autor**: GitHub Copilot  
**Data**: 28/12/2024  
**Status**: Em Execução  
**Próximo**: Validar testes Python
