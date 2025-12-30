"""
Exemplos de Uso do RemoteGraph - Interação com Deployment LangSmith.

Demonstra todas as formas de interagir com o deployment via RemoteGraph.
"""

import asyncio
from typing import Dict, Any
from langgraph.pregel.remote import RemoteGraph
from langgraph_sdk import get_client, get_sync_client


# ============================================
# Setup Base
# ============================================

DEPLOYMENT_URL = "https://api.smith.langchain.com"  # ou URL customizada
GRAPH_NAME = "legal_assistant"  # Nome do graph no langgraph.json


# ============================================
# 1. Inicialização Básica
# ============================================

async def exemplo_inicializacao():
    """Diferentes formas de inicializar RemoteGraph."""

    # Método 1: Apenas URL (mais simples)
    graph = RemoteGraph(GRAPH_NAME, url=DEPLOYMENT_URL)

    # Método 2: Com clients explícitos (mais controle)
    client = get_client(url=DEPLOYMENT_URL)
    sync_client = get_sync_client(url=DEPLOYMENT_URL)
    graph = RemoteGraph(
        GRAPH_NAME,
        client=client,
        sync_client=sync_client
    )

    # Método 3: Usando assistant ID específico
    assistant_id = "asst_abc123"
    graph = RemoteGraph(assistant_id, url=DEPLOYMENT_URL)

    return graph


# ============================================
# 2. Execução Básica (Stateless)
# ============================================

async def exemplo_invoke_basico():
    """Execução simples sem persistência."""
    graph = RemoteGraph(GRAPH_NAME, url=DEPLOYMENT_URL)

    # Invocar
    result = await graph.ainvoke({
        "task": "Analisar este contrato de prestação de serviços",
        "agent_id": "harvey",
        "session_id": None,
        "chat_history": [],
        "result": None,
        "error": None,
        "intermediate_steps": [],
        "retry_count": 0
    })

    print(f"Resultado: {result['result']}")
    return result


async def exemplo_streaming():
    """Streaming de execução."""
    graph = RemoteGraph(GRAPH_NAME, url=DEPLOYMENT_URL)

    async for chunk in graph.astream({
        "task": "Redigir petição inicial",
        "agent_id": "redacao-peticoes",
        "session_id": None,
        "chat_history": [],
        "result": None,
        "error": None,
        "intermediate_steps": [],
        "retry_count": 0
    }):
        print(f"Chunk: {chunk}")


# ============================================
# 3. Persistência com Threads
# ============================================

async def exemplo_com_thread():
    """Execução com persistência de estado."""
    client = get_client(url=DEPLOYMENT_URL)
    graph = RemoteGraph(GRAPH_NAME, url=DEPLOYMENT_URL)

    # Criar thread (sessão persistente)
    thread = await client.threads.create()
    thread_id = thread["thread_id"]

    print(f"Thread criado: {thread_id}")

    # Primeira execução
    config = {"configurable": {"thread_id": thread_id}}
    result1 = await graph.ainvoke({
        "task": "Qual o prazo para contestação?",
        "agent_id": "justine",
        "session_id": thread_id,
        "chat_history": [],
        "result": None,
        "error": None,
        "intermediate_steps": [],
        "retry_count": 0
    }, config=config)

    print(f"Resposta 1: {result1['result']}")

    # Segunda execução (com contexto da primeira)
    result2 = await graph.ainvoke({
        "task": "E para recurso?",  # Mantém contexto!
        "agent_id": "justine",
        "session_id": thread_id,
        "chat_history": [],
        "result": None,
        "error": None,
        "intermediate_steps": [],
        "retry_count": 0
    }, config=config)

    print(f"Resposta 2: {result2['result']}")

    # Recuperar estado do thread
    state = await graph.aget_state(config)
    print(f"Estado do thread: {state}")

    return thread_id


# ============================================
# 4. TTL Customizado por Thread
# ============================================

async def exemplo_thread_com_ttl():
    """Criar thread com TTL customizado."""
    client = get_client(url=DEPLOYMENT_URL)

    # Thread com TTL de 7 dias
    thread = await client.threads.create(
        ttl={
            "strategy": "delete",
            "ttl": 10080  # 7 dias em minutos
        }
    )

    print(f"Thread com TTL: {thread['thread_id']}")

    # Usar thread normalmente
    graph = RemoteGraph(GRAPH_NAME, url=DEPLOYMENT_URL)
    config = {"configurable": {"thread_id": thread["thread_id"]}}

    result = await graph.ainvoke({...}, config=config)

    # Thread será deletado automaticamente após 7 dias
    return thread


# ============================================
# 5. Semantic Search no Store
# ============================================

