#!/usr/bin/env python3
"""
Exemplos práticos de uso do Agent Server
para o assistente jurídico com configurações de escala.
"""

import asyncio
import os
from datetime import datetime
from langgraph_sdk import get_client


# ============================================================================
# CONFIGURAÇÃO
# ============================================================================

DEPLOYMENT_URL = os.getenv("DEPLOYMENT_URL", "http://localhost:2024")
API_KEY = os.getenv("LANGSMITH_API_KEY", "")
ASSISTANT_ID = "legal_assistant"


# ============================================================================
# EXEMPLO 1: Conversação Simples com Memória
# ============================================================================

async def example_simple_conversation():
    """Exemplo de conversação simples com memória persistente"""
    print("\n" + "="*60)
    print("📝 EXEMPLO 1: Conversação Simples com Memória")
    print("="*60 + "\n")

    client = get_client(url=DEPLOYMENT_URL, api_key=API_KEY)

    # Criar thread (uma vez)
    thread = await client.threads.create()
    thread_id = thread["thread_id"]
    print(f"✅ Thread criado: {thread_id}\n")

    # Múltiplas mensagens no mesmo thread
    messages = [
        "Olá! Meu nome é João e preciso de ajuda com um processo.",
        "É um processo trabalhista de rescisão indireta.",
        "Qual prazo tenho para entrar com recurso?"
    ]

    for user_msg in messages:
        print(f"👤 Você: {user_msg}")

        # Executar run com streaming
        async for chunk in client.runs.stream(
            thread_id,
            ASSISTANT_ID,
            input={"messages": [{"role": "user", "content": user_msg}]},
            stream_mode="updates"
        ):
            if chunk.event == "updates" and chunk.data:
                # Extrair resposta do assistente
                for node_name, node_data in chunk.data.items():
                    if "messages" in node_data and node_data["messages"]:
                        last_msg = node_data["messages"][-1]
                        if last_msg.get("type") == "ai":
                            print(f"🤖 Assistente: {last_msg.get('content', '')}\n")

    print("💡 Nota: Todo o contexto foi mantido no mesmo thread!\n")


# ============================================================================
# EXEMPLO 2: Processamento em Batch (Alta Performance)
# ============================================================================

async def example_batch_processing():
    """Exemplo de processamento em lote para alta performance"""
    print("\n" + "="*60)
    print("⚡ EXEMPLO 2: Processamento em Batch")
    print("="*60 + "\n")

    client = get_client(url=DEPLOYMENT_URL, api_key=API_KEY)

    # Documentos para processar
    documents = [
        {"title": "Contrato de Prestação de Serviços", "content": "..."},
        {"title": "Petição Inicial", "content": "..."},
        {"title": "Contestação", "content": "..."},
    ]

    print(f"📄 Processando {len(documents)} documentos em paralelo...\n")

    async def process_document(doc):
        """Processa um documento individual"""
        thread = await client.threads.create()

        result = await client.runs.wait(
            thread["thread_id"],
            ASSISTANT_ID,
            input={
                "messages": [{
                    "role": "user",
                    "content": f"Analise este documento: {doc['title']}"
                }]
            },
            # Otimização: só salvar checkpoint final
            durability="exit"
        )

        return {
            "document": doc["title"],
            "analysis": result["messages"][-1]["content"]
        }

    # Processar todos em paralelo
    start_time = datetime.now()
    results = await asyncio.gather(*[
        process_document(doc) for doc in documents
    ])
    elapsed = (datetime.now() - start_time).total_seconds()

    print(f"✅ Processados {len(results)} documentos em {elapsed:.2f}s\n")

    for result in results:
        print(f"📄 {result['document']}")
        print(f"   Análise: {result['analysis'][:100]}...\n")


# ============================================================================
# EXEMPLO 3: Background Job com Cron
# ============================================================================

async def example_cron_job():
    """Exemplo de job agendado (cron)"""
    print("\n" + "="*60)
    print("⏰ EXEMPLO 3: Background Job com Cron")
    print("="*60 + "\n")

    client = get_client(url=DEPLOYMENT_URL, api_key=API_KEY)

    # Criar cron job para execução diária às 9h
    print("📅 Criando job agendado para relatório diário...\n")

    cron_job = await client.crons.create(
        ASSISTANT_ID,
        schedule="0 9 * * *",  # 9h todos os dias
        input={
            "messages": [{
                "role": "user",
                "content": "Gerar relatório diário de processos vencendo hoje"
            }]
        },
        metadata={"job_type": "daily_report"}
    )

    print(f"✅ Cron job criado: {cron_job['cron_id']}")
    print(f"   Schedule: {cron_job['schedule']}")
    print(f"   Próxima execução: às 9h\n")

    # IMPORTANTE: Deletar quando não precisar mais!
    print("⚠️  Lembre-se de deletar o cron quando não precisar mais:")
    print(f"   await client.crons.delete('{cron_job['cron_id']}')\n")

    # Deletar para exemplo
    await client.crons.delete(cron_job["cron_id"])
    print("🗑️  Cron deletado (para este exemplo)\n")


