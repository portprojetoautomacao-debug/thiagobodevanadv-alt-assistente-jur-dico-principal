# 🔄 GUIA DE MIGRAÇÃO: Node.js → Python

## 🎯 Objetivo

Migrar gradualmente do backend Node.js/Vercel para Python/FastAPI mantendo **zero downtime**.

---

## 📊 Estratégia de Migração

### **Fase 1: Coexistência (Atual - SEM RISCO)**

```
Frontend React → Backend Node.js (Vercel) ✅ PRODUÇÃO

Streamlit App → Backend FastAPI (Python) ✅ PARALELO
```

**Status:** ✅ Implementado
**Risco:** 🟢 Zero - Sistemas independentes

---

### **Fase 2: Dual Backend (Sem Risco)**

```
                    ┌─→ Backend Node.js (Vercel) ✅ 50% tráfego
Frontend React → ├──
                    └─→ Backend FastAPI (Python) ✅ 50% tráfego

Streamlit App → Backend FastAPI (Python) ✅
```

**Implementação:**
```typescript
// Frontend React - src/lib/config.ts
const BACKEND_URL = Math.random() > 0.5
  ? 'https://api-nodejs.assistente.app'  // 50% Node.js
  : 'https://api-python.assistente.app'; // 50% Python
```

**Risco:** 🟡 Baixo - Monitorar métricas

---

### **Fase 3: Migração Gradual (Controlada)**

Migrar endpoint por endpoint:

#### Semana 1: Endpoints de Leitura
```
✅ /api/health → Python
✅ /api/agents → Python
✅ /api/processes → Python (GET)
✅ /api/metrics → Python
```

#### Semana 2: Endpoints de Escrita
```
✅ /api/kv → Python
✅ /api/expedientes → Python (POST)
✅ /api/agents/process-task → Python
```

#### Semana 3: Endpoints Críticos
```
✅ /api/djen-sync → Python
✅ /api/cron → Python (migrar cron jobs)
```

**Monitoramento:** Comparar latência, erros, throughput

---

### **Fase 4: Python 100% (Final)**

```
Frontend React → Backend FastAPI (Python) ✅ 100%
Streamlit App → Backend FastAPI (Python) ✅ 100%
```

**Desligar:** Backend Node.js/Vercel ✅

---

## 🧪 Testes de Compatibilidade

### Script de Teste

```bash
#!/bin/bash

echo "🧪 Testando compatibilidade Node.js vs Python..."

# Endpoints a testar
ENDPOINTS=(
  "/api/health"
  "/api/agents"
  "/api/processes"
  "/api/metrics"
)

NODEJS_URL="https://assistente-juridico-github.vercel.app"
PYTHON_URL="http://localhost:8000"

for endpoint in "${ENDPOINTS[@]}"; do
  echo ""
  echo "Testing: $endpoint"

  # Testar Node.js
  NODEJS_RESPONSE=$(curl -s "$NODEJS_URL$endpoint")
  echo "Node.js: $NODEJS_RESPONSE"

  # Testar Python
  PYTHON_RESPONSE=$(curl -s "$PYTHON_URL$endpoint")
  echo "Python:  $PYTHON_RESPONSE"

  # Comparar (simplificado)
  if [ "$NODEJS_RESPONSE" == "$PYTHON_RESPONSE" ]; then
    echo "✅ COMPATÍVEL"
  else:
    echo "⚠️  DIFERENTE (verificar manualmente)"
  fi
done
```

---

## 📋 Checklist de Migração

### Pré-Migração
- [x] Backend Python implementado
- [x] Endpoints compatíveis
- [x] Testes de compatibilidade
- [ ] Load testing (k6/Locust)
- [ ] Monitoring configurado
- [ ] Rollback plan documentado

### Durante Migração
- [ ] Deploy Python em Railway/Render
- [ ] Configurar DNS (api-python.assistente.app)
- [ ] Load balancer (50/50)
- [ ] Monitorar logs e métricas
- [ ] Comparar performance
- [ ] Feedback de usuários

### Pós-Migração
- [ ] 100% tráfego no Python
- [ ] Desligar Node.js/Vercel
- [ ] Atualizar documentação
- [ ] Post-mortem analysis

---

## 🚨 Rollback Plan

Se algo der errado:

```bash
# 1. Reverter DNS
# api.assistente.app → Backend Node.js

# 2. Atualizar frontend
VITE_API_URL=https://assistente-juridico-github.vercel.app/api

# 3. Deploy
vercel deploy --prod

# Tempo de rollback: ~2 minutos
```

---

## 📊 Métricas de Sucesso

| Métrica | Node.js (Baseline) | Python (Target) | Status |
|---------|-------------------|-----------------|--------|
| Latência P95 | 500ms | <600ms | ⏳ Medir |
| Taxa de erro | 0.1% | <0.2% | ⏳ Medir |
| Throughput | 1000 req/s | >800 req/s | ⏳ Medir |
| Custo/mês | $50 | <$60 | ⏳ Medir |

---

## 💰 Comparação de Custos

### Backend Node.js (Vercel)
- **Grátis:** 100GB bandwidth
- **Pro:** $20/mês (team)
- **Enterprise:** $400+/mês

### Backend Python (Railway)
- **Hobby:** $5/mês (512MB RAM)
- **Pro:** $20/mês (8GB RAM)
- **Scale:** Automático

**Economia estimada:** Similar ou 20% mais barato

---

## 🎯 Recomendação Final

### **Curto Prazo (1-2 semanas):**
✅ Manter ambos backends
✅ Streamlit usa FastAPI
✅ React usa Vercel
✅ Coletar métricas

### **Médio Prazo (1-2 meses):**
✅ Migração gradual (endpoint por endpoint)
✅ Monitorar performance
✅ Ajustar conforme necessário

### **Longo Prazo (3+ meses):**
🎯 Decidir baseado em dados:
- Se Python performa bem → Migrar 100%
- Se Node.js é melhor → Manter híbrido
- **Melhor dos dois mundos:** Usar ambos para casos específicos

---

## 📚 Documentação de Referência

1. `BACKEND_INTEGRATION.md` - Integração completa
2. `backend/README.md` - Backend FastAPI
3. `COMPARISON.md` - React vs Streamlit
4. `MIGRATION.md` - Este arquivo

---

**Data:** 27/12/2025
**Autor:** Thiago Bode
**Status:** ✅ Estratégia Definida
