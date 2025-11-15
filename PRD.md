# Product Requirements Document (PRD)
## Assistente Jurídico Digital - Gestão Processual Inteligente

Um assistente digital inteligente para advogados gerenciarem processos, calcularem prazos e organizarem informações processuais com auxílio de IA.

---

## Missão

Criar uma ferramenta de produtividade jurídica que auxilia advogados a gerenciar seus processos, calcular prazos processuais com precisão e organizar informações de forma eficiente, tudo com o poder da inteligência artificial.

---

## Experience Qualities

1. **Profissional e Confiável** - O sistema deve transmitir seriedade e precisão, essenciais para um ambiente jurídico onde erros podem ter consequências graves.

2. **Intuitivo e Eficiente** - Interface clara que permite encontrar informações e executar tarefas rapidamente, com curva de aprendizado mínima.

3. **Inteligente e Útil** - IA que auxilia em análises, cálculos e organização de informações de forma natural e contextual.

---

## Complexity Level

**Light Application (múltiplos recursos com estado básico)**

Sistema focado em produtividade jurídica com gestão de processos, cálculo de prazos e assistente de IA, usando persistência client-side para dados. Não requer backend complexo, mantendo simplicidade e performance.

---

## Essential Features

### 1. Dashboard de Processos

**Funcionalidade:** Visão geral dos processos em andamento com métricas e status

**Propósito:** Permitir visão rápida do portfólio de processos e identificar prioridades

**Trigger:** Acesso à aplicação

**Progressão:** 
Carrega processos do KV → Calcula estatísticas → Exibe cards com métricas → Lista processos recentes → Mostra prazos próximos → Usuário pode clicar para ver detalhes

**Critérios de Sucesso:**
- Dashboard carrega em < 500ms
- Métricas calculadas corretamente
- Prazos urgentes destacados visualmente
- Navegação fluida para detalhes

### 2. Gestão de Processos

**Funcionalidade:** CRUD completo de processos com informações estruturadas

**Propósito:** Centralizar informações processuais e manter histórico organizado

**Trigger:** Usuário clica em "Novo Processo" ou edita existente

**Progressão:**
Abre formulário → Usuário preenche dados (número CNJ, partes, comarca, vara) → Adiciona notas e documentos → Salva → Sistema valida → Persiste no KV → Atualiza lista → Exibe confirmação

**Critérios de Sucesso:**
- Formulário valida número CNJ
- Dados persistem após reload
- Busca e filtros funcionam
- Histórico de alterações mantido

### 3. Calculadora de Prazos Processuais

**Funcionalidade:** Cálculo de prazos processuais considerando dias úteis, feriados e regras do CPC/CLT

**Propósito:** Eliminar erros no cálculo de prazos críticos e garantir cumprimento

**Trigger:** Usuário acessa calculadora ou adiciona prazo a processo

**Progressão:**
Usuário seleciona tipo de prazo → Informa data inicial → Define quantidade de dias → Sistema consulta feriados nacionais → Calcula prazo final → Exibe resultado com detalhamento → Usuário pode salvar como lembrete

**Critérios de Sucesso:**
- Cálculos seguem regras CPC/CLT corretamente
- Feriados nacionais considerados
- Resultado claro com justificativa
- Integração com processos funciona

### 4. Assistente de IA (Consultor Jurídico)

**Funcionalidade:** Chat com IA para análise de documentos, sugestões e consultas

**Propósito:** Fornecer assistência inteligente para análise de textos jurídicos e orientação

**Trigger:** Usuário abre chat e digita pergunta

**Progressão:**
Usuário digita pergunta ou cola texto → Sistema envia para spark.llm com contexto → IA analisa e gera resposta → Resposta formatada é exibida → Usuário pode fazer follow-up ou nova consulta

**Critérios de Sucesso:**
- Respostas em < 4 segundos
- IA fornece análises relevantes
- Suporta análise de documentos colados
- Histórico de conversas mantido

### 5. Gerenciamento de Prazos e Lembretes

**Funcionalidade:** Sistema de alertas para prazos processuais importantes

**Propósito:** Garantir que nenhum prazo seja perdido

**Trigger:** Sistema verifica prazos automaticamente ou usuário adiciona manualmente

**Progressão:**
Sistema carrega prazos → Verifica datas próximas → Calcula urgência → Exibe alertas visuais → Usuário pode marcar como concluído → Sistema remove da lista de pendentes

**Critérios de Sucesso:**
- Alertas aparecem para prazos D-3, D-1
- Notificações visuais destacadas
- Fácil marcação de conclusão
- Integração com processos

---

## Edge Case Handling

