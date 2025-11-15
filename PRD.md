# Product Requirements Document (PRD)
## Assistente Jurídico PJe - Sistema de Gestão para Advocacia

Sistema completo de gestão para escritórios de advocacia com foco em automação, inteligência artificial e experiência do usuário inspirada no ADVBOX.

---

## Missão

Criar um sistema de gestão jurídica inteligente que automatiza tarefas repetitivas, fornece insights estratégicos através de IA e permite aos advogados focarem no que realmente importa: seus clientes e casos.

---

## Experience Qualities

1. **Profissional e Confiável** - O sistema deve transmitir seriedade e precisão, essenciais para um ambiente jurídico onde erros podem ter consequências graves.

2. **Intuitivo e Eficiente** - Interface clara que reduz o tempo necessário para encontrar informações e executar tarefas comuns, minimizando a curva de aprendizado.

3. **Inteligente e Proativo** - IA que antecipa necessidades, sugere ações e fornece insights sem que o usuário precise buscar ativamente.

---

## Complexity Level

**Light Application (múltiplos recursos com estado básico)**

Embora o sistema tenha funcionalidades complexas (IA, automação, integrações), a arquitetura é simplificada usando Spark KV para persistência, eliminando necessidade de backend complexo. O foco está em UX rica com gestão de estado client-side robusta.

---

## Essential Features

### 1. Dashboard Inteligente

**Funcionalidade:** Visão consolidada de todas as atividades, processos e métricas do escritório

**Propósito:** Permitir tomada de decisão rápida baseada em dados atualizados

**Trigger:** Login do usuário ou navegação para home

**Progressão:** 
Login → Carrega dados do KV → Calcula métricas → Renderiza cards com estatísticas → Exibe gráficos de desempenho → Lista tarefas urgentes e compromissos → Usuário pode clicar para navegar para detalhes

**Critérios de Sucesso:**
- Tempo de carregamento < 500ms
- Todos os cards exibem dados corretos
- Gráficos são interativos e respondem a hover
- Navegação para detalhes funciona corretamente

### 2. Gestão de Processos (Kanban)

**Funcionalidade:** Visualização e organização de processos jurídicos em etapas (fases processuais)

**Propósito:** Facilitar acompanhamento do pipeline de processos e identificar gargalos

**Trigger:** Usuário clica em "Processos" na sidebar

**Progressão:**
Clique em Processos → Carrega lista de processos → Agrupa por fase → Renderiza colunas Kanban → Usuário pode arrastar cards entre colunas → Sistema atualiza fase → Persiste mudança → Exibe feedback visual

**Critérios de Sucesso:**
- Drag and drop funciona suavemente
- Mudança de fase é instantânea visualmente
- Dados persistem após reload
- Filtros funcionam corretamente
- Mover em massa funciona para múltiplos processos

### 3. Harvey Specter (Assistente de IA)

**Funcionalidade:** Chatbot jurídico inteligente que responde perguntas sobre processos, prazos, finanças e fornece análises

**Propósito:** Democratizar acesso a insights complexos através de linguagem natural

**Trigger:** Usuário clica em "Harvey Specter" ou usa atalho de teclado

**Progressão:**
Abre modal/página → Usuário digita pergunta → Sistema envia para spark.llm → IA analisa contexto (processos, finanças, etc.) → Gera resposta estruturada → Exibe resposta formatada → Usuário pode fazer follow-up

**Critérios de Sucesso:**
- Resposta gerada em < 3 segundos
- Resposta é relevante e precisa
- Interface suporta markdown/formatação
- Histórico de conversas é mantido

### 4. Agentes de IA Autônomos 24/7

**Funcionalidade:** Sistema de múltiplos agentes especializados que trabalham continuamente sem intervenção humana, processando tarefas em segundo plano

**Propósito:** Automatizar completamente workflows repetitivos, permitindo que advogados foquem em trabalho estratégico enquanto agentes cuidam da operação

**Trigger:** Agentes iniciam automaticamente ao login e operam continuamente; tarefas são geradas automaticamente ou manualmente adicionadas à fila

**Progressão:**
Sistema carrega agentes do KV → Cada agente verifica sua fila de trabalho → Processa tarefas por prioridade → Detecta intervenção humana → Pausa colaborativamente → Aguarda 5min sem atividade → Retoma trabalho → Registra resultados → Atualiza métricas

**Critérios de Sucesso:**
- 7 agentes operacionais (Doc Analyzer, DJEN Monitor, Deadline Tracker, Petition Writer, DataJud Query, File Organizer, Mrs. Justin-e)
- 95%+ taxa de sucesso em tarefas
- Tempo médio de processamento < 5 segundos por tarefa
- Zero conflitos com edições humanas
- Métricas em tempo real atualizadas a cada 5 segundos
- Sistema de colaboração funciona: agente pausa quando humano edita, retoma após inatividade

**Sub-funcionalidades:**

**4.1. Mrs. Justin-e (Agente Especialista em Intimações)**
- Analisa intimações com 95% de precisão em < 1 minuto
- Interpreta conteúdo e contexto jurídico
- Calcula prazos automaticamente
- Cria workflow completo de controladoria
- Sugere tarefas baseadas no tipo de intimação
- Sistema D-1, D-2, D-n para notificações progressivas
- Refaz análise automaticamente quando recebe novas informações
- Economiza 50 horas a cada 150 intimações processadas

**4.2. Agente de Análise Documental**
- Monitora novos documentos 24/7
- Extrai dados estruturados (CNJ, partes, valores, datas)
- Classifica por tipo (petição, sentença, despacho)
- Detecta prazos fatais automaticamente
- Gera resumos executivos
- Confidence score para cada extração

**4.3. Agente de Monitoramento DJEN**
- Consulta DJEN automaticamente a cada hora
- Filtra por OAB e nome de advogados cadastrados
- Notifica sobre novas intimações instantaneamente
- Armazena publicações estruturadas
- Detecta duplicatas via hash
- Log completo de execuções

**4.4. Agente de Gestão de Prazos**
- Calcula prazos processuais considerando dias úteis
- Valida contra calendário de feriados nacional/local
- Gera alertas D-3, D-1 automaticamente
- Recalcula após suspensões processuais
- Auditoria de cálculos com reasoning
- Integração com agenda

**4.5. Agente de Redação Jurídica**
- Redige minutas de petições sob demanda
- Usa templates contextuais por tipo de ação
- Padroniza formatação e estilo
- Sugere argumentos jurídicos relevantes
- Revisão gramatical automática
- Confidence score + flag de revisão necessária

**4.6. Agente de Consultas DataJud**
- Busca automática de processos no DataJud
- Extrai andamentos e movimentações
- Detecta mudanças de status
- Consolidação de dados históricos
- Alertas sobre eventos importantes

**4.7. Agente Organizador de Arquivos**
- Categoriza documentos automaticamente
- Indexa para busca rápida
- Renomeia seguindo padrão inteligente
- Detecta e remove duplicatas
- Arquiva processos concluídos
- Estatísticas de espaço economizado

**Modo de Operação:**

**Modo Contínuo 24/7:**
- Agentes rodam em loop verificando suas filas a cada 5 segundos
- Processam tarefas por prioridade (critical > high > medium > low)
- Atualizam status e métricas em tempo real
- Registram todas ações em activity log

**Modo Colaborativo:**
- Agente detecta quando humano começa a editar
- Entra em estado "waiting_human" imediatamente
- Aguarda 5 minutos de inatividade
- Retoma trabalho automaticamente
- Nunca sobrescreve edições humanas

**Geração Automática de Tarefas (Demo):**
- Sistema pode gerar tarefas realistas automaticamente
- Intervalo configurável (padrão: 3 minutos)
- Máximo 2 tarefas por intervalo
- Distribuição entre agentes habilitados
- Pode ser desabilitado via toggle

### 5. Harvey Specter (Assistente de IA)

**Funcionalidade:** Chatbot jurídico inteligente que responde perguntas sobre processos, prazos, finanças e fornece análises

**Propósito:** Democratizar acesso a insights complexos através de linguagem natural

**Trigger:** Usuário clica em "Harvey Specter" ou usa atalho de teclado

**Progressão:**
Abre modal/página → Usuário digita pergunta → Sistema envia para spark.llm → IA analisa contexto (processos, finanças, etc.) → Gera resposta estruturada → Exibe resposta formatada → Usuário pode fazer follow-up

**Critérios de Sucesso:**
- Resposta gerada em < 3 segundos
- Resposta é relevante e precisa
- Interface suporta markdown/formatação
- Histórico de conversas é mantido

### 6. Integração DJEN/DataJud

**Funcionalidade:** Monitoramento automático de publicações no Diário de Justiça Eletrônico Nacional

**Propósito:** Garantir que nenhuma intimação seja perdida e automatizar busca diária

**Trigger:** Cron job diário às 02:15 ou busca manual

**Progressão:**
Cron dispara → Sistema consulta API DJEN/DataJud → Filtra por OAB/nome do advogado → Encontra publicações relevantes → Notifica usuário → Armazena em expedientes → Usuário pode revisar e processar

**Critérios de Sucesso:**
- Job roda diariamente sem falhas
- Todas as publicações relevantes são capturadas
- Notificações são enviadas corretamente
- Dados estruturados são armazenados

### 7. Integração Google Calendar

**Funcionalidade:** Sincronização bidirecional de eventos entre agenda local e Google Calendar

**Propósito:** Centralizar compromissos em uma única plataforma e eliminar duplicação de eventos

**Trigger:** Conexão manual do usuário, sincronização automática ou manual

**Progressão:**
Usuário conecta conta Google → Autentica via OAuth 2.0 → Sistema obtém acesso ao Calendar → Usuário escolhe sincronizar → Eventos locais são enviados ao Google OU eventos do Google são importados → Sistema detecta duplicatas → Merge inteligente → Sincronização automática mantém tudo atualizado

**Critérios de Sucesso:**
- Autenticação OAuth funciona em < 5 segundos
- Importação de 30+ eventos em < 2 segundos
- Zero duplicatas após sincronização
- Eventos criados localmente aparecem no Google automaticamente (se sync ativo)
- Cores corretas por tipo de evento (Audiência=vermelho, Reunião=azul, Prazo=amarelo)
- 80%+ dos usuários ativam sincronização nos primeiros 7 dias

### 8. Gestão Financeira

**Funcionalidade:** Controle de receitas, despesas, honorários e fluxo de caixa

**Propósito:** Manter saúde financeira do escritório e facilitar cobrança

**Trigger:** Usuário acessa "Financeiro"

**Progressão:**
Abre financeiro → Carrega lançamentos → Calcula saldos (previsto, a receber, a pagar) → Renderiza gráfico de barras (receitas x despesas) → Exibe tabela de lançamentos → Usuário pode adicionar novo lançamento → Preenche modal → Sistema valida → Salva → Atualiza gráficos

**Critérios de Sucesso:**
- Cálculos são precisos
- Gráficos refletem dados atualizados
- Categorização funciona
- Anexos podem ser adicionados
- Relatórios podem ser exportados

### 9. Calculadora de Prazos

**Funcionalidade:** Cálculo automático de prazos processuais considerando dias úteis, feriados e regras específicas

**Propósito:** Eliminar erros humanos no cálculo de prazos críticos

**Trigger:** Usuário acessa "Calc. Prazos" ou sistema auto-calcula ao detectar prazo em intimação

**Progressão:**
Usuário insere data base → Seleciona tipo de prazo (CPC, CLT) → Informa quantidade de dias → Sistema carrega feriados nacionais/locais → Calcula considerando regra apropriada → Exibe resultado destacando data final → Usuário pode salvar como tarefa

**Critérios de Sucesso:**
- Cálculo segue regras CPC/CLT corretamente
- Feriados são considerados
- Resultado é claro e destacado
- Integração com agenda funciona

---

## Edge Case Handling

- **Processo sem CNJ:** Sistema aceita e permite entrada manual de identificador alternativo, mas alerta usuário sobre limitações de integração

- **Prazo caindo em feriado:** Sistema avança automaticamente para próximo dia útil conforme regra CPC/CLT

- **Intimação duplicada:** Sistema detecta via hash de conteúdo e alerta usuário antes de criar duplicata

- **API DJEN/DataJud offline:** Sistema usa cache local e tenta novamente após backoff exponencial, notificando usuário de falha persistente

- **IA retorna resposta vazia:** Sistema exibe mensagem amigável pedindo para reformular pergunta e oferece exemplos de perguntas válidas

---

## Design Direction

O design deve sentir-se **profissional, moderno e sofisticado**, evocando confiança e competência técnica. Inspirado no ADVBOX, usa tema escuro como padrão para reduzir fadiga visual em sessões longas. Interface é **minimalista mas informativa**, priorizando dados sobre decoração, com hierarquia clara e uso estratégico de cor para destacar informações críticas (prazos urgentes em vermelho, status em badges coloridos).

---

## Color Selection

**Esquema:** Analogous (tons de azul/roxo) com acentos complementares (laranja/amarelo para warnings)

### Aplicação:

- **Primary Color (Azul #48cae4):** Ações principais, links, elementos interativos. Transmite profissionalismo e confiabilidade. Usado em botões primários, headers de cards importantes e ícones principais.

- **Secondary Colors:**
  - **Roxo escuro (#5a67d8):** Elementos de IA (Harvey Specter, Mrs. Michael Ross), indicando inteligência e inovação
  - **Cinza escuro (#1e2130):** Background de cards e painéis, criando profundidade
  - **Cinza médio (#2d3748):** Borders e divisores, definindo estrutura

- **Accent Color (Laranja #fb8500):** CTAs críticos (Nova Tarefa, Urgente), warnings de prazo. Chama atenção sem ser agressivo.

- **Status Colors:**
  - **Verde (#52b788):** Sucesso, concluído, status positivo
  - **Amarelo (#ffd60a):** Aguardando, pendente
  - **Vermelho (#e63946):** Urgente, atrasado, erro
  - **Azul (#48cae4):** Em andamento, processando

### Foreground/Background Pairings:

- **Background (Escuro #0f1117):** Texto branco (#f8f9fa) - Ratio 15.8:1 ✓
- **Card (Cinza escuro #1e2130):** Texto branco (#f8f9fa) - Ratio 12.1:1 ✓
- **Primary (Azul #48cae4):** Texto escuro (#0f1117) - Ratio 8.2:1 ✓
- **Accent (Laranja #fb8500):** Texto branco (#f8f9fa) - Ratio 5.1:1 ✓
- **Muted (Cinza #4a5568):** Texto cinza claro (#b0b3c1) - Ratio 4.6:1 ✓

---

## Font Selection

Fontes devem ser **legíveis, modernas e sem serifas** para garantir clareza em telas de diferentes tamanhos. Usa Inter como primária pela excelente legibilidade e Lora para textos documentais quando necessário.

### Typographic Hierarchy:

- **H1 (Título de Página):** Inter Bold/32px/tight letter spacing (-0.02em)
- **H2 (Seção):** Inter Semibold/24px/normal
- **H3 (Card Title):** Inter Semibold/18px/normal
- **Body (Parágrafo):** Inter Regular/16px/1.5 line-height
- **Small (Labels):** Inter Medium/14px/normal
- **Tiny (Metadados):** Inter Regular/12px/1.4 line-height/text-muted-foreground

---

## Animations

**Contexto:** Animações devem ser **sutis e funcionais**, nunca distrativas. Prioriza performance sobre ornamentação.

### Purposeful Meaning:

- **Feedback de Ação:** Bounce suave ao clicar botões (scale 0.95 → 1)
- **Transição de Estado:** Fade in/out ao carregar dados (200ms)
- **Drag and Drop:** Lift effect com sombra ao arrastar cards Kanban
- **Notificações:** Slide in da direita com bounce final
- **Loading:** Skeleton screens com shimmer effect

### Hierarchy of Movement:

1. **Alta Prioridade:** Feedback imediato de click/hover (< 100ms)
2. **Média Prioridade:** Transições de página/modal (200-300ms)
3. **Baixa Prioridade:** Animações decorativas (shimmer, pulso em badges)

---

## Component Selection

### Shadcn Components:

- **Button:** Ações primárias, secundárias e destrutivas
- **Card:** Container principal para todos os painéis informativos
- **Dialog:** Modals para novo lançamento, detalhes de processo
- **Dropdown Menu:** Filtros, ações em contexto
- **Badge:** Status de processos, prioridade de tarefas
- **Tabs:** Navegação dentro de páginas (Financeiro, Gestão)
- **Calendar:** Seleção de datas, visualização de agenda
- **Table:** Listas de lançamentos financeiros, expedientes
- **Form:** Inputs validados para novo processo, tarefa
- **Toast:** Feedback de ações (sucesso, erro)

### Custom Components:

- **KanbanColumn:** Coluna drag-droppable para processos
- **ProcessCard:** Card rico com status, partes, valor, ações
- **PerformanceChart:** Gráfico de linha para dashboard
- **FinancialBarChart:** Gráfico de barras receitas x despesas
- **AgentStatusIndicator:** Dot pulsante indicando agente ativo
- **PrazoCalculator:** Interface especializada para cálculo de prazos

### States:

- **Button:** Default, Hover (bg lighter), Active (scale 0.95), Disabled (opacity 50%, cursor not-allowed), Loading (spinner)
- **Input:** Default, Focus (ring azul), Error (border vermelho, texto de erro abaixo), Disabled
- **ProcessCard:** Default, Hover (lift com sombra), Dragging (opacity 60%, rotate 3deg), Selected (border azul)

### Icon Selection:

- **Phosphor Icons** exclusivamente para consistência
- **CheckCircle:** Tarefas concluídas, sucesso
- **Clock:** Prazos, tarefas pendentes
- **Warning:** Urgência, atenção necessária
- **Robot:** IA, agentes, automação
- **FileText:** Documentos, processos
- **CalendarDots:** Agenda, compromissos
- **TrendUp:** Métricas positivas
- **Currency:** Financeiro
- **Gavel:** Jurídico, processos

### Spacing:

Tailwind spacing scale (4px base):
- **Intra-componente:** p-3 (12px)
- **Entre elementos relacionados:** gap-2 (8px)
- **Entre seções:** gap-6 (24px)
- **Margens de página:** p-6 (24px) em desktop, p-4 (16px) em mobile

### Mobile:

**Mobile-first com progressive enhancement:**

- **Breakpoints:** sm (640px), md (768px), lg (1024px), xl (1280px)
- **Dashboard:** Cards em coluna única < md, grid 2x2 >= md, 4 colunas >= lg
- **Kanban:** Scroll horizontal < md, colunas visíveis >= md
- **Sidebar:** Hidden por padrão < md, drawer que slide-in, sempre visível >= lg
- **Tabelas:** Scroll horizontal ou card stack < md
- **Modals:** Full-screen < sm, centered dialog >= sm
- **Font sizes:** Scale down 2px em mobile (H1: 28px mobile, 32px desktop)

---

## Technical Stack

- **Framework:** React 19 + TypeScript
- **Build:** Vite
- **Styling:** Tailwind CSS v4
- **Components:** Shadcn v4
- **Icons:** Phosphor Icons
- **State:** Zustand + useKV (Spark)
- **Forms:** React Hook Form + Zod
- **Charts:** Recharts
- **AI:** spark.llm (Gemini)
- **Animations:** Framer Motion (seletivamente)

---

## Non-Functional Requirements

### Performance

- Time to Interactive < 2s
- Largest Contentful Paint < 1.5s
- Cumulative Layout Shift < 0.1
- spark.llm responses < 3s

### Accessibility

- WCAG 2.1 AA compliance
- Keyboard navigation completa
- Screen reader support
- Focus indicators visíveis

### Security

- Dados sensíveis via useKV (client-side encryption)
- Validação Zod em todos os forms
- Sanitização de inputs antes de enviar para IA

---

## Success Metrics

- **Adoção:** 80%+ dos usuários acessam dashboard diariamente
- **Eficiência:** 50% redução no tempo de triagem de intimações
- **Precisão:** 95%+ de acurácia em extração de dados por IA
- **Satisfação:** NPS > 50 após 30 dias de uso

---

**Version:** 1.0  
**Last Updated:** 2025-01-16  
**Status:** Active Development
