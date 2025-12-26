# 🚀 Guia Completo: GitLab CI/CD + Kubernetes + VS Code

## ✅ O QUE FOI CONFIGURADO

### 1️⃣ Pipeline GitLab CI/CD Completo

**Stages:**
- ✅ **build** - Compila aplicação (Node 22)
- ✅ **test** - Testes + Lint + Coverage
- ✅ **docker** - Build e push de imagens Docker
- ✅ **deploy** - Deploy Kubernetes (staging/production)

**Features:**
- ✅ Cache de `node_modules`
- ✅ Artifacts preservados
- ✅ Coverage report
- ✅ Docker multi-stage build
- ✅ Deploy real Kubernetes
- ✅ Ambientes separados

---

## 📊 USAR O PIPELINE

### Build Automático
```bash
git add .
git commit -m "feat: minha funcionalidade"
git push origin main
```

Pipeline roda automaticamente:
1. ✅ Build (sempre)
2. ✅ Test (sempre)
3. 🔧 Docker (manual)
4. 🔧 Deploy (manual)

### Deploy Staging
1. Acesse: https://gitlab.com/portprojetoautomacao-debug/thiagobodevanadv-alt-assistente-jur-dico-principal/-/pipelines
2. Clique no pipeline
3. Stage "docker" → Clique ▶️ em `docker_build`
4. Stage "deploy" → Clique ▶️ em `deploy_staging`

### Deploy Production
```bash
git tag v1.0.0
git push --tags
```

Pipeline cria nova execução para a tag:
1. Acesse o pipeline da tag
2. Clique ▶️ em `docker_build`
3. Clique ▶️ em `deploy_production`

---

## ☸️ CONFIGURAR KUBERNETES (Opcional)

### Se quiser deploy REAL funcionando:

1. **Iniciar Minikube:**
```bash
minikube start
minikube addons enable ingress
```

2. **Criar namespaces:**
```bash
kubectl create namespace staging
kubectl create namespace production
```

3. **Criar deployment:**
```bash
kubectl create deployment assistente-juridico \
  --image=registry.gitlab.com/portprojetoautomacao-debug/thiagobodevanadv-alt-assistente-jur-dico-principal:latest \
  --replicas=3 \
  -n staging

kubectl create deployment assistente-juridico \
  --image=registry.gitlab.com/portprojetoautomacao-debug/thiagobodevanadv-alt-assistente-jur-dico-principal:latest \
  --replicas=3 \
  -n production
```

4. **Configurar GitLab Runner (para acessar Kubernetes):**
```bash
# Instalar runner
curl -L https://packages.gitlab.com/install/repositories/runner/gitlab-runner/script.deb.sh | sudo bash
sudo apt-get install gitlab-runner

# Registrar runner
sudo gitlab-runner register \
  --url https://gitlab.com/ \
  --token SEU_REGISTRATION_TOKEN \
  --executor shell \
  --description "Minikube Runner"
```

**Registration Token:**
https://gitlab.com/portprojetoautomacao-debug/thiagobodevanadv-alt-assistente-jur-dico-principal/-/settings/ci_cd
(expanda "Runners" → copie o token)

---

## 🦊 CONFIGURAR GITLAB WORKFLOW NO VS CODE

### Método Rápido:
```bash
./setup-gitlab-workflow-vscode.sh
```

### Método Manual:

1. **Criar Personal Access Token:**
   - https://gitlab.com/-/user_settings/personal_access_tokens
   - Nome: `VS Code GitLab Workflow`
   - Scopes: `api`, `read_user`, `read_repository`, `write_repository`
   - Copiar token

2. **Configurar no VS Code:**
   - Pressione `Ctrl+Shift+P`
   - Digite: `GitLab: Authenticate`
   - URL: `https://gitlab.com`
   - Cole o token
   - Pressione Enter

3. **Recursos disponíveis:**
   - 📊 Barra inferior: Status do pipeline
   - 🔍 Sidebar GitLab: Issues, MRs, Pipelines
   - ⌨️ Comandos: `Ctrl+Shift+P` → `GitLab: ...`

---

## 🐳 DOCKER REGISTRY

### GitLab Container Registry (Grátis)

**Suas imagens:**
- `registry.gitlab.com/portprojetoautomacao-debug/thiagobodevanadv-alt-assistente-jur-dico-principal:latest`
- `registry.gitlab.com/portprojetoautomacao-debug/thiagobodevanadv-alt-assistente-jur-dico-principal:abc1234` (commit SHA)

**Login local:**
```bash
docker login registry.gitlab.com
# Username: thiagobodevan-a11y
# Password: seu_personal_access_token
```

**Pull:**
```bash
docker pull registry.gitlab.com/portprojetoautomacao-debug/thiagobodevanadv-alt-assistente-jur-dico-principal:latest
```

**Run:**
```bash
docker run -p 10000:10000 \
  registry.gitlab.com/portprojetoautomacao-debug/thiagobodevanadv-alt-assistente-jur-dico-principal:latest
```

---

## 📈 COVERAGE REPORT

Coverage é calculado automaticamente no job `test_app`.

**Ver no GitLab:**
1. Pipeline → Job `test_app`
2. Clique em "Coverage"
3. Veja % de cobertura

**Badge no README:**
```markdown
[![Coverage](https://gitlab.com/portprojetoautomacao-debug/thiagobodevanadv-alt-assistente-jur-dico-principal/badges/main/coverage.svg)](https://gitlab.com/portprojetoautomacao-debug/thiagobodevanadv-alt-assistente-jur-dico-principal/-/graphs/main/charts)
```

---

## 🔧 TROUBLESHOOTING

### Pipeline falha no docker_build
**Causa:** Variáveis `CI_REGISTRY_*` não configuradas

**Solução:** Vá em Settings > CI/CD > Variables e adicione:
- `CI_REGISTRY`: `registry.gitlab.com`
- `CI_REGISTRY_USER`: `thiagobodevan-a11y`
- `CI_REGISTRY_PASSWORD`: seu personal access token

### Deploy falha "kubeconfig not found"
**Causa:** Runner não tem acesso ao Kubernetes

**Solução:** Use GitLab Runner local (veja seção Kubernetes acima)

### Tests não geram coverage
**Causa:** Vitest precisa de configuração

**Solução:** Já configurado! Apenas rode `npm run test -- --coverage`

---

## 📚 LINKS ÚTEIS

- **Pipeline:** https://gitlab.com/portprojetoautomacao-debug/thiagobodevanadv-alt-assistente-jur-dico-principal/-/pipelines
- **Container Registry:** https://gitlab.com/portprojetoautomacao-debug/thiagobodevanadv-alt-assistente-jur-dico-principal/container_registry
- **Environments:** https://gitlab.com/portprojetoautomacao-debug/thiagobodevanadv-alt-assistente-jur-dico-principal/-/environments
- **CI/CD Settings:** https://gitlab.com/portprojetoautomacao-debug/thiagobodevanadv-alt-assistente-jur-dico-principal/-/settings/ci_cd
- **Coverage:** https://gitlab.com/portprojetoautomacao-debug/thiagobodevanadv-alt-assistente-jur-dico-principal/-/graphs/main/charts

---

## 🎯 PRÓXIMOS PASSOS

1. ✅ Pipeline funcionando (FEITO!)
2. ⏳ Criar Personal Access Token
3. ⏳ Configurar GitLab Workflow
4. ⏳ Testar docker_build
5. ⏳ Configurar Kubernetes (opcional)
6. ⏳ Fazer primeiro deploy

**Boa sorte! 🚀**