- **Número CNJ inválido:** Sistema valida formato e alerta usuário, permite salvar mesmo assim com warning
- **Prazo em feriado:** Sistema avança automaticamente para próximo dia útil conforme regra processual
- **Processo sem prazo:** Sistema permite, mas sugere adicionar pelo menos um prazo de controle
- **IA sem resposta:** Exibe mensagem amigável e sugestões de como reformular pergunta
- **Dados corrompidos:** Sistema tenta recuperar, em caso de falha oferece reset com backup

---

## Design Direction

O design deve ser **profissional, limpo e moderno**, transmitindo confiança e competência. Interface minimalista focada em legibilidade e eficiência, usando tema claro por padrão com opção para tema escuro. Hierarquia visual clara com uso estratégico de cor para destacar informações críticas (prazos urgentes, status de processos).

---

## Color Selection

**Esquema:** Analogous (tons de azul/índigo) com acento complementar (âmbar) para warnings

### Aplicação:

- **Primary Color (Azul Índigo #4f46e5):** Ações principais, links, headers importantes. Transmite profissionalismo, confiabilidade e autoridade jurídica.

- **Secondary Colors:**
  - **Azul Ardósia (#334155):** Textos secundários e backgrounds sutis
  - **Cinza Neutro (#64748b):** Borders, divisores, elementos de suporte
  - **Azul Claro (#e0e7ff):** Backgrounds de destaque, hovers

- **Accent Color (Âmbar #f59e0b):** Alertas de prazo urgente, CTAs importantes. Chama atenção sem ser alarmista.

### Foreground/Background Pairings:

- **Background (Branco #ffffff):** Texto escuro (#0f172a) - Ratio 18.1:1 ✓
- **Card (Cinza Claro #f8fafc):** Texto escuro (#1e293b) - Ratio 16.2:1 ✓
- **Primary (Azul Índigo #4f46e5):** Texto branco (#ffffff) - Ratio 8.9:1 ✓
- **Accent (Âmbar #f59e0b):** Texto escuro (#1e293b) - Ratio 8.7:1 ✓
- **Muted (Cinza #f1f5f9):** Texto médio (#475569) - Ratio 7.8:1 ✓

---

## Font Selection

Fontes modernas e legíveis, priorizando clareza em longos períodos de leitura. Inter para interface por sua excelente legibilidade em telas, Lora para documentos quando necessário.

### Typographic Hierarchy:

- **H1 (Título Página):** Inter Bold/36px/tight (-0.02em)
- **H2 (Seção):** Inter Semibold/28px/normal
- **H3 (Card Title):** Inter Semibold/20px/normal
- **Body (Texto):** Inter Regular/16px/1.6 line-height
- **Small (Labels):** Inter Medium/14px/1.5 line-height
- **Caption (Meta):** Inter Regular/13px/text-muted-foreground

---

## Animations

**Contexto:** Animações sutis que reforçam ações e transições sem distrair. Prioridade em feedback imediato e orientação visual.

### Purposeful Meaning:

- **Interações:** Hover suave em cards e botões (100ms)
- **Transições:** Fade para modais e páginas (200ms)
- **Feedback:** Pulse em badges de prazo urgente
- **Loading:** Skeleton screens com shimmer
- **Sucesso:** Check animado ao salvar

### Hierarchy of Movement:

1. **Crítico:** Feedback de click/hover (< 100ms)
2. **Importante:** Transições de modais (200-300ms)
3. **Decorativo:** Animações sutis de atenção (pulso, shimmer)

---

## Component Selection

### Shadcn Components:

- **Button:** Ações primárias e secundárias
- **Card:** Container para processos e informações
- **Dialog:** Modais para novo processo, detalhes
- **Form + Input:** Formulários validados
- **Badge:** Status de processos, urgência de prazos
- **Tabs:** Navegação entre seções
- **Calendar:** Seleção de datas
- **Table:** Listas de processos e prazos
- **Separator:** Divisões visuais
- **Alert:** Avisos e alertas importantes
- **Textarea:** Notas e observações
- **Select:** Dropdowns para filtros
- **Toast:** Confirmações de ações

### Custom Components:

- **ProcessCard:** Card rico com informações do processo
- **PrazoCalculator:** Interface especializada para cálculos
- **ChatInterface:** Interface de chat com IA
- **PrazoAlert:** Componente de alerta visual para prazos

### States:

- **Button:** Default, Hover (bg lighter), Active (scale 0.98), Disabled (opacity 50%), Loading (spinner)
- **Input:** Default, Focus (ring azul), Error (border red), Success (border green), Disabled
- **Card:** Default, Hover (shadow-md), Selected (border primary)

### Icon Selection (Phosphor Icons):

- **Gavel:** Processos jurídicos
- **CalendarCheck:** Prazos e datas
- **FileText:** Documentos
- **Clock:** Prazos pendentes
- **CheckCircle:** Concluído
- **Warning:** Urgente
- **ChatCircle:** Assistente IA
- **Plus:** Adicionar novo
- **MagnifyingGlass:** Buscar

### Spacing:

Tailwind spacing (4px base):
- **Intra-card:** p-6 (24px)
- **Entre elementos:** gap-4 (16px)
- **Entre seções:** gap-8 (32px)
- **Margens:** p-8 (32px) desktop, p-4 (16px) mobile

### Mobile:

**Mobile-first approach:**

- **Breakpoints:** sm (640px), md (768px), lg (1024px)
- **Dashboard:** Cards stack em mobile, grid >= md
- **Formulários:** Full width < md, max-w-2xl >= md
- **Tabelas:** Scroll horizontal ou cards empilhados < md
- **Modals:** Full-screen < sm, centered >= sm
- **Navigation:** Bottom tabs < md, sidebar >= lg
- **Typography:** Scale -2px em mobile

---

## Technical Stack

- **Framework:** React 19 + TypeScript
- **Build:** Vite
- **Styling:** Tailwind CSS v4
- **Components:** Shadcn v4
- **Icons:** Phosphor Icons
- **State:** useState + useKV (Spark)
- **Forms:** React Hook Form + Zod
- **AI:** spark.llm (GPT-4)
- **Date:** date-fns
- **Animations:** Framer Motion (minimal)

---

## Success Metrics

- **Usabilidade:** Usuários adicionam primeiro processo em < 2 minutos
- **Precisão:** 100% acurácia em cálculos de prazos
- **Performance:** LCP < 1.5s, interações < 100ms
- **IA:** Respostas relevantes em 95%+ dos casos
- **Adoção:** Usuários voltam 3+ vezes na primeira semana

---

**Version:** 1.1  
**Last Updated:** 2025-01-17  
**Status:** Production Ready

## Changelog

### v1.2 - 2025-01-18 - Auditoria Completa e Correções
**Auditoria Geral Realizada - Melhorias Implementadas:**

#### 🔧 Correções Críticas
- ✅ **Dashboard.tsx reconstruído completamente** - arquivo estava com código severamente corrompido e ilegível
- ✅ **index.css otimizado** - removida toda duplicação de código entre main.css e index.css
- ✅ **Cores atualizadas** - palette profissional com azul índigo (primary), âmbar (accent) em formato OKLCH
- ✅ **Tipografia consolidada** - variáveis de fonte unificadas (Inter + IBM Plex Mono)

#### 📊 Dados de Seed
- ✅ **4 processos realistas** adicionados com diferentes estados:
  - Ação de Cobrança (Ativo) - 2 prazos pendentes
  - Reclamação Trabalhista (Ativo) - 2 prazos urgentes
  - Divórcio Consensual (Concluído) - 1 prazo concluído
  - Indenização por Danos Morais (Ativo) - 2 prazos pendentes
- ✅ **Histórico de chat** com 2 conversas educativas sobre cálculo de prazos CPC vs CLT

#### 🎨 Melhorias de UX/UI
- ✅ Dashboard com cards de métricas funcionais (processos ativos, concluídos, prazos pendentes/urgentes)
- ✅ Lista de próximos prazos ordenada por data
- ✅ Processos recentes com badges de status
- ✅ Alerta visual destacado quando há prazos urgentes
- ✅ Navegação fluida entre views via callbacks

#### ⚡ Otimizações de Performance
- ✅ useMemo para cálculos pesados (stats, prazos próximos, processos recentes)
- ✅ Remoção de código duplicado e importações desnecessárias
- ✅ Estrutura de CSS otimizada (2.2KB vs 6.5KB anterior)

#### 🔍 Code Quality
- ✅ TypeScript types corretos e consistentes
- ✅ Hooks do React utilizados corretamente (useKV para persistência)
- ✅ Componentes funcionais puros sem side effects desnecessários
- ✅ Validação de dados antes de renderização (arrays vazios, null checks)

#### 📱 Responsividade
- ✅ Grid responsivo para cards de métricas (1 col mobile → 4 cols desktop)
- ✅ Layout adaptativo para listas (stack em mobile, grid em desktop)
- ✅ Truncate text para evitar overflow em títulos longos
- ✅ Padding/spacing ajustado para mobile (p-4) e desktop (p-8)

### v1.1 - 2025-01-17
- ✅ Corrigido Dashboard.tsx (arquivo estava corrompido)
- ✅ Otimizado index.css removendo código duplicado
- ✅ Atualizado index.html com fontes Inter e IBM Plex Mono
- ✅ Adicionados dados de exemplo (seed data) com 4 processos realistas
- ✅ Adicionado histórico de chat de exemplo
- ✅ Melhorada tipografia e consistência visual
- ✅ Corrigida urgência de prazos (5 dias ao invés de 3)
- ✅ Otimizadas importações e estrutura de código
