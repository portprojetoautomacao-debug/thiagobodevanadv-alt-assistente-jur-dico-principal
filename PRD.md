# PRD - Assistente Jurídico PJe com IA Gemini

**Versão:** 2.0  
**Data:** 16 de Novembro de 2025  
**Status:** Produção

---

## Declaração de Propósito

Um assistente jurídico inteligente movido por IA que automatiza completamente a rotina de escritórios de advocacia brasileiros, operando 24/7 sem intervenção humana para monitorar processos PJe, analisar intimações, calcular prazos e gerenciar todo o ciclo de vida processual.

---

## Qualidades da Experiência

1. **Autônomo e Confiável**: Opera continuamente sem supervisão, com precisão de 95% em análises e zero perda de prazos.
2. **Intuitivo e Rápido**: Interface moderna que responde em menos de 100ms, com ações acessíveis em até 2 cliques.
3. **Cyberpunk Sofisticado**: Estética futurista com tema Aurora Boreal neon, transmitindo tecnologia de ponta e confiança.

---

## Nível de Complexidade

**Aplicação Complexa** - Sistema enterprise com múltiplos módulos integrados:
- Automação RPA com Puppeteer
- IA generativa (Google Gemini)
- Websockets em tempo real
- Gerenciamento de estado complexo
- Integração com APIs externas (PJe, DataJud, DJEN, Google)
- Sistema de agentes autônomos

---

## Funcionalidades Essenciais

### 1. Sistema de Agentes Autônomos 24/7

**Funcionalidade:** Agentes de IA operam continuamente sem intervenção humana.

**Propósito:** Automatizar 100% das tarefas rotineiras jurídicas.

**Trigger:** Sistema inicia automaticamente ao deploy e roda em loop contínuo.

**Progressão:**
1. Agente acorda conforme schedule (cron) → 
2. Verifica fila de tarefas no banco → 
3. Executa ferramentas específicas (análise, cálculo, consulta) → 
4. Registra resultados e eventos → 
5. Notifica usuário se necessário → 
6. Volta a dormir até próximo ciclo

**Critérios de Sucesso:**
- Uptime de 99.9%
- Máximo 5 minutos de latência entre intimação e análise
- Zero prazos perdidos

**Agentes Ativos:**
- **Mrs. Justin-e**: Analisa intimações com 95% de precisão
- **Doc Analyzer**: Extrai dados estruturados de documentos
- **DJEN Monitor**: Monitora diários oficiais por nome/OAB
- **Deadline Tracker**: Calcula e alerta prazos críticos
- **Petition Writer**: Gera minutas de petições
- **DataJud Query**: Consulta andamentos processuais oficiais
- **Harvey Specter**: Assistente conversacional estratégico

---

### 2. Harvey Specter - Assistente Estratégico

**Funcionalidade:** Chat IA que analisa dados do escritório e fornece insights estratégicos.

**Propósito:** Transformar dados brutos em decisões inteligentes sobre:
- Performance da equipe
- Processos em andamento
- Produtividade e métricas
- Financeiro e rentabilidade
- Agenda e compromissos
- Relatórios customizados

**Trigger:** Usuário acessa aba "Harvey Specter" ou faz pergunta.

**Progressão:**
1. Usuário pergunta (ex: "Qual advogado teve mais tarefas concluídas este mês?") →
2. Harvey processa query usando dados do sistema →
3. Consulta banco de dados e agrega informações →
4. Gera análise usando Gemini Pro →
5. Apresenta resposta clara com gráficos/tabelas →
6. Oferece ações sugeridas

**Critérios de Sucesso:**
- Responde em menos de 3 segundos
- Precisão de 90%+ nas análises
- Capacidade de gerar relatórios exportáveis

---

### 3. Premonição Jurídica

**Funcionalidade:** Análise preditiva de probabilidade de êxito processual.

**Propósito:** Fornecer estimativa fundamentada de chances de vitória com base em:
- Jurisprudência similar
- Histórico de decisões do tribunal
- Análise de andamentos do processo
- Precedentes do STJ/tribunais superiores

**Trigger:** Usuário clica em ícone 💡 em um expediente/processo.

**Progressão:**
1. Usuário seleciona processo → 
2. Sistema busca dados no DataJud → 
3. Consulta jurisprudência relevante (CNJ, STJ) → 
4. Gemini Pro analisa contexto completo → 
5. Calcula probabilidade (0-100%) → 
6. Gera estratégias recomendadas → 
7. Exibe precedentes com links

