"""
Conversation session management.
"""
import json
import datetime
from pathlib import Path
from typing import Optional

from .config import SESSION_DIR


class Session:
    def __init__(self, session_id: Optional[str] = None):
        self.session_id = session_id or datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        self.messages: list[dict] = []
        self.file = SESSION_DIR / f"{self.session_id}.json"

    def add_message(self, role: str, content: str):
        self.messages.append({
            "role": role,
            "content": content,
            "timestamp": datetime.datetime.now().isoformat(),
        })

    def get_messages(self, system_prompt: str, context_length: int = 10) -> list[dict]:
        """Build messages list for AI, with system prompt and recent context."""
        msgs = [{"role": "system", "content": system_prompt}]

        # Take only the last N exchanges (each exchange = user + assistant)
        recent = self.messages[-(context_length * 2):]
        for m in recent:
            msgs.append({"role": m["role"], "content": m["content"]})

        return msgs

    def save(self):
        self.file.parent.mkdir(parents=True, exist_ok=True)
        with open(self.file, "w") as f:
            json.dump({
                "session_id": self.session_id,
                "messages": self.messages,
            }, f, indent=2)

    @staticmethod
    def load(session_id: str) -> "Session":
        filepath = SESSION_DIR / f"{session_id}.json"
        if not filepath.exists():
            raise FileNotFoundError(f"Session not found: {session_id}")
        with open(filepath) as f:
            data = json.load(f)
        sess = Session(data["session_id"])
        sess.messages = data["messages"]
        return sess

    def delete(self):
        if self.file.exists():
            self.file.unlink()

    def __str__(self):
        return f"Session({self.session_id}, {len(self.messages)} messages)"
