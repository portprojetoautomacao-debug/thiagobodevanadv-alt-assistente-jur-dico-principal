# 🤖 Configurando Agentes no LangGraph

## Visão Geral

Você tem **16 agentes especializados** que podem ser integrados ao LangGraph de diferentes formas:

```
16 Agentes Existentes:
├── harvey.py              - Estrategista-chefe
├── justine.py             - Análise de intimações
├── monitor_djen.py        - Monitoramento DJEN
├── analise_doc.py         - Análise documental
├── prazos.py              - Gestão de prazos
├── redacao.py             - Redação de petições
├── pesquisa.py            - Pesquisa jurisprudencial
├── analise_risco.py       - Análise de risco
├── estrategia.py          - Estratégia processual
├── organizacao.py         - Organização de arquivos
├── revisao_contratual.py  - Revisão contratual
├── comunicacao.py         - Comunicação com clientes
├── financeiro.py          - Análise financeira
├── traducao.py            - Tradução jurídica
├── compliance.py          - Compliance LGPD
└── analise_sentenca.py    - Análise de sentença
```

## 🎯 3 Formas de Configurar

### Opção 1: Tools (Recomendado) ⭐

Transformar agentes em tools que o LLM chama dinamicamente.

**Arquivo**: `streamlit-app/lib/langgraph_agents_tools.py`

### Opção 2: Nós Especializados

Cada agente é um nó com fluxo fixo.

### Opção 3: Híbrido

Combinar tools + nós especializados.

## 🚀 Quer que eu implemente?

Posso criar a integração completa dos 16 agentes no LangGraph.

**O que será criado:**

1. ✅ `langgraph_agents_tools.py` - Todos agentes como tools
2. ✅ Atualização de `langgraph.json`
3. ✅ Exemplos de uso
4. ✅ Testes de integração

**Responda qual abordagem prefere:**
- A) Tools (flexível)
- B) Nós (controlado)
- C) Híbrido (recomendado)
