"""
AI Client for communicating with Ollama API.
"""
import json
import requests
from typing import Generator


class AIClient:
    def __init__(self, host: str = "http://localhost:11434", model: str = "codellama",
                 temperature: float = 0.2, max_tokens: int = 4096):
        self.host = host.rstrip("/")
        self.model = model
        self.temperature = temperature
        self.max_tokens = max_tokens

    def chat(self, messages: list[dict], stream: bool = True) -> Generator[str, None, None]:
        """
        Send a chat request to Ollama.
        messages: list of {"role": "user"|"assistant"|"system", "content": "..."}
        Yields content chunks as they arrive.
        """
        payload = {
            "model": self.model,
            "messages": messages,
            "stream": stream,
            "options": {
                "temperature": self.temperature,
                "num_predict": self.max_tokens,
            }
        }

        response = requests.post(
            f"{self.host}/api/chat",
            json=payload,
            stream=stream,
            timeout=120
        )

        if response.status_code != 200:
            yield f"\n[ERROR] Ollama returned status {response.status_code}: {response.text}"
            return

        if stream:
            for line in response.iter_lines():
                if line:
                    try:
                        chunk = json.loads(line.decode("utf-8"))
                        if "message" in chunk and "content" in chunk["message"]:
                            yield chunk["message"]["content"]
                        if chunk.get("done", False):
                            break
                    except json.JSONDecodeError:
                        continue
        else:
            data = response.json()
            if "message" in data and "content" in data["message"]:
                yield data["message"]["content"]

    def list_models(self) -> list[str]:
        """List available models."""
        try:
            resp = requests.get(f"{self.host}/api/tags", timeout=5)
            if resp.status_code == 200:
                return [m["name"] for m in resp.json().get("models", [])]
        except Exception as e:
            return [f"Error: {e}"]
        return []

    def pull_model(self, model_name: str) -> Generator[str, None, None]:
        """Pull a model from Ollama registry."""
        payload = {"name": model_name, "stream": True}
        response = requests.post(
            f"{self.host}/api/pull",
            json=payload,
            stream=True,
            timeout=600
        )
        for line in response.iter_lines():
            if line:
                try:
                    chunk = json.loads(line.decode("utf-8"))
                    status = chunk.get("status", "")
                    yield status + "\n"
                    if chunk.get("completed", False):
                        self.model = model_name
                        break
                except json.JSONDecodeError:
                    continue