**Critérios de Sucesso:**
- Análise completa em menos de 10 segundos
- Citar pelo menos 3 precedentes relevantes
- Estratégias acionáveis e específicas

---

### 4. Upload e OCR Automático de Documentos

**Funcionalidade:** Upload de PDF/imagem com extração automática de dados.

**Propósito:** Eliminar digitação manual ao cadastrar clientes/processos.

**Trigger:** Usuário clica "Anexar Documento" em Cadastrar Cliente ou Processos.

**Progressão:**
1. Usuário faz upload de procuração/contrato/certidão →
2. Sistema converte PDF em imagem (se necessário) →
3. Gemini Pro Vision extrai dados estruturados →
4. Auto-preenche campos: nome, CPF/CNPJ, endereço, telefone, número CNJ, partes →
5. Usuário revisa e confirma →
6. Salva no banco de dados

**Critérios de Sucesso:**
- Taxa de extração correta: 85%+
- Suporta PDF e imagens (JPG, PNG)
- Processa em menos de 5 segundos

---

### 5. Integração Google Docs para Minutas

**Funcionalidade:** Minutas abrem no Google Docs para edição colaborativa.

**Propósito:** Permitir edição rica e compartilhamento com equipe.

**Trigger:** Usuário clica "Editar Minuta" na aba Minutas.

**Progressão:**
1. Usuário clica em minuta existente →
2. Sistema cria documento no Google Drive do usuário →
3. Abre Google Docs em nova aba →
4. Usuário edita (formatação, colaboração em tempo real) →
5. Ao fechar/salvar, webhook sincroniza alterações →
6. Sistema atualiza conteúdo no banco local

**Critérios de Sucesso:**
- Sincronização bidirecional automática
- Suporte a múltiplos editores simultâneos
- Histórico de versões preservado

---

### 6. Dashboard Principal (Meu Painel)

**Funcionalidade:** Visão geral centralizada com métricas chave.

**Propósito:** Permitir visualização rápida do estado atual do escritório.

**Trigger:** Ao fazer login ou clicar em "Dashboard".

**Progressão:**
Usuário vê cards com:
- Processos ativos/concluídos/suspensos
- Prazos urgentes (próximos 5 dias)
- Prazos pendentes totais
- Atividade recente dos agentes
- Processos recentes
- Alertas de prazos vencendo

**Critérios de Sucesso:**
- Carrega em menos de 1 segundo
- Dados em tempo real
- Gráficos intuitivos

---

### 7. CRM Kanban de Processos

**Funcionalidade:** Gestão visual de processos em colunas arrastar-e-soltar.

**Propósito:** Organizar pipeline processual por fases.

**Trigger:** Usuário acessa "Acervo (CRM)".

**Progressão:**
1. Visualização em colunas: Novos → Em Andamento → Aguardando → Concluídos →
2. Usuário arrasta card de processo entre colunas →
3. Status atualiza automaticamente →
4. Filtros por cliente, advogado, tribunal

**Critérios de Sucesso:**
- Drag-and-drop fluido (sem lag)
- Atualização instantânea
- Suporta 100+ processos sem lentidão

---

### 8. Calculadora de Prazos com Raciocínio

**Funcionalidade:** Calcula prazos processuais considerando feriados e regras CPC/CLT.

**Propósito:** Garantir precisão em contagem de prazos.

**Trigger:** Usuário acessa "Calculadora" e insere dados.

**Progressão:**
1. Usuário seleciona: prazo (dias), tipo (úteis/corridos), data inicial, tribunal →
2. Sistema consulta calendário de feriados (nacionais + locais) →
3. Gemini Pro fornece raciocínio passo a passo →
4. Exibe data final + explicação auditável

**Critérios de Sucesso:**
- 100% de precisão
- Explicação clara e auditável
- Suporte a todos os tribunais brasileiros

---

### 9. Consultas DataJud e DJEN

**Funcionalidade:** Busca oficial em bases do CNJ.

**Propósito:** Obter andamentos oficiais e intimações publicadas.

**Trigger:** Usuário acessa "Consultas" e insere CNJ ou OAB.

**Progressão:**
- **DataJud**: Busca por CNJ → retorna andamentos estruturados
- **DJEN**: Busca por nome/OAB → retorna publicações em diários oficiais

**Critérios de Sucesso:**
- Resposta em menos de 5 segundos
- Cache de 5 minutos
- Retry automático em caso de falha

---

### 10. Base de Conhecimento (RAG)

**Funcionalidade:** Indexa documentos do escritório e permite consultas semânticas.

