from fastapi import FastAPI, HTTPException, Header
from pydantic import BaseModel
import os
import uvicorn
from typing import List, Dict

API_TOKEN = os.getenv("DSPY_API_TOKEN", "changeme")
app = FastAPI(title="DSPy Bridge - safe stub", docs_url="/docs")

class OptimizeRequest(BaseModel):
    task_name: str
    current_prompt: str
    examples: List[Dict]
    metric: str  # metric name from registry

# Pre-registered safe metrics - DO NOT use eval in production
def similarity_to_operator_version(a: str, b: str) -> float:
    # placeholder metric implementation
    return 1.0

SAFE_METRICS = {
    "similarity_to_operator_version": similarity_to_operator_version
}

@app.post("/optimize-prompt")
async def optimize_prompt(req: OptimizeRequest, authorization: str = Header(None)):
    if authorization is None or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")
    token = authorization.split(" ", 1)[1]
    if token != API_TOKEN:
        raise HTTPException(status_code=403, detail="Forbidden")

    if req.metric not in SAFE_METRICS:
        raise HTTPException(status_code=400, detail="Unknown metric")

    # TODO: enqueue heavy optimization task to a worker (Celery/RQ). This is a synchronous stub.
    optimized_prompt = req.current_prompt + "\n\n# Optimized (stub)"
    return {"optimized_prompt": optimized_prompt, "improvement": "stub-0%"}

if __name__ == "__main__":
    uvicorn.run("scripts.dspy_bridge:app", host="0.0.0.0", port=8000, log_level="info")