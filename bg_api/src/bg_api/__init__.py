from .main import app
from .openroute_client import OpenRouteClient

def hello() -> str:
    return "Hello from bg-api!"

__all__ = ["app", "OpenRouteClient", "hello"]
