# GitLab Integration - Assistente Jurídico PJe

Este documento descreve as integrações e configurações implementadas no GitLab para otimizar o workflow de escritórios de advocacia brasileiros.

## 🎯 Visão Geral

O GitLab foi configurado como plataforma central para:
- Gerenciamento de processos judiciais
- Controle de prazos e deadlines
- Integração com ferramentas legais (DJEN, Google Calendar, Todoist)
- CI/CD automatizado para deploy da aplicação React
- Templates padronizados para diferentes tipos de processos

## 📋 Estrutura de Milestones

### Milestones Criados
- **Processos Cíveis** (ID: 6214352)
- **Processos Trabalhistas** (ID: 6214353)
- **Contratos e Documentos** (ID: 6214354)

## 🏷️ Sistema de Labels

### Labels de Tipo
- `tipo::civil` - Processos cíveis
- `tipo::trabalhista` - Processos trabalhistas
- `tipo::contrato` - Contratos e documentos

### Labels de Prioridade
- `prioridade::urgente` - Prazos críticos (< 24h)
- `prioridade::alta` - Prazos importantes (1-7 dias)
- `prioridade::media` - Prazos normais (1-4 semanas)
- `prioridade::baixa` - Prazos longos (> 1 mês)

### Labels de Status
- `status::aguardando` - Aguardando ação
- `status::em_andamento` - Em execução
- `status::revisao` - Aguardando revisão
- `status::concluido` - Finalizado

## 📊 Issue Board

### Board "Processos Jurídicos" (ID: 9917758)

**Colunas configuradas:**
1. **Backlog** - Processos identificados
2. **Análise Inicial** - Avaliação jurídica inicial
3. **Documentação** - Preparação de documentos
4. **Protocolo** - Entrada no sistema judicial
5. **Acompanhamento** - Monitoramento do processo
6. **Conclusão** - Arquivamento/finalização

## 🔗 Webhooks Configurados

### 1. Notificações Gerais
- **URL:** `https://webhook.site/test`
- **Eventos:** Issues, Push, Merge Requests, Notes
- **ID:** 65727720

### 2. Google Calendar Integration
- **URL:** `https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec`
- **Eventos:** Issues, Notes
- **ID:** 65727736

### 3. DJEN/DataJud Integration
- **URL:** `https://api.djen.com.br/webhook/legal-updates`
- **Eventos:** Issues, Notes
- **ID:** 65727745

### 4. Todoist Integration
- **URL:** `https://api.todoist.com/sync/v9/webhooks`
- **Eventos:** Issues, Notes
- **ID:** 65727747

## 📝 Templates de Issues

Localizados em `.gitlab/issue_templates/`:

### 1. Processo Cível
- Campos: Número do processo, partes, valor da causa, vara
- Checklist de documentos obrigatórios
- Prazos importantes
- Labels automáticos: `tipo::civil`, `prioridade::alta`, `status::aguardando`

### 2. Processo Trabalhista
- Campos específicos trabalhistas
- Reclamações principais (checklist)
- Labels automáticos: `tipo::trabalhista`, `prioridade::alta`, `status::aguardando`

### 3. Contrato/Documento
- Campos contratuais
- Checklist de cláusulas obrigatórias
- Labels automáticos: `tipo::contrato`, `prioridade::media`, `status::aguardando`

## 🔄 CI/CD Pipeline

### Stages Configurados
1. **install** - Instalação de dependências
2. **test** - Testes unitários e de integração
3. **security** - Verificações de segurança
4. **build** - Build da aplicação
5. **deploy** - Deploy para produção

### Testes de Integração
Scripts localizados em `scripts/`:
- `test-djen-integration.js` - Testa conectividade com DJEN
- `test-calendar-integration.js` - Testa Google Calendar API
- `test-todoist-integration.js` - Testa Todoist API

## 🚀 Como Usar

### Criando um Novo Processo
1. Acesse Issues > New Issue
2. Selecione template apropriado
3. Preencha os campos obrigatórios
4. Labels são aplicadas automaticamente
5. Issue é adicionada ao board correspondente

### Gerenciando Prazos
1. Issues com labels de prioridade são destacadas
2. Webhooks notificam sobre mudanças importantes
3. Google Calendar recebe eventos automaticamente
4. Todoist sincroniza tarefas pendentes

### Monitoramento
- Issue Board mostra status visual de todos os processos
- Milestones agrupam processos por categoria
- Labels permitem filtragem avançada

## 🔧 Configuração Técnica

### Variáveis de Ambiente Necessárias
```bash
VITE_GOOGLE_CLIENT_ID=your_google_client_id
VITE_GOOGLE_API_KEY=your_google_api_key
GITLAB_TOKEN=your_gitlab_token
```

### Dependências do Projeto
- Node.js 22+
- React 19+
- TypeScript
- Vite para build
- ESLint para linting
- Vitest para testes

## 📈 Benefícios Implementados

1. **Centralização** - Tudo em um lugar (GitLab)
2. **Automação** - Webhooks e CI/CD reduzem trabalho manual
3. **Padronização** - Templates garantem consistência
4. **Integração** - Conexão com ferramentas legais essenciais
5. **Rastreabilidade** - Histórico completo de todas as ações
6. **Colaboração** - Equipe trabalha de forma coordenada

## 🔒 Segurança

- Tokens de API armazenados como variáveis protegidas
- Webhooks usam HTTPS
- Auditoria completa de todas as ações
- Controle de acesso baseado em roles

## 📞 Suporte

Para questões sobre esta configuração:
1. Verifique este documento
2. Consulte os logs do CI/CD
3. Abra issue no projeto com label `configuração`

---

**Última atualização:** 24 de novembro de 2024
**Versão:** 1.0.0