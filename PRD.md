# Assistente Jurídico Digital - PRD

Um sistema completo de gestão processual inteligente com agentes de IA autônomos para escritórios de advocacia.

**Experience Qualities**:
1. **Profissional** - Interface séria e confiável que transmite autoridade e competência jurídica
2. **Eficiente** - Fluxos otimizados que economizam tempo em tarefas repetitivas e análises complexas
3. **Inteligente** - IA que antecipa necessidades e fornece insights estratégicos proativamente

**Complexity Level**: Complex Application (advanced functionality, accounts)
  - Sistema multi-módulo com gerenciamento de processos, clientes, prazos, finanças, e múltiplos agentes de IA autônomos trabalhando 24/7

## Essential Features

### 1. Sistema de Autenticação
- **Functionality**: Login com diferentes níveis de acesso (advogado, estagiário, admin)
- **Purpose**: Controlar acesso e personalizar experiência por função
- **Trigger**: Acesso à aplicação
- **Progression**: Tela de login → Validação de credenciais → Dashboard personalizado
- **Success criteria**: Usuário autenticado acessa apenas recursos permitidos para sua função

### 2. Harvey Specter - Assistente IA Estratégico
- **Functionality**: Chat inteligente que analisa performance, processos, prazos e finanças
- **Purpose**: Fornecer insights executivos instantâneos sem necessidade de navegar por múltiplos relatórios
- **Trigger**: Usuário faz pergunta em linguagem natural
- **Progression**: Pergunta do usuário → Análise de contexto → Geração de insights visuais → Resposta estruturada com métricas
- **Success criteria**: Resposta precisa em menos de 2 segundos com insights acionáveis

### 3. Mrs. Justin-e - Analista de Intimações
- **Functionality**: Analisa intimações automaticamente com 95% de precisão em menos de 1 minuto
- **Purpose**: Economizar 50 horas a cada 150 intimações analisadas
- **Trigger**: Upload de PDF de intimação ou integração com PJe
- **Progression**: Recebimento de intimação → Extração de dados → Cálculo de prazos → Orientação de controller → Sugestão de tarefas → Preparação de atendimentos
- **Success criteria**: Intimação processada com todos os prazos calculados e tarefas sugeridas em menos de 60 segundos

### 4. Sistema de Agentes Autônomos
- **Functionality**: 15 agentes de IA especializados trabalhando continuamente (monitoramento DJEN, gestão de prazos, análise documental, etc.)
- **Purpose**: Automatizar tarefas repetitivas 24/7 e permitir foco em trabalho estratégico
- **Trigger**: Agentes ativados pelo usuário ou eventos automáticos (publicação DJEN, vencimento de prazo, novo documento)
- **Progression**: Evento detectado → Fila de tarefas → Processamento por agente → Notificação ou ação automática → Registro em log
- **Success criteria**: Tarefas processadas automaticamente sem intervenção humana, com log completo de atividades

### 5. Gestão de Processos
- **Functionality**: CRUD completo de processos com tracking de status, prazos e documentos
- **Purpose**: Centralizar todas as informações processuais em um único local
- **Trigger**: Cadastro de novo processo ou atualização de processo existente
- **Progression**: Criação/edição de processo → Preenchimento de dados → Upload de documentos → Definição de prazos → Atribuição de responsáveis
- **Success criteria**: Processo cadastrado com todos os dados relevantes acessíveis em um único clique

### 6. Gestão de Prazos
- **Functionality**: Cálculo automático de prazos processuais com alertas de vencimento
- **Purpose**: Nunca perder um prazo fatal
- **Trigger**: Cadastro de novo prazo ou intimação
- **Progression**: Definição de prazo → Cálculo automático considerando feriados/finais de semana → Configuração de alertas (D-7, D-2, D-1) → Notificações por e-mail/app
- **Success criteria**: Zero prazos perdidos com alertas em múltiplos canais