# ============================================================================
# EXEMPLO 4: Streaming de Tokens LLM
# ============================================================================

async def example_streaming_tokens():
    """Exemplo de streaming de tokens do LLM"""
    print("\n" + "="*60)
    print("🌊 EXEMPLO 4: Streaming de Tokens LLM")
    print("="*60 + "\n")

    client = get_client(url=DEPLOYMENT_URL, api_key=API_KEY)

    thread = await client.threads.create()

    print("📝 Gerando petição inicial... (streaming)\n")
    print("🤖 Assistente: ", end="", flush=True)

    async for chunk in client.runs.stream(
        thread["thread_id"],
        ASSISTANT_ID,
        input={
            "messages": [{
                "role": "user",
                "content": "Redija uma petição inicial de ação de alimentos"
            }]
        },
        stream_mode="messages-tuple"
    ):
        if chunk.event == "messages":
            message_chunk, metadata = chunk.data
            if message_chunk.get("content"):
                print(message_chunk["content"], end="", flush=True)

    print("\n\n✅ Streaming concluído!\n")


# ============================================================================
# EXEMPLO 5: Recuperação de Estado e Time Travel
# ============================================================================

async def example_time_travel():
    """Exemplo de recuperação de estado e time travel"""
    print("\n" + "="*60)
    print("⏮️  EXEMPLO 5: Time Travel")
    print("="*60 + "\n")

    client = get_client(url=DEPLOYMENT_URL, api_key=API_KEY)

    # Criar thread e executar algumas ações
    thread = await client.threads.create()
    thread_id = thread["thread_id"]

    print("1️⃣ Executando primeira ação...\n")
    await client.runs.wait(
        thread_id,
        ASSISTANT_ID,
        input={"messages": [{"role": "user", "content": "Calcular prazo de 15 dias úteis"}]}
    )

    print("2️⃣ Executando segunda ação...\n")
    await client.runs.wait(
        thread_id,
        ASSISTANT_ID,
        input={"messages": [{"role": "user", "content": "Adicionar mais 10 dias"}]}
    )

    # Ver histórico
    print("📜 Consultando histórico...\n")
    history = await client.threads.get_history(thread_id, limit=5)

    for i, checkpoint in enumerate(history):
        step = checkpoint["metadata"].get("step", "?")
        print(f"   Checkpoint {i+1}: Step {step} - ID: {checkpoint['checkpoint_id'][:8]}...")

    # Voltar para checkpoint anterior
    if len(history) > 1:
        previous_checkpoint = history[1]
        print(f"\n⏮️  Voltando para checkpoint: {previous_checkpoint['checkpoint_id'][:8]}...\n")

        # Atualizar estado naquele ponto
        new_config = await client.threads.update_state(
            thread_id,
            {"messages": [{"role": "user", "content": "Ops, quero recalcular!"}]},
            checkpoint_id=previous_checkpoint["checkpoint_id"]
        )

        print(f"✅ Estado atualizado! Novo checkpoint: {new_config['checkpoint_id'][:8]}...\n")


# ============================================================================
# EXEMPLO 6: Monitoramento de Métricas
# ============================================================================

async def example_metrics_monitoring():
    """Exemplo de coleta de métricas"""
    print("\n" + "="*60)
    print("📊 EXEMPLO 6: Monitoramento de Métricas")
    print("="*60 + "\n")

    client = get_client(url=DEPLOYMENT_URL, api_key=API_KEY)

    # Buscar runs recentes
    print("📈 Coletando métricas dos últimos runs...\n")

    runs = await client.runs.list(limit=100)

    if not runs:
        print("⚠️  Nenhum run encontrado. Execute alguns exemplos primeiro!\n")
        return

    # Calcular métricas
    total = len(runs)
    successful = len([r for r in runs if r.get("status") == "success"])
    failed = len([r for r in runs if r.get("status") == "error"])

    success_rate = (successful / total * 100) if total > 0 else 0

    print(f"📊 Métricas ({total} runs):")
    print(f"   ✅ Sucessos: {successful}")
    print(f"   ❌ Falhas: {failed}")
    print(f"   📈 Taxa de sucesso: {success_rate:.1f}%\n")

    # Buscar threads
    threads = await client.threads.search(limit=100)
    idle = len([t for t in threads if t.get("status") == "idle"])
    busy = len([t for t in threads if t.get("status") == "busy"])

    print(f"🧵 Threads ({len(threads)} total):")
    print(f"   💤 Idle: {idle}")
    print(f"   ⚡ Busy: {busy}\n")


