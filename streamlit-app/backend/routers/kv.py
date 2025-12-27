"""
Router KV Store - Redis/Upstash.

Compatível com endpoint /api/kv do backend Node.js.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Any, Optional
from database import RedisClient

router = APIRouter()

# Modelos
class KVGetRequest(BaseModel):
    action: str = "get"
    key: str

class KVSetRequest(BaseModel):
    action: str = "set"
    key: str
    value: Any
    ttl: Optional[int] = None

class KVDeleteRequest(BaseModel):
    action: str = "delete"
    key: str

# Endpoints
@router.post("/kv")
async def kv_operation(request: dict):
    """
    Endpoint genérico KV Store.

    Compatível com backend Node.js/Vercel original.
    """

    action = request.get("action")

    if not action:
        raise HTTPException(status_code=400, detail="Action is required")

    redis = RedisClient()

    # GET
    if action == "get":
        key = request.get("key")
        if not key:
            raise HTTPException(status_code=400, detail="Key is required")

        value = redis.get(key)
        return {"value": value}

    # SET
    elif action == "set":
        key = request.get("key")
        value = request.get("value")
        ttl = request.get("ttl")

        if not key:
            raise HTTPException(status_code=400, detail="Key is required")

        success = redis.set(key, value, ttl)
        return {"success": success}

    # DELETE
    elif action == "delete":
        key = request.get("key")
        if not key:
            raise HTTPException(status_code=400, detail="Key is required")

        success = redis.delete(key)
        return {"success": success}

    # LIST KEYS
    elif action == "keys":
        pattern = request.get("pattern", "*")
        keys = redis.keys(pattern)
        return {"keys": keys}

    # EXISTS
    elif action == "exists":
        key = request.get("key")
        if not key:
            raise HTTPException(status_code=400, detail="Key is required")

        exists = redis.exists(key)
        return {"exists": exists}

    else:
        raise HTTPException(status_code=400, detail=f"Unknown action: {action}")

@router.get("/kv/{key}")
async def kv_get(key: str):
    """Get value by key."""
    redis = RedisClient()
    value = redis.get(key)

    if value is None:
        raise HTTPException(status_code=404, detail="Key not found")

    return {"key": key, "value": value}

@router.put("/kv/{key}")
async def kv_put(key: str, data: dict):
    """Set value by key."""
    redis = RedisClient()
    value = data.get("value")
    ttl = data.get("ttl")

    success = redis.set(key, value, ttl)

    return {"success": success, "key": key}

@router.delete("/kv/{key}")
async def kv_delete(key: str):
    """Delete key."""
    redis = RedisClient()
    success = redis.delete(key)

    return {"success": success, "key": key}
