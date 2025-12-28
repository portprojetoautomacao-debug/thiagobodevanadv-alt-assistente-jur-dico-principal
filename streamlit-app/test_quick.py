"""Teste rápido do sistema"""
import asyncio
from lib.agents import AGENTS_MAP

async def test_all_agents():
    print("\n🧪 TESTE RÁPIDO - 16 AGENTES\n")
    
    for i, (agent_id, AgentClass) in enumerate(AGENTS_MAP.items(), 1):
        try:
            agent = AgentClass()
            result = await agent.execute(f"Teste {agent.name}")
            status = "✅" if result["status"] == "completed" else "❌"
            print(f"{status} {i:2}. {agent.name:30} → {result['status']}")
        except Exception as e:
            print(f"❌ {i:2}. {agent_id:30} → ERRO: {str(e)[:50]}")
    
    print("\n🎉 Teste concluído!")

if __name__ == "__main__":
    asyncio.run(test_all_agents())