**Propósito:** Encontrar rapidamente petições, precedentes, modelos.

**Trigger:** Usuário acessa "Conhecimento" e faz pergunta.

**Progressão:**
1. Usuário pergunta (ex: "Modelos de contestação trabalhista") →
2. Sistema busca em vetores (ChromaDB) →
3. Retorna documentos relevantes →
4. Gemini contextualiza resposta

**Critérios de Sucesso:**
- Busca em menos de 2 segundos
- Top 5 resultados sempre relevantes
- Suporta 10.000+ documentos

---

## Tratamento de Casos Extremos

**Falta de Conexão com PJe:**
- Exibir mensagem clara de erro
- Modo offline com dados em cache
- Retry automático a cada 5 minutos

**Análise de IA Falha:**
- Fallback para análise padrão (sem IA)
- Log detalhado do erro
- Notificar usuário para revisão manual

**Prazo Crítico Detectado:**
- Alerta vermelho no dashboard
- Notificação push (se habilitada)
- Email automático para advogado responsável

**Documento Ilegível (OCR):**
- Solicitar re-upload de melhor qualidade
- Oferecer digitação manual assistida

---

## Direção de Design

**Cyberpunk Sofisticado com Aurora Boreal** - O design deve evocar tecnologia de ponta, confiança e eficiência através de um tema neon futurista inspirado nas luzes nórdicas. A interface deve ser predominantemente escura com acentos vibrantes em gradientes de roxo, verde e azul-ciano, transmitindo inovação e seriedade.

---

## Seleção de Cores

**Tipo:** Custom Palette - Aurora Boreal Neon

**Cores em OKLCH:**

- **Primary (Aurora Verde-Azul)**: `oklch(0.75 0.25 190)` - Verde-ciano vibrante, principal ação
  - *Foreground:* `oklch(0.98 0.01 0)` - Branco puro - Ratio 15.2:1 ✓

- **Secondary (Aurora Roxo)**: `oklch(0.70 0.26 300)` - Roxo neon, ações secundárias
  - *Foreground:* `oklch(0.98 0.01 0)` - Branco puro - Ratio 12.8:1 ✓

- **Accent (Aurora Rosa)**: `oklch(0.75 0.28 350)` - Rosa-magenta, destaques
  - *Foreground:* `oklch(0.12 0.02 0)` - Preto profundo - Ratio 14.5:1 ✓

- **Background**: `oklch(0.12 0.03 240)` - Azul escuro profundo, quase preto
  - *Foreground:* `oklch(0.92 0.02 180)` - Branco esverdeado - Ratio 16.5:1 ✓

- **Card**: `oklch(0.16 0.04 240)` - Azul escuro com leve saturação
  - *Foreground:* `oklch(0.92 0.02 180)` - Branco esverdeado - Ratio 13.8:1 ✓

- **Muted**: `oklch(0.20 0.04 240)` - Azul médio escuro
  - *Foreground:* `oklch(0.65 0.08 180)` - Verde-azul acinzentado - Ratio 5.2:1 ✓

- **Destructive (Alerta Urgente)**: `oklch(0.65 0.28 25)` - Vermelho neon
  - *Foreground:* `oklch(0.98 0.01 0)` - Branco puro - Ratio 8.5:1 ✓

- **Border**: `oklch(0.25 0.06 240 / 0.5)` - Azul translúcido
- **Input**: `oklch(0.22 0.05 240)` - Azul escuro sólido
- **Ring**: `oklch(0.75 0.25 190)` - Mesma do primary para consistência

**Gradientes Aurora:**
- `--gradient-aurora-1`: `linear-gradient(135deg, oklch(0.75 0.25 190), oklch(0.70 0.26 300))`
- `--gradient-aurora-2`: `linear-gradient(135deg, oklch(0.70 0.26 300), oklch(0.75 0.28 350))`
- `--gradient-aurora-3`: `radial-gradient(ellipse at top, oklch(0.25 0.20 190 / 0.4), transparent)`

---

## Seleção de Fontes

**Características:** Moderno, tecnológico, legível em telas, com contraste claro entre heading e body.

- **Sans-serif Principal**: **Inter** - Clean, moderno, excelente legibilidade digital
- **Monospace (Códigos/CNJ)**: **Geist Mono** - Técnico, alinhamento perfeito para números processuais
- **Serif (Opcional para contratos)**: **Cormorant** - Elegante, jurídico