# ============================================================================
# EXEMPLO 7: Assistants Customizados
# ============================================================================

async def example_custom_assistant():
    """Exemplo de criação de assistant customizado"""
    print("\n" + "="*60)
    print("🎨 EXEMPLO 7: Assistants Customizados")
    print("="*60 + "\n")

    client = get_client(url=DEPLOYMENT_URL, api_key=API_KEY)

    # Criar assistant especializado
    print("🎨 Criando assistant personalizado...\n")

    custom_assistant = await client.assistants.create(
        ASSISTANT_ID,
        name="Assistente Trabalhista",
        context={
            "temperature": 0.3,  # Mais conservador
            "specialization": "trabalhista"
        },
        metadata={
            "created_by": "example_script",
            "purpose": "Especialização em direito trabalhista"
        }
    )

    print(f"✅ Assistant criado: {custom_assistant['assistant_id']}")
    print(f"   Nome: {custom_assistant['name']}")
    print(f"   Context: {custom_assistant['context']}\n")

    # Usar o assistant customizado
    thread = await client.threads.create()

    print("💬 Usando assistant customizado...\n")

    result = await client.runs.wait(
        thread["thread_id"],
        custom_assistant["assistant_id"],
        input={
            "messages": [{
                "role": "user",
                "content": "Explique rescisão indireta"
            }]
        }
    )

    print(f"🤖 Resposta: {result['messages'][-1]['content'][:200]}...\n")

    # Listar todas as versões
    print("📋 Versões do assistant:\n")
    versions = await client.assistants.list(
        graph_id=ASSISTANT_ID,
        limit=5
    )

    for version in versions:
        print(f"   • Versão: {version['version']} - {version['name']}")

    print()


# ============================================================================
# MAIN
# ============================================================================

async def main():
    """Executa todos os exemplos"""
    print("\n" + "="*60)
    print("🚀 EXEMPLOS PRÁTICOS - AGENT SERVER")
    print("   Assistente Jurídico com Escala")
    print("="*60)

    if not API_KEY and "localhost" not in DEPLOYMENT_URL:
        print("\n❌ Configure LANGSMITH_API_KEY para rodar exemplos remotos!\n")
        return

    print(f"\n📍 Deployment URL: {DEPLOYMENT_URL}")
    print(f"🤖 Assistant ID: {ASSISTANT_ID}\n")

    # Menu de exemplos
    examples = {
        "1": ("Conversação Simples", example_simple_conversation),
        "2": ("Processamento em Batch", example_batch_processing),
        "3": ("Background Job (Cron)", example_cron_job),
        "4": ("Streaming de Tokens", example_streaming_tokens),
        "5": ("Time Travel", example_time_travel),
        "6": ("Monitoramento", example_metrics_monitoring),
        "7": ("Assistants Customizados", example_custom_assistant),
        "8": ("Executar Todos", None),
    }

    print("Escolha um exemplo para executar:\n")
    for key, (name, _) in examples.items():
        print(f"   {key}. {name}")

    choice = input("\nEscolha (1-8): ").strip()

    if choice == "8":
        # Executar todos
        for key, (name, func) in examples.items():
            if func:
                try:
                    await func()
                    await asyncio.sleep(2)  # Pausa entre exemplos
                except Exception as e:
                    print(f"\n❌ Erro no exemplo {name}: {e}\n")
    elif choice in examples and examples[choice][1]:
        # Executar exemplo específico
        try:
            await examples[choice][1]()
        except Exception as e:
            print(f"\n❌ Erro: {e}\n")
    else:
        print("\n❌ Opção inválida!\n")

    print("\n" + "="*60)
    print("✨ Exemplos concluídos!")
    print("="*60 + "\n")

    print("💡 Dicas:")
    print("   • Use o script de monitoramento: python scripts/monitor_metrics.py")
    print("   • Calcule capacidade necessária: python scripts/calculate_capacity.py")
    print("   • Consulte o guia de escala: AGENT_SERVER_SCALE_CONFIG.md")
    print()


if __name__ == "__main__":
    asyncio.run(main())
