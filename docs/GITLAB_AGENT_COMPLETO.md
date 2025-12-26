# 🎯 GitLab Kubernetes Agent - Configuração Completa

## ✅ Status da Instalação

### GitLab Agent Instalado
- **Nome**: `agenterevisor`
- **Namespace**: `gitlab-agent-agenterevisor`
- **Status**: ✅ 2 réplicas rodando
- **Conexão**: Conectado ao GitLab KAS (wss://kas.gitlab.com)
- **Versão**: v1.17.0

### Cluster Kubernetes
- **Tipo**: Minikube v1.37.0
- **Status**: ✅ Rodando
- **Kubectl**: v1.34.1

### Namespaces Configurados
- ✅ `staging` - Para ambiente de testes
- ✅ `production` - Para ambiente de produção
- ✅ `gitlab-agent-agenterevisor` - Para o GitLab Agent

### Deployments Criados
- ✅ `assistente-juridico` no namespace `staging` (2 réplicas)
- ✅ `assistente-juridico` no namespace `production` (3 réplicas)

---

## 🔧 Arquivos Configurados

### 1. `.gitlab/agents/agenterevisor/config.yaml`
Configuração do GitLab Agent com:
- **ci_access**: Permite pipelines deployarem via agent
- **user_access**: Permite usuários executarem kubectl via agent
- **gitops**: Sincroniza manifestos do diretório `k8s/`

### 2. `.gitlab-ci.yml`
Pipeline atualizado com:
- Job `deploy_staging`: Deploy automático via agent (manual)
- Job `deploy_production`: Deploy em tags via agent (manual)
- Integração com `kubernetes.agent` e `kubernetes.namespace`

### 3. `k8s/staging-deployment.yaml`
Deployment de staging com:
- 2 réplicas
- Health checks (liveness/readiness)
- Recursos: 256Mi-512Mi RAM, 100m-500m CPU
- Service ClusterIP na porta 80

### 4. `k8s/production-deployment.yaml`
Deployment de production com:
- 3 réplicas (mais alta disponibilidade)
- Health checks (liveness/readiness)
- Recursos: 512Mi-1Gi RAM, 200m-1000m CPU
- Service ClusterIP na porta 80

---

## 🚀 Como Usar o GitLab Agent

### Verificar Status do Agent

```bash
# Ver pods do agent
kubectl get pods -n gitlab-agent-agenterevisor

# Ver logs do agent
kubectl logs -n gitlab-agent-agenterevisor deployment/agenterevisor-gitlab-agent-v2 --tail=50

# Ver todos os recursos
kubectl get all -n gitlab-agent-agenterevisor
```

### Fazer Deploy via Pipeline

1. **Commit e Push**: As mudanças já estão no repositório

2. **Pipeline Automático**: 
   - Pipeline será criado automaticamente no GitLab
   - Jobs `build_app` e `test_app` executam automaticamente

3. **Deploy Manual Staging**:
   - Acesse: https://gitlab.com/portprojetoautomacao-debug/thiagobodevanadv-alt-assistente-jur-dico-principal/-/pipelines
   - Clique no pipeline mais recente
   - No job `docker_build`, clique em "Play" (▶️)
   - Após o build, no job `deploy_staging`, clique em "Play" (▶️)

4. **Deploy Manual Production**:
   - Crie uma tag Git: `git tag v1.0.0 && git push origin v1.0.0`
   - Pipeline será criado automaticamente
   - No job `deploy_production`, clique em "Play" (▶️)

### Monitorar Deployments

```bash
# Ver pods de staging
kubectl get pods -n staging

# Ver logs de staging
kubectl logs -n staging deployment/assistente-juridico --tail=50

# Ver status do deployment de staging
kubectl rollout status deployment/assistente-juridico -n staging

# Ver pods de production
kubectl get pods -n production

# Ver logs de production
kubectl logs -n production deployment/assistente-juridico --tail=50

# Ver status do deployment de production
kubectl rollout status deployment/assistente-juridico -n production
```

### Usar kubectl via GitLab Agent (User Access)

```bash
# Listar contextos
kubectl config get-contexts

# Ver pods via agent
kubectl get pods -n staging --context=gitlab:portprojetoautomacao-debug/thiagobodevanadv-alt-assistente-jur-dico-principal:agenterevisor
```

---

## 🔐 GitOps Automático

O agent está configurado para sincronizar automaticamente manifestos do diretório `k8s/`:

1. **Edite um manifesto** em `k8s/*.yaml`
2. **Commit e push** para o repositório
3. **Agent detecta mudanças** automaticamente
4. **Aplica no cluster** sem intervenção manual

Arquivos monitorados:
- `k8s/staging-deployment.yaml`
- `k8s/production-deployment.yaml`
- Qualquer arquivo `.yaml` em `k8s/`

---

## 📊 Verificações Importantes

### 1. Agent Conectado

```bash
kubectl logs -n gitlab-agent-agenterevisor deployment/agenterevisor-gitlab-agent-v2 --tail=20 | grep "successfully"
```

Deve mostrar: `"successfully acquired lease"` e `"became leader"`

### 2. Deployments Criados

```bash
kubectl get deployments -n staging
kubectl get deployments -n production
```

Deve mostrar `assistente-juridico` em ambos.

### 3. Pipeline no GitLab

Acesse: https://gitlab.com/portprojetoautomacao-debug/thiagobodevanadv-alt-assistente-jur-dico-principal/-/pipelines

Deve mostrar pipelines com:
- ✅ build_app
- ✅ test_app
- ⏸️ docker_build (manual)
- ⏸️ deploy_staging (manual)

---

## 🎬 Próximos Passos

### 1. Build da Imagem Docker

No GitLab, execute o job `docker_build` manualmente:
- Acesse o pipeline
- Clique em "Play" no job `docker_build`
- Aguarde o build terminar (criará a imagem no Container Registry)

### 2. Primeiro Deploy de Staging

Após o build da imagem:
- No mesmo pipeline, clique em "Play" no job `deploy_staging`
- Aguarde o deploy terminar
- Verifique: `kubectl get pods -n staging`

### 3. Deploy de Production

Para production, você precisa criar uma tag:

```bash
git tag v1.0.0
git push origin v1.0.0
```

Isso criará um novo pipeline com o job `deploy_production` disponível.

### 4. Configurar Ingress (Opcional)

Para expor os serviços externamente:

```bash
# Habilitar ingress no Minikube
minikube addons enable ingress

# Criar Ingress para staging
kubectl apply -f - <<EOF
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: assistente-juridico
  namespace: staging
spec:
  rules:
  - host: staging.assistente-juridico.local
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: assistente-juridico
            port:
              number: 80
EOF

# Obter IP do Minikube
minikube ip

# Adicionar ao /etc/hosts
echo "$(minikube ip) staging.assistente-juridico.local" | sudo tee -a /etc/hosts
```

---

## 🐛 Troubleshooting

### Pods com ImagePullBackOff

**Causa**: Imagem não existe no Container Registry ainda

**Solução**: Execute o job `docker_build` primeiro

```bash
# Verificar
kubectl describe pod -n staging <pod-name>

# Ver eventos
kubectl get events -n staging --sort-by='.lastTimestamp'
```

### Agent Desconectado

**Verificar logs**:
```bash
kubectl logs -n gitlab-agent-agenterevisor deployment/agenterevisor-gitlab-agent-v2 --tail=100
```

**Restartar agent**:
```bash
kubectl rollout restart deployment/agenterevisor-gitlab-agent-v2 -n gitlab-agent-agenterevisor
```

### Deploy Falha no Pipeline

**Verificar permissões**:
- Agent deve ter acesso ao projeto no `.gitlab/agents/agenterevisor/config.yaml`
- Namespace deve existir no cluster

**Ver logs do job**:
- Acesse o pipeline no GitLab
- Clique no job que falhou
- Leia a saída do console

---

## 📚 Recursos Adicionais

### Documentação GitLab
- [GitLab Kubernetes Agent](https://docs.gitlab.com/ee/user/clusters/agent/)
- [CI/CD com Kubernetes](https://docs.gitlab.com/ee/user/clusters/agent/ci_cd_workflow.html)
- [GitOps com Agent](https://docs.gitlab.com/ee/user/clusters/agent/gitops.html)

### Arquivos de Configuração
- `.gitlab/agents/agenterevisor/config.yaml` - Configuração do agent
- `.gitlab-ci.yml` - Pipeline CI/CD
- `k8s/staging-deployment.yaml` - Deploy de staging
- `k8s/production-deployment.yaml` - Deploy de production

### Comandos Úteis

```bash
# Ver todos os namespaces
kubectl get namespaces

# Ver todos os recursos de um namespace
kubectl get all -n staging

# Descrever um pod específico
kubectl describe pod -n staging <pod-name>

# Ver logs de todos os pods de um deployment
kubectl logs -n staging -l app=assistente-juridico --tail=50

# Escalar deployment
kubectl scale deployment assistente-juridico -n staging --replicas=3

# Atualizar imagem manualmente
kubectl set image deployment/assistente-juridico assistente-juridico=registry.gitlab.com/portprojetoautomacao-debug/thiagobodevanadv-alt-assistente-jur-dico-principal:latest -n staging

# Ver rollout status
kubectl rollout status deployment/assistente-juridico -n staging

# Rollback de deployment
kubectl rollout undo deployment/assistente-juridico -n staging
```

---

## ✅ Checklist de Verificação

- [x] GitLab Agent instalado e rodando
- [x] Agent conectado ao GitLab KAS
- [x] Configuração do agent (`config.yaml`) criada e commitada
- [x] Pipeline atualizado para usar agent
- [x] Namespaces `staging` e `production` criados
- [x] Deployments de staging e production criados
- [x] Manifestos Kubernetes commitados no repositório
- [x] GitLab Workflow extension configurada no VS Code
- [ ] Imagem Docker construída (execute `docker_build` job)
- [ ] Deploy de staging testado (execute `deploy_staging` job)
- [ ] Deploy de production testado (crie tag e execute `deploy_production` job)

---

## 🎉 Conclusão

Seu GitLab Agent está **totalmente configurado** e pronto para uso! 

Principais benefícios alcançados:
- ✅ Deploy seguro via agent (sem expor kubeconfig)
- ✅ CI/CD integrado com Kubernetes
- ✅ GitOps automático para manifestos em `k8s/`
- ✅ Múltiplos ambientes (staging e production)
- ✅ Health checks e resource limits configurados
- ✅ Pipeline com gates manuais (deploy controlado)

**Próxima ação**: Execute o job `docker_build` no GitLab para criar a primeira imagem!