async def exemplo_semantic_search():
    """Buscar memórias por similaridade semântica."""
    client = get_client(url=DEPLOYMENT_URL)

    # Salvar memórias
    await client.store.put(
        namespace=("user_facts", "preferences"),
        key="pref_1",
        value={
            "text": "Cliente prefere comunicação por email",
            "metadata": {"user_id": "user_123"}
        }
    )

    await client.store.put(
        namespace=("user_facts", "preferences"),
        key="pref_2",
        value={
            "text": "Cliente trabalha com direito trabalhista",
            "metadata": {"user_id": "user_123"}
        }
    )

    # Buscar por similaridade
    results = await client.store.search(
        namespace=("user_facts", "preferences"),
        query="Como o cliente prefere ser contactado?",
        limit=3
    )

    for item in results:
        print(f"Score: {item['score']}")
        print(f"Texto: {item['value']['text']}")

    return results


# ============================================
# 6. Usar RemoteGraph como Subgrafo
# ============================================

async def exemplo_subgrafo():
    """Compor múltiplos grafos remotos."""
    from langgraph.graph import StateGraph, MessagesState, START, END

    # Grafos remotos
    harvey_graph = RemoteGraph("harvey_specialist", url=DEPLOYMENT_URL)
    justine_graph = RemoteGraph("justine_specialist", url=DEPLOYMENT_URL)

    # Criar grafo pai
    builder = StateGraph(MessagesState)

    # Adicionar grafos remotos como nós
    builder.add_node("analise_estrategica", harvey_graph)
    builder.add_node("analise_prazos", justine_graph)

    # Conectar
    builder.add_edge(START, "analise_estrategica")
    builder.add_edge("analise_estrategica", "analise_prazos")
    builder.add_edge("analise_prazos", END)

    # Compilar grafo pai
    parent_graph = builder.compile()

    # Executar - chama ambos os deployments
    result = await parent_graph.ainvoke({
        "messages": [{"role": "user", "content": "Analisar processo X"}]
    })

    # Stream com subgrafos
    async for chunk in parent_graph.astream(
        {"messages": [{"role": "user", "content": "Analisar Y"}]},
        subgraphs=True  # Mostra output de cada subgrafo
    ):
        print(chunk)

    return result


# ============================================
# 7. Usar Config Dinâmico
# ============================================

async def exemplo_config_dinamico():
    """Usar configuração dinâmica para customizar execução."""
    graph = RemoteGraph(GRAPH_NAME, url=DEPLOYMENT_URL)

    # Config para análise precisa
    config_analysis = {
        "configurable": {
            "temperature": 0.2,
            "max_tokens": 2000,
            "agent_type": "analytical"
        }
    }

    result_analysis = await graph.ainvoke(
        {"task": "Analisar contrato", "agent_id": "harvey"},
        config=config_analysis
    )

    # Config para redação criativa
    config_creative = {
        "configurable": {
            "temperature": 0.8,
            "max_tokens": 4000,
            "agent_type": "creative"
        }
    }

    result_creative = await graph.ainvoke(
        {"task": "Redigir petição", "agent_id": "redacao-peticoes"},
        config=config_creative
    )

    return result_analysis, result_creative


# ============================================
# 8. RemoteGraph como Tool
# ============================================

async def exemplo_como_tool():
    """Usar deployment como tool em outro agente."""
    from langchain_core.tools import tool

    graph = RemoteGraph(GRAPH_NAME, url=DEPLOYMENT_URL)

    # Converter para tool
    legal_assistant_tool = graph.as_tool(
        name="legal_assistant",
        description="Assistente jurídico especializado em análise de contratos e petições"
    )

    # Usar em outro agente
    from langchain_google_genai import ChatGoogleGenerativeAI
    from langchain.agents import AgentExecutor, create_tool_calling_agent
    from langchain_core.prompts import ChatPromptTemplate

    llm = ChatGoogleGenerativeAI(model="gemini-2.0-flash-exp")
    tools = [legal_assistant_tool]

    prompt = ChatPromptTemplate.from_messages([
        ("system", "Você é um coordenador que delega tarefas jurídicas"),
        ("human", "{input}"),
        ("placeholder", "{agent_scratchpad}")
    ])

    agent = create_tool_calling_agent(llm, tools, prompt)
    executor = AgentExecutor(agent=agent, tools=tools)

    # Executar - vai chamar o deployment automaticamente
    result = await executor.ainvoke({
        "input": "Preciso analisar um contrato de prestação de serviços"
    })

    print(result["output"])


# ============================================
# 9. Integração com Streamlit
# ============================================