### 7. Gestão Financeira
- **Functionality**: Controle de honorários, despesas, faturamento e inadimplência
- **Purpose**: Visibilidade completa da saúde financeira do escritório
- **Trigger**: Lançamento de receita/despesa ou consulta de relatório
- **Progression**: Registro de movimentação → Categorização → Atualização de dashboards → Geração de insights (margem, inadimplência, projeções)
- **Success criteria**: Margem de lucro e status de recebíveis visíveis em tempo real

### 8. Base de Conhecimento
- **Functionality**: Repositório de jurisprudências, modelos de petições e pesquisas
- **Purpose**: Acelerar redação de peças e fundamentação jurídica
- **Trigger**: Busca por precedente ou modelo
- **Progression**: Query de busca → Análise semântica → Resultados rankeados por relevância → Preview e download
- **Success criteria**: Precedente ou modelo encontrado em menos de 30 segundos

## Edge Case Handling

- **Upload de PDF corrompido**: Notificação clara de erro com sugestão de tentar novamente ou usar OCR alternativo
- **Prazo em dia atípico**: Sistema consulta calendário judicial automaticamente e ajusta cálculo
- **Conflito de agendamento**: Alertas visuais destacados com sugestão de redistribuição
- **Agente IA com baixa confiança**: Sinalização de "revisão humana necessária" antes de executar ação
- **Dados incompletos em processo**: Validação em tempo real com indicação clara de campos obrigatórios
- **Falha de conexão com APIs externas**: Retry automático com fallback para modo offline e sincronização posterior

## Design Direction

O design deve evocar profissionalismo jurídico moderno com toques de tecnologia futurista - sério mas não antiquado, confiável mas não conservador demais. Interface minimalista que privilegia dados e ações sobre decoração, com hierarquia visual clara que guia o usuário naturalmente pelas informações mais importantes.

## Color Selection

**Custom palette** - Tons escuros e frios que evocam seriedade e tecnologia, com acentos vibrantes de cyan/magenta para criar contraste moderno e energia tecnológica.

- **Primary Color**: Cyan elétrico (oklch(0.75 0.25 190)) - Representa inteligência artificial e tecnologia de ponta, usado em CTAs principais e ícones de agentes
- **Secondary Colors**: 
  - Magenta vibrante (oklch(0.70 0.26 300)) - Suporta a identidade tech, usado em elementos secundários
  - Rosa accent (oklch(0.75 0.28 350)) - Adiciona sofisticação, usado para destaques especiais
- **Accent Color**: Cyan brilhante - Destaca ações críticas como envio de petição, alertas de prazo fatal
- **Destructive**: Vermelho alaranjado (oklch(0.65 0.28 25)) - Prazos urgentes, ações irreversíveis

**Foreground/Background Pairings**:
- Background (Dark Navy oklch(0.12 0.03 240)): Light Cyan text (oklch(0.92 0.02 180)) - Ratio 16.2:1 ✓
- Card (Dark Slate oklch(0.16 0.04 240)): Light Cyan text (oklch(0.92 0.02 180)) - Ratio 14.8:1 ✓
- Primary (Cyan oklch(0.75 0.25 190)): White text (oklch(0.98 0.01 0)) - Ratio 8.1:1 ✓
- Secondary (Magenta oklch(0.70 0.26 300)): White text (oklch(0.98 0.01 0)) - Ratio 6.9:1 ✓
- Accent (Pink oklch(0.75 0.28 350)): Dark Navy text (oklch(0.12 0.02 0)) - Ratio 11.2:1 ✓

## Font Selection

Tipografia que equilibra profissionalismo jurídico com modernidade tech - san-serif limpa para interface, com serif elegante para títulos principais quando apropriado, e mono para dados técnicos (números de processo, códigos).

**Fonts**: Inter (sans-serif principal), Cormorant (serif para títulos), Geist Mono (dados técnicos)

