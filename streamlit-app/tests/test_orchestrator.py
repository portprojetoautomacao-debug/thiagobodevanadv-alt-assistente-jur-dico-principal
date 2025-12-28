"""
Test for LegalAgentOrchestrator - Verifies memory_manager import fix
"""

import sys
from pathlib import Path

import pytest

# Add lib to path as backend does
sys.path.append(str(Path(__file__).parent.parent / "lib"))


class TestLegalAgentOrchestrator:
    """Tests for LegalAgentOrchestrator"""

    def test_import_langchain_agents(self):
        """Test that langchain_agents can be imported without ModuleNotFoundError"""
        try:
            from langchain_agents import LegalAgentOrchestrator

            assert LegalAgentOrchestrator is not None
        except ModuleNotFoundError as e:
            if "memory_manager" in str(e):
                pytest.fail(f"memory_manager import failed: {e}")
            raise

    def test_orchestrator_initialization(self):
        """Test that LegalAgentOrchestrator can be instantiated"""
        from langchain_agents import LegalAgentOrchestrator

        orchestrator = LegalAgentOrchestrator()
        
        assert orchestrator is not None
        assert hasattr(orchestrator, "agents_list")
        assert len(orchestrator.agents_list) == 16
        assert hasattr(orchestrator, "memory_manager")

    def test_memory_manager_exists(self):
        """Test that MemoryManager is properly initialized"""
        from langchain_agents import LegalAgentOrchestrator

        orchestrator = LegalAgentOrchestrator()
        memory_mgr = orchestrator.memory_manager

        assert memory_mgr is not None
        assert hasattr(memory_mgr, "get_session_history")
        assert hasattr(memory_mgr, "use_redis")

    def test_session_history_creation(self):
        """Test that session history can be created"""
        from langchain_agents import LegalAgentOrchestrator

        orchestrator = LegalAgentOrchestrator()
        history = orchestrator.memory_manager.get_session_history("test-session-001")

        assert history is not None
        # Should be InMemoryChatMessageHistory if Redis not configured
        assert hasattr(history, "messages")

    def test_list_agents(self):
        """Test that all agents are listed"""
        from langchain_agents import LegalAgentOrchestrator

        orchestrator = LegalAgentOrchestrator()
        agents = orchestrator.list_agents()

        assert len(agents) == 16
        assert "harvey" in agents
        assert "justine" in agents
        assert "redacao-peticoes" in agents
        assert "analise-documental" in agents

    @pytest.mark.asyncio
    async def test_execute_agent_not_found(self):
        """Test executing non-existent agent"""
        from langchain_agents import LegalAgentOrchestrator

        orchestrator = LegalAgentOrchestrator()
        result = await orchestrator.execute_agent("non-existent-agent", "test task")

        assert result is not None
        assert result["success"] is False
        assert "não encontrado" in result["error"].lower()

    @pytest.mark.asyncio
    async def test_execute_agent_mock(self):
        """Test executing agent with mock fallback"""
        from langchain_agents import LegalAgentOrchestrator

        orchestrator = LegalAgentOrchestrator()
        
        # Use an agent that likely doesn't have real implementation yet
        result = await orchestrator.execute_agent(
            "redacao-peticoes", 
            "Criar petição inicial"
        )

        assert result is not None
        assert "agent" in result
        assert result["agent"] == "redacao-peticoes"
