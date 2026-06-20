import json
from typing import Any, Optional
from datetime import date, datetime
import redis as redis_lib

TTL_FEEDERS   = 30
TTL_SCHEDULES = 300
TTL_TARIFFS   = 3600
TTL_LOCATIONS = 3600
TTL_SERVICES  = 600


class _Encoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, (date, datetime)):
            return obj.isoformat()
        return super().default(obj)


def cache_get(client: redis_lib.Redis, key: str) -> Optional[Any]:
    try:
        value = client.get(key)
        if value is None:
            return None
        return json.loads(value)
    except Exception:
        return None


def cache_set(client: redis_lib.Redis, key: str, value: Any, ttl: int = 60) -> None:
    try:
        client.setex(key, ttl, json.dumps(value, cls=_Encoder))
    except Exception as e:
        print(f"Cache set error: {e}")


def cache_delete(client: redis_lib.Redis, key: str) -> None:
    try:
        client.delete(key)
    except Exception:
        pass


def cache_delete_pattern(client: redis_lib.Redis, pattern: str) -> None:
    try:
        keys = client.keys(pattern)
        if keys:
            client.delete(*keys)
    except Exception:
        pass
