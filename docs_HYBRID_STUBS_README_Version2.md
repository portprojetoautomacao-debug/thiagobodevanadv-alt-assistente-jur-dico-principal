```markdown
# Hybrid stubs (feat/hybrid-stubs)

This branch contains safe, minimal stubs to start the Hybrid architecture:
- LangGraph base agent + AgentState
- MonitorDJEN example agent
- Qdrant service wrapper
- DSPy FastAPI bridge (secure patterns)
- Autogen orchestrator stub
- .env.example and CI skeleton

How to use:
1. Create branch `feat/hybrid-stubs`
2. Add these files to the repository
3. Run Qdrant locally for integration tests:
   docker run -p 6333:6333 qdrant/qdrant
4. Start DSPy bridge (set DSPY_API_TOKEN in env):
   python scripts/dspy_bridge.py

Next steps:
- Implement DJEN client in MonitorDJENAgent.detectNewPublications
- Add embedder (OpenAI) and wire to Pesquisa agent
- Harden sandbox for AutoGen code execution before enabling code-exec features
```