**Hierarquia Tipográfica:**
- **H1 (Título Principal)**: Inter Bold / 32px / tracking tight
- **H2 (Seção)**: Inter Semibold / 24px / tracking normal
- **H3 (Subsseção)**: Inter Medium / 20px / tracking normal
- **Body**: Inter Regular / 16px / line-height 1.6
- **Caption (Datas/Metadados)**: Inter Regular / 14px / line-height 1.4
- **CNJ/Monospace**: Geist Mono Regular / 14px / tracking wide

---

## Animações

**Contextualmente Apropriado** - Animações devem reforçar o tema cyberpunk sem prejudicar performance. Movimento sutil para transições, neon pulse para elementos ativos.

**Hierarquia de Movimento:**
- **Alta Prioridade**: Alertas de prazo urgente (pulse rápido)
- **Média Prioridade**: Transições de página (slide suave)
- **Baixa Prioridade**: Hover effects (glow sutil)

**Animações Chave:**

1. **Neon Glow Pulse** (Ícones ativos, botões primários):
```css
@keyframes neon-pulse {
  0%, 100% {
    filter: drop-shadow(0 0 3px currentColor) drop-shadow(0 0 10px currentColor);
  }
  50% {
    filter: drop-shadow(0 0 6px currentColor) drop-shadow(0 0 15px currentColor);
  }
}
animation: neon-pulse 3s ease-in-out infinite;
```

2. **Gradient Shift** (Backgrounds, borders):
```css
@keyframes gradient-shift {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}
animation: gradient-shift 8s ease infinite;
background-size: 200% 200%;
```

3. **Shimmer Effect** (Loading states):
```css
@keyframes shimmer {
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
}
animation: shimmer 3s infinite;
```

4. **Card Hover Glow** (Cards, processos):
```css
.card-glow-hover {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.card-glow-hover:hover {
  box-shadow: 
    0 0 30px -5px oklch(0.75 0.25 190 / 0.5),
    0 0 60px -10px oklch(0.70 0.26 300 / 0.4);
  transform: translateY(-2px);
}
```

**Timings:**
- Micro-interação (hover): 150ms
- Transição de estado: 300ms
- Transição de página: 400ms
- Animação contínua (pulse): 3000ms

---

## Seleção de Componentes

**Shadcn UI v4** como base, com customizações no tema Aurora Boreal:

- **Dashboard**: Cards com `card-glow` class, gradientes aurora em backgrounds
- **Navegação**: Sidebar com glassmorphism (`backdrop-filter: blur(12px)`)
- **Botões**: 
  - Primary: `.button-gradient` (aurora-1)
  - Secondary: Outline com border neon
  - Destructive: Vermelho neon com pulse
- **Inputs**: Border sutil com `:focus` glow verde-ciano
- **Modals/Dialogs**: `Dialog` com overlay escuro e blur
- **Cards de Processo**: Border left accent (4px) colorido por status
- **Badges**: Status com cores específicas (ativo=verde, urgente=vermelho, concluído=roxo)
- **Tabelas**: `Table` com hover row glow sutil
- **Gráficos**: Recharts com cores aurora (chart-1 a chart-5)

**Customizações Específicas:**
- Todos os botões primários recebem `neon-glow` em hover
- Cards têm `glassmorphic` class para transparência
- Sidebar tem gradient aurora sutil no topo
- Alertas urgentes pulsam com `neon-pulse`

**Ícones:** `@phosphor-icons/react` - peso `duotone` para ativos, `regular` para inativos

**Espaçamento:** Grid de 8px, usando classes Tailwind (`gap-4`, `p-6`, etc.)

**Mobile:** 
- Breakpoint: 768px
- Bottom navigation bar em mobile
- Cards empilhados verticalmente
- Sidebar colapsa em drawer

---

## Próximas Etapas de Implementação

**Sprint 1 (Crítico - 3 dias):**
- [x] Corrigir erros de compilação
- [ ] Implementar tema Aurora Boreal completo
- [ ] Implementar Harvey Specter (chat IA)
- [ ] Implementar Premonição Jurídica

**Sprint 2 (Alta Prioridade - 5 dias):**
- [ ] Upload e OCR de documentos
- [ ] Integração Google Docs para minutas
- [ ] Melhorar agentes autônomos (garantir 24/7)

**Sprint 3 (Médio Prazo - 1 semana):**
- [ ] Notificações push
- [ ] Relatórios exportáveis
- [ ] Sincronização Google Calendar
- [ ] Dashboard analytics avançado

---

**Versão:** 2.0  
**Última Atualização:** 16 de Novembro de 2025  
**Status:** ✅ Pronto para Implementação
