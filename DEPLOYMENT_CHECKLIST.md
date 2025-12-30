# 📋 Checklist de Deployment para Escala

## Antes do Deployment

### 1. ✅ Configuração do Projeto

- [ ] `langgraph.json` atualizado com schema correto
- [ ] Descrição clara do assistant configurada
- [ ] Input/output schemas bem definidos
- [ ] TTL de checkpoints e threads configurados
- [ ] Store index configurado (se usar busca semântica)

### 2. ✅ Variáveis de Ambiente

- [ ] `LANGSMITH_API_KEY` configurada
- [ ] `GOOGLE_API_KEY` configurada
- [ ] `OPENAI_API_KEY` configurada (se usar)
- [ ] `POSTGRES_URI_CUSTOM` para banco externo
- [ ] `REDIS_URI_CUSTOM` para cache externo
- [ ] `N_JOBS_PER_WORKER` ajustado para seu caso
- [ ] `BG_JOB_ISOLATED_LOOPS` configurado corretamente

### 3. ✅ Testes Locais

- [ ] `langgraph dev` executa sem erros
- [ ] Testes unitários passando (`npm run test:run`)
- [ ] Testes de integração validados
- [ ] Performance local aceitável

### 4. ✅ Capacidade e Recursos

- [ ] Executado script `calculate_capacity.py`
- [ ] Número de API servers calculado
- [ ] Número de queue workers calculado
- [ ] Recursos de PostgreSQL dimensionados
- [ ] Recursos de Redis dimensionados
- [ ] Autoscaling configurado (se necessário)

### 5. ✅ Banco de Dados

- [ ] PostgreSQL externo provisionado
- [ ] Conexão testada
- [ ] Backups automáticos configurados
- [ ] Pool de conexões otimizado
- [ ] SSL habilitado (produção)

### 6. ✅ Cache

- [ ] Redis externo provisionado
- [ ] Conexão testada
- [ ] Persistência configurada
- [ ] Políticas de eviction definidas

## Durante o Deployment

### 7. ✅ Deployment Inicial

- [ ] Branch correto selecionado
- [ ] Tipo de deployment escolhido (Development/Production)
- [ ] Environment variables configuradas
- [ ] Deployment criado com sucesso
- [ ] Build logs verificados (sem erros)

### 8. ✅ Configuração do Assistant

- [ ] Assistant padrão criado automaticamente
- [ ] Nome e descrição do assistant verificados
- [ ] Context schema validado
- [ ] Versão inicial do assistant confirmada

### 9. ✅ Primeiros Testes

- [ ] Endpoint `/ok` respondendo
- [ ] Criar thread de teste
- [ ] Executar run de teste
- [ ] Verificar estado do thread
- [ ] Confirmar persistência de dados

## Após o Deployment

### 10. ✅ Validação Funcional

- [ ] Run simples executado com sucesso
- [ ] Streaming funcionando
- [ ] Checkpoints sendo salvos
- [ ] Threads sendo gerenciados
- [ ] Cron jobs criados (se aplicável)

### 11. ✅ Monitoramento

- [ ] Dashboard de métricas acessível
- [ ] Alertas configurados
- [ ] Script `monitor_metrics.py` rodando
- [ ] Logs sendo coletados
- [ ] Tracing habilitado no LangSmith

### 12. ✅ Performance

- [ ] Latência dentro do esperado (< 5s p95)
- [ ] Taxa de sucesso > 95%
- [ ] Uso de CPU < 70%
- [ ] Uso de memória < 80%
- [ ] Fila de runs não acumulando

### 13. ✅ Segurança

- [ ] CORS configurado corretamente
- [ ] Rate limiting habilitado
- [ ] API keys em secrets (não em código)
- [ ] SSL/TLS configurado
- [ ] Autenticação funcionando

### 14. ✅ Backup e Recovery

- [ ] Backups automáticos verificados
- [ ] Procedimento de restore documentado
- [ ] Retention policy definida
- [ ] Disaster recovery plan criado

### 15. ✅ Documentação

- [ ] Endpoints documentados
- [ ] Exemplos de uso criados
- [ ] Runbook de operações escrito
- [ ] Contatos de suporte definidos

## Testes de Carga

### 16. ✅ Testes Graduais

- [ ] 10% da carga esperada (1 dia)
- [ ] 25% da carga esperada (2 dias)
- [ ] 50% da carga esperada (3 dias)
- [ ] 100% da carga esperada (1 semana)
- [ ] Métricas coletadas em cada fase

### 17. ✅ Teste de Pico

- [ ] Simular pico de 2x a carga normal
- [ ] Verificar autoscaling
- [ ] Confirmar recovery após pico
- [ ] Ajustar configurações se necessário

## Otimizações Pós-Deploy

### 18. ✅ Tuning Fino

- [ ] Ajustar `N_JOBS_PER_WORKER` baseado em métricas reais
- [ ] Otimizar pool de conexões DB
- [ ] Ajustar TTLs de cache
- [ ] Refinar alertas (reduzir false positives)

### 19. ✅ Cost Optimization

- [ ] Revisar uso de recursos
- [ ] Identificar desperdícios
- [ ] Considerar reserved instances
- [ ] Otimizar queries de banco

### 20. ✅ Continuous Improvement

- [ ] Revisão semanal de métricas
- [ ] Atualizar dependências
- [ ] Implementar melhorias identificadas
- [ ] Documentar lições aprendidas

## 🚨 Troubleshooting

### Problema: Runs lentos
- [ ] Verificar `N_JOBS_PER_WORKER`
- [ ] Checar operações bloqueantes
- [ ] Otimizar chamadas a APIs externas
- [ ] Adicionar cache

### Problema: Erros frequentes
- [ ] Revisar logs de erros
- [ ] Verificar conectividade com APIs
- [ ] Checar limites de rate
- [ ] Validar inputs/outputs

### Problema: Alto uso de recursos
- [ ] Identificar gargalos
- [ ] Otimizar queries
- [ ] Limpar dados antigos
- [ ] Escalar recursos

## 📞 Contatos de Emergência

```
Equipe de Desenvolvimento: dev-team@empresa.com
Suporte LangSmith: support@langchain.com
On-Call: +55 11 99999-9999
Status Page: https://status.langchain.com
```

## 📊 Comandos Úteis

```bash
# Monitorar métricas
python scripts/monitor_metrics.py --continuous 60

# Calcular capacidade
python scripts/calculate_capacity.py

# Verificar health
curl https://seu-deployment.com/ok

# Listar threads ativos
langgraph-sdk threads list --status busy

# Ver logs em tempo real
kubectl logs -f deployment/langgraph-api --tail=100
```

## ✅ Critérios de Sucesso

Um deployment é considerado bem-sucedido quando:

1. **Disponibilidade**: > 99.9% uptime
2. **Performance**: p95 latência < 5s
3. **Confiabilidade**: Taxa de sucesso > 95%
4. **Escalabilidade**: Suporta 2x a carga esperada
5. **Observabilidade**: Métricas e alertas funcionando

## 🎯 Próximos Passos

Após completar este checklist:

1. Monitorar por 1 semana
2. Coletar feedback dos usuários
3. Iterar sobre configurações
4. Documentar aprendizados
5. Planejar próxima versão

---

**Data do Deployment**: _________________

**Responsável**: _________________

**Versão**: _________________

**Aprovado por**: _________________