- **Typographic Hierarchy**:
  - H1 (Títulos de seção): Inter Bold/32px/tight letter spacing (-0.02em)
  - H2 (Card titles): Inter SemiBold/20px/normal
  - H3 (Subsections): Inter SemiBold/16px/normal
  - Body (Textos gerais): Inter Regular/14px/1.5 line-height
  - Caption (Metadata, timestamps): Inter Regular/12px/1.4 line-height/muted color
  - Data (Números de processo): Geist Mono Medium/14px/tabular-nums
  - Legal Titles (Nomes formais): Cormorant SemiBold/24px/elegant spacing

## Animations

Animações devem ser sutis e funcionais, nunca chamativas - reforçando feedback de ações sem atrasar o fluxo de trabalho. Movimento serve para orientar atenção (novos alertas, conclusão de tarefas de agentes) e comunicar hierarquia de informação.

- **Purposeful Meaning**: Pulse suave em ícones de agentes ativos transmite "trabalhando em segundo plano", gradientes animados em cards especiais (Harvey, Mrs. Justin-e) comunicam tecnologia avançada
- **Hierarchy of Movement**: Alertas de prazo fatal têm animação mais proeminente (subtle shake + glow), tarefas concluídas têm fade-in smooth, transições de página são instantâneas para não atrasar advogados

## Component Selection

- **Components**: 
  - **Dialog** para formulários de cadastro (cliente, processo) - foco completo sem distrações
  - **Card** para entidades principais (processos, clientes, agentes) - conteúdo agrupado visualmente
  - **Tabs** para navegação entre seções relacionadas (abas de agentes: Lista, Métricas, Fila, Histórico)
  - **Badge** para status (Ativo, Urgente, Concluído) com cores semânticas
  - **ScrollArea** para listas longas (processos, prazos) mantendo header fixo
  - **Toaster (Sonner)** para notificações não-intrusivas de sucesso/erro
  - **Button** com variantes: primary (ações principais), outline (secundárias), ghost (navegação)
  - **Input** com validação inline e ícones contextuais (search, calendar)
  - **Switch** para ativar/desativar agentes autônomos

- **Customizations**: 
  - **AgentCard**: Card customizado com switch integrado, progress bar de autonomia, e status indicator animado
  - **ProcessTimeline**: Componente custom de linha do tempo mostrando histórico processual
  - **PrazoAlert**: Badge especial com countdown e cor dinâmica baseada em urgência
  - **InsightCard**: Card de métrica com ícone, valor destacado, e descrição - usado no Harvey Specter

- **States**: 
  - Buttons: hover com lift subtle (translateY(-2px)) + shadow increase, active com press-down, disabled com opacity 50%
  - Inputs: focus com ring cyan animado, error com shake micro + border red, success com checkmark verde
  - Cards: hover com glow sutil nos de agentes ativos, click com scale(0.98) feedback

- **Icon Selection**: 
  - @phosphor-icons/react (duotone para elementos ativos, regular para inativos)
  - Robot para agentes IA, Gavel para processos, Calendar para prazos, CurrencyCircle para financeiro
  - CheckCircle para concluído, WarningCircle para atenção, Lightning para ação rápida

- **Spacing**: 
  - Container padding: p-6 (desktop), p-4 (mobile)
  - Card gaps: gap-4 padrão, gap-6 para seções principais
  - Element spacing: space-y-2 para itens relacionados, space-y-4 para grupos, space-y-6 para seções

- **Mobile**: 
  - Sidebar desktop se torna bottom navigation fixa em mobile
  - Cards em grid-cols-1 em mobile, grid-cols-2 em tablet, grid-cols-3+ em desktop
  - Tabelas se transformam em cards empilhados com informações prioritárias visíveis
  - Formulários mantêm 1 campo por linha em mobile para facilitar preenchimento
  - Floating action button para cadastros rápidos em mobile

## Recent Fixes

### Harvey Specter Chat - Error Handling (409 Conflict Resolution)

**Problem**: Usuários reportavam erro 409 (Conflict) ao usar o chat do Harvey Specter, com mensagens de "Falha ao enviar a solicitação" e travamentos.

**Root Cause**: O componente Donna.tsx estava fazendo múltiplas atualizações rápidas no KV store através de `setMessages`, o que causava conflitos de versão quando as atualizações aconteciam muito próximas uma da outra. O uso de `setTimeout` não garantia que a primeira atualização (mensagem do usuário) fosse completada antes da segunda (resposta do assistente).

**Solution Implemented**:
1. **Refatoração do handleSend**: Convertido para async/await com try-catch completo
2. **Ordem de operações corrigida**: `setInput('')` movido para antes da primeira atualização para evitar re-envios
3. **Await explícito**: Substituído setTimeout por `await new Promise(resolve => setTimeout(resolve, 800))` para garantir sequência
4. **Error handling robusto**: Mensagens de erro são capturadas e exibidas ao usuário de forma amigável
5. **IDs únicos melhorados**: Mudança de `Date.now().toString()` para `user-${Date.now()}` e `assistant-${Date.now()}` para evitar colisões
6. **Debouncing em quick questions**: handleQuickQuestion agora aguarda antes de enviar para evitar cliques duplos

**Impact**: Chat agora funciona de forma confiável sem erros 409, com feedback claro ao usuário em caso de problemas.

## New AI-Powered Features (Latest Update)

### 1. AI Document Summarizer
**Functionality**: Transforms long legal documents into executive summaries with key points extraction
- **Input**: Any legal document text (petitions, sentences, contracts)
- **Output**: Concise summary + bullet points + identified deadlines + recommended actions
- **Use Cases**: Quickly review lengthy documents, extract critical information, prepare case briefs
- **AI Model**: GPT-4o with structured JSON output

### 2. AI Contract Analyzer
**Functionality**: Analyzes contracts for risks, protections, and missing clauses
- **Risk Assessment**: Calculates risk score (0-100) and categorizes as low/medium/high
- **Identifies**: Potential risks, existing protections, missing clauses, key terms
- **Recommendations**: Actionable suggestions to mitigate identified risks
- **Use Cases**: Due diligence, contract review, negotiation preparation
- **AI Model**: GPT-4o with legal domain expertise

### 3. AI Legal Research
**Functionality**: Generates comprehensive legal research with precedents and arguments
- **Precedents**: Finds 5+ relevant case law with tribunal, date, summary, and relevance explanation
- **Legal Arguments**: Structured arguments with legal foundation, precedent citations, and doctrine references
- **Related Themes**: Suggests related topics for deeper research
- **Use Cases**: Petition drafting, appeal preparation, legal strategy development
- **AI Model**: GPT-4o with Brazilian legal knowledge

### 4. AI Email Drafter
**Functionality**: Generates professional legal emails automatically
- **Email Types**: 
  - Client - Initial Contact
  - Client - Case Updates
  - Opposing Party - Negotiation
  - Court - Petition Submission
  - Expert - Report Request
  - Formal Professional / Informal Client
- **Customization**: Recipient name, case number, custom context
- **Output**: Subject line + full email body with appropriate tone
- **Use Cases**: Save time on routine communications, maintain professional standards
- **AI Model**: GPT-4o with tone and formality control

### 5. AI Process Analysis (Enhanced ProcessosView)
**Functionality**: One-click AI analysis of any process in the system
- **Strategic Insights**: Executive summary, attention points, identified risks, recommendations, next steps
- **Auto-Documentation**: Analysis saved directly to process notes with timestamp
- **Use Cases**: Quick case review, strategic planning, client reporting
- **AI Model**: GPT-4o with process context awareness

### Technical Implementation
All AI features use the Spark LLM API:
- `spark.llmPrompt` for safe prompt construction
- `spark.llm()` for inference with GPT-4o model
- JSON mode enabled for structured outputs
- Comprehensive error handling and user feedback
- Copy/download functionality for all generated content
- Mobile-responsive design with glassmorphic styling