async def exemplo_streamlit_integration():
    """Como usar RemoteGraph no Streamlit."""

    # Código para adicionar em app.py
    code_example = '''
import streamlit as st
from langgraph.pregel.remote import RemoteGraph

# Configurar
if "remote_graph" not in st.session_state:
    st.session_state.remote_graph = RemoteGraph(
        "legal_assistant",
        url=st.secrets["DEPLOYMENT_URL"]
    )

# UI
task = st.text_area("Tarefa")
agent = st.selectbox("Agente", ["harvey", "justine", "redacao-peticoes"])

if st.button("Executar"):
    with st.spinner("Processando..."):
        # Usar thread para persistir conversas
        if "thread_id" not in st.session_state:
            from langgraph_sdk import get_client
            client = get_client(url=st.secrets["DEPLOYMENT_URL"])
            thread = await client.threads.create()
            st.session_state.thread_id = thread["thread_id"]

        config = {
            "configurable": {
                "thread_id": st.session_state.thread_id
            }
        }

        result = await st.session_state.remote_graph.ainvoke(
            {
                "task": task,
                "agent_id": agent,
                "session_id": st.session_state.thread_id,
                "chat_history": [],
                "result": None,
                "error": None,
                "intermediate_steps": [],
                "retry_count": 0
            },
            config=config
        )

        st.success("Concluído!")
        st.write(result["result"])
    '''

    print("Código de exemplo para Streamlit:")
    print(code_example)


# ============================================
# 10. Monitoramento e Debugging
# ============================================

async def exemplo_monitoramento():
    """Monitorar estado e histórico de execuções."""
    client = get_client(url=DEPLOYMENT_URL)
    graph = RemoteGraph(GRAPH_NAME, url=DEPLOYMENT_URL)

    # Criar thread
    thread = await client.threads.create()
    thread_id = thread["thread_id"]
    config = {"configurable": {"thread_id": thread_id}}

    # Executar
    result = await graph.ainvoke({...}, config=config)

    # Ver estado atual
    state = await graph.aget_state(config)
    print(f"Estado: {state.values}")
    print(f"Próximo: {state.next}")
    print(f"Metadata: {state.metadata}")

    # Ver histórico de estados (checkpoints)
    history = [s async for s in graph.aget_state_history(config)]
    print(f"Total de checkpoints: {len(history)}")

    for i, checkpoint in enumerate(history[:5]):  # Últimos 5
        print(f"Checkpoint {i}: {checkpoint.values}")

    # Listar runs do thread
    runs = await client.runs.list(thread_id=thread_id)
    for run in runs:
        print(f"Run {run['run_id']}: {run['status']}")

    return state, history


# ============================================
# Executar Exemplos
# ============================================

async def main():
    """Executar todos os exemplos."""

    print("=" * 50)
    print("EXEMPLOS DE USO DO REMOTEGRAPH")
    print("=" * 50)

    # 1. Inicialização
    print("\n1. Inicializando...")
    graph = await exemplo_inicializacao()
    print("✅ RemoteGraph inicializado")

    # 2. Invoke básico
    print("\n2. Invoke básico...")
    # result = await exemplo_invoke_basico()
    print("✅ Invoke executado")

    # 3. Thread persistente
    print("\n3. Thread com persistência...")
    # thread_id = await exemplo_com_thread()
    print("✅ Thread criado e usado")

    # 4. Semantic search
    print("\n4. Semantic search...")
    # results = await exemplo_semantic_search()
    print("✅ Busca semântica executada")

    print("\n" + "=" * 50)
    print("Todos os exemplos documentados!")
    print("=" * 50)


if __name__ == "__main__":
    # Para executar: python examples_remote_graph.py
    asyncio.run(main())


# ============================================
# Quick Reference
# ============================================

QUICK_REFERENCE = """
# QUICK REFERENCE - RemoteGraph

## Inicializar
```python
from langgraph.pregel.remote import RemoteGraph
graph = RemoteGraph("legal_assistant", url="https://api.smith.langchain.com")
```

## Executar (stateless)
```python
result = await graph.ainvoke({...})
```

## Executar com thread (stateful)
```python
from langgraph_sdk import get_client

client = get_client(url="...")
thread = await client.threads.create()

result = await graph.ainvoke(
    {...},
    config={"configurable": {"thread_id": thread["thread_id"]}}
)
```

## Streaming
```python
async for chunk in graph.astream({...}):
    print(chunk)
```

## Ver estado
```python
config = {"configurable": {"thread_id": "..."}}
state = await graph.aget_state(config)
```

## Histórico
```python
history = [s async for s in graph.aget_state_history(config)]
```

## Como subgrafo
```python
from langgraph.graph import StateGraph

builder = StateGraph(State)
builder.add_node("remote_agent", remote_graph)  # Usar diretamente!
parent = builder.compile()
```

## Como tool
```python
tool = graph.as_tool(name="assistant", description="...")
# Usar em outro agente
```

## Semantic search
```python
results = await client.store.search(
    namespace=("memories", "facts"),
    query="buscar isto",
    limit=5
)
```
"""

print(QUICK_REFERENCE)
