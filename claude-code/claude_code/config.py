"""
Configuration for Claude Code CLI
"""
import os
import json
from pathlib import Path

CONFIG_DIR = Path.home() / ".claude-code"
CONFIG_FILE = CONFIG_DIR / "config.json"
SESSION_DIR = CONFIG_DIR / "sessions"

DEFAULT_CONFIG = {
    "ollama_host": "http://localhost:11434",
    "model": "codellama",         # default model
    "temperature": 0.2,
    "max_tokens": 4096,
    "system_prompt": (
        "You are an expert coding assistant. You help the user write, debug, and analyze code. "
        "You can read files, write files, and execute bash commands when needed. "
        "Be concise, practical, and provide working solutions."
    ),
    "context_length": 10,          # how many previous messages to keep
    "safe_mode": False,            # ask before executing commands
}


def ensure_config():
    """Ensure config directory and default config exist."""
    CONFIG_DIR.mkdir(parents=True, exist_ok=True)
    SESSION_DIR.mkdir(parents=True, exist_ok=True)

    if not CONFIG_FILE.exists():
        with open(CONFIG_FILE, "w") as f:
            json.dump(DEFAULT_CONFIG, f, indent=2)
        return DEFAULT_CONFIG.copy()

    with open(CONFIG_FILE, "r") as f:
        try:
            cfg = json.load(f)
            # Merge with defaults for any missing keys
            for k, v in DEFAULT_CONFIG.items():
                cfg.setdefault(k, v)
            return cfg
        except json.JSONDecodeError:
            return DEFAULT_CONFIG.copy()


def save_config(config: dict):
    """Save config to file."""
    CONFIG_DIR.mkdir(parents=True, exist_ok=True)
    with open(CONFIG_FILE, "w") as f:
        json.dump(config, f, indent=2)


def list_models_from_ollama(host: str = None) -> list[str]:
    """Fetch available models from Ollama."""
    import requests
    h = host or DEFAULT_CONFIG["ollama_host"]
    try:
        resp = requests.get(f"{h}/api/tags", timeout=5)
        if resp.status_code == 200:
            models = resp.json().get("models", [])
            return [m["name"] for m in models]
    except Exception:
        pass
    return []
