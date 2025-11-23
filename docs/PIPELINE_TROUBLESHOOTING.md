# 🔧 GitLab Pipeline - Troubleshooting

## ❌ Pipeline Falhou? Siga Este Guia

### 1️⃣ Verificar Status na Interface GitLab

Acesse: https://gitlab.com/thiagobodevan-a11y/assistente-juridico-p/-/pipelines

Procure pelo pipeline mais recente e clique nele para ver detalhes.

### 2️⃣ Ver Logs do Job que Falhou

1. No pipeline, clique no job que falhou (ex: `build_app`, `test_app`, etc.)
2. Veja o output no painel "Job logs"
3. Procure por mensagens de erro

### 3️⃣ Erros Comuns e Soluções

#### ❌ **build_app falha com "module not found"**

**Solução:**
```bash
cd /workspaces/assistente-juridico-p
npm ci --prefer-offline --no-audit
npm run build
```

#### ❌ **test_app falha com "no tests found"**

**Causa:** Testes não configurados ou estrutura diferente

**Solução:** Pipeline já tem `allow_failure: true` para testes - não impede pipeline

#### ❌ **docker_build falha com "authentication failed"**

**Causa:** Variáveis GitLab não configuradas

**Solução:**
1. Acesse Settings → CI/CD → Variables
2. Verifique se existem:
   - `CI_REGISTRY_USER`
   - `CI_REGISTRY_PASSWORD`
   - `CI_REGISTRY`

Se não existir, adicione manualmente.

#### ❌ **deploy_staging falha com "context not found"**

**Causa:** GitLab Agent não conectou

**Solução:**
```bash
# Verificar agent no cluster
kubectl get pods -n gitlab-agent-agenterevisor

# Ver logs do agent
kubectl logs -n gitlab-agent-agenterevisor deployment/agenterevisor-gitlab-agent-v2 --tail=20
```

#### ❌ **deploy falha com "deployment not found"**

**Causa:** Deployment não existe no cluster

**Solução:**
```bash
# Criar deployment manualmente
kubectl apply -f k8s/staging-deployment.yaml
kubectl apply -f k8s/production-deployment.yaml

# Ou deixar que o pipeline crie (diz "will be created")
```

### 4️⃣ Reexecutar Pipeline

**Opção A: Fazer push de um novo commit**
```bash
git commit --allow-empty -m "retry: pipeline"
git push origin main
```

**Opção B: No GitLab, clicar "Retry Pipeline"**
- Acesse a página do pipeline
- Clique em "Retry Pipeline" (botão de retry)

**Opção C: Reexecutar job específico**
- No pipeline, clique no job
- Clique no ícone de "Retry" (seta circular)

### 5️⃣ Validar Mudanças Locais

Antes de fazer push:

```bash
# Validar YAML do pipeline
python3 -c "import yaml; yaml.safe_load(open('.gitlab-ci.yml'))" && echo "✅ YAML válido"

# Verificar npm scripts
npm run build    # Testar build localmente
npm run test     # Testar testes localmente
npm run lint     # Testar linting localmente
```

### 6️⃣ Ver Histórico de Pipelines

Acesse: https://gitlab.com/thiagobodevan-a11y/assistente-juridico-p/-/pipelines

Clique em um pipeline anterior para ver como foi executado.

---

## 📋 Checklist para Debug

- [ ] Pipeline existe e rodou?
- [ ] Qual job falhou? (build/test/docker/deploy)
- [ ] Qual foi a mensagem de erro?
- [ ] O job rodou no Runner correto?
- [ ] Variáveis de ambiente estão configuradas?
- [ ] Docker image existe? (Verifique no Docker Hub/GitLab Registry)
- [ ] Kubectl pode conectar ao cluster?
- [ ] GitLab Agent está rodando no cluster?
- [ ] Deployment existe no cluster?
- [ ] Namespaces existem no cluster?

---

## 🔍 Verificações Rápidas

### Validar YAML local
```bash
cd /workspaces/assistente-juridico-p
python3 -c "import yaml; yaml.safe_load(open('.gitlab-ci.yml'))" && echo "✅ YAML válido"
```

### Verificar cluster Kubernetes
```bash
minikube status          # Status do cluster
kubectl get nodes        # Nós disponíveis
kubectl get namespaces   # Namespaces
kubectl get pods --all-namespaces  # Todos os pods
```

### Verificar GitLab Agent
```bash
kubectl get pods -n gitlab-agent-agenterevisor
kubectl logs -n gitlab-agent-agenterevisor deployment/agenterevisor-gitlab-agent-v2 --tail=50
```

### Verificar Deployments
```bash
kubectl get deployments -n staging
kubectl get deployments -n production
kubectl describe deployment assistente-juridico -n staging
```

---

## 🎯 Próximos Passos

1. **Acompanhar Pipeline**: Acesse https://gitlab.com/thiagobodevan-a11y/assistente-juridico-p/-/pipelines
2. **Build Manual Localmente**: `npm run build`
3. **Docker Build Manual**: `docker build -t assistente-juridico:latest .`
4. **Deploy Manual**: `kubectl apply -f k8s/staging-deployment.yaml`

---

## 📞 Precisa de Mais Ajuda?

Se o pipeline continuar falhando:

1. Verifique os logs do job no GitLab
2. Copie a mensagem de erro exata
3. Procure por essa mensagem neste documento
4. Se não encontrar, execute localmente para reproduzir o erro

---

## ✅ Pipeline Saudável

Você saberá que está tudo bem quando:

- ✅ `build_app` completa com sucesso
- ✅ `test_app` passa (ou `allow_failure` se não tiver testes)
- ✅ `security_scan` passa (ou `allow_failure`)
- ✅ `docker_build` manual executa com sucesso (quando acionado)
- ✅ `deploy_staging` manual executa com sucesso (quando acionado)
- ✅ Pods aparecem em: `kubectl get pods -n staging`

**Status atual:** Revise o novo pipeline #2174681927 e superiores
