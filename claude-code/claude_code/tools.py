"""
Tools for Claude Code - file operations, bash execution, code analysis.
"""
import os
import subprocess
import sys
from pathlib import Path


def read_file(path: str) -> str:
    """Read a file and return its contents."""
    p = Path(path).expanduser().resolve()
    if not p.exists():
        return f"[ERROR] File not found: {path}"
    if not p.is_file():
        return f"[ERROR] Not a file: {path}"
    try:
        content = p.read_text(encoding="utf-8")
        lines = content.count("\n") + 1
        return f"### File: {path} ({lines} lines, {len(content)} chars)\n\n{content}"
    except Exception as e:
        return f"[ERROR] Could not read file: {e}"


def write_file(path: str, content: str) -> str:
    """Write content to a file. Creates parent directories if needed."""
    p = Path(path).expanduser().resolve()
    try:
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_text(content, encoding="utf-8")
        return f"[OK] Written {len(content)} chars to {path}"
    except Exception as e:
        return f"[ERROR] Could not write file: {e}"


def edit_file(path: str, old_text: str, new_text: str) -> str:
    """Search and replace text in a file."""
    p = Path(path).expanduser().resolve()
    if not p.exists():
        return f"[ERROR] File not found: {path}"
    try:
        content = p.read_text(encoding="utf-8")
        if old_text not in content:
            return f"[ERROR] Text not found in file:\n{old_text}"
        new_content = content.replace(old_text, new_text, 1)
        p.write_text(new_content, encoding="utf-8")
        return f"[OK] Replaced text in {path}"
    except Exception as e:
        return f"[ERROR] Could not edit file: {e}"


def list_files(path: str = ".") -> str:
    """List files in a directory, showing a tree-like view."""
    p = Path(path).expanduser().resolve()
    if not p.exists():
        return f"[ERROR] Path not found: {path}"
    if not p.is_dir():
        return f"[ERROR] Not a directory: {path}"

    result = [f"### Directory: {p}\n"]
    try:
        for entry in sorted(p.iterdir(), key=lambda x: (not x.is_dir(), x.name.lower())):
            suffix = "/" if entry.is_dir() else ""
            size = ""
            if entry.is_file():
                sz = entry.stat().st_size
                if sz < 1024:
                    size = f" ({sz} B)"
                elif sz < 1024**2:
                    size = f" ({sz/1024:.1f} KB)"
                else:
                    size = f" ({sz/1024**2:.1f} MB)"
            result.append(f"  {entry.name}{suffix}{size}")
    except PermissionError:
        result.append("  [Permission denied]")

    return "\n".join(result)


def run_bash(command: str, cwd: str | None = None, timeout: int = 30) -> str:
    """Execute a bash command and return output."""
    if cwd is None:
        cwd = os.getcwd()
    try:
        result = subprocess.run(
            command,
            shell=True,
            capture_output=True,
            text=True,
            cwd=cwd,
            timeout=timeout
        )
        output = ""
        if result.stdout:
            output += f"STDOUT:\n{result.stdout}"
        if result.stderr:
            output += f"STDERR:\n{result.stderr}"
        if result.returncode != 0:
            output += f"\n[Exit code: {result.returncode}]"
        return output.strip() or "(no output)"
    except subprocess.TimeoutExpired:
        return f"[ERROR] Command timed out after {timeout}s"
    except Exception as e:
        return f"[ERROR] {e}"


def analyze_code(path: str) -> str:
    """Basic code analysis: count lines, detect language, etc."""
    p = Path(path).expanduser().resolve()
    if not p.exists():
        return f"[ERROR] File not found: {path}"

    content = p.read_text(encoding="utf-8", errors="ignore")
    lines = content.split("\n")
    total_lines = len(lines)
    non_empty = sum(1 for l in lines if l.strip())
    comment_lines = sum(1 for l in lines if l.strip().startswith(("#", "//", "/*", "*", "--", "%")))

    ext = p.suffix.lower()
    lang_map = {
        ".py": "Python", ".js": "JavaScript", ".ts": "TypeScript",
        ".tsx": "TypeScript React", ".jsx": "JavaScript React",
        ".go": "Go", ".rs": "Rust", ".java": "Java", ".c": "C",
        ".cpp": "C++", ".h": "C/C++ Header", ".cs": "C#",
        ".rb": "Ruby", ".php": "PHP", ".swift": "Swift",
        ".kt": "Kotlin", ".scala": "Scala", ".r": "R",
        ".sh": "Shell", ".bash": "Bash", ".zsh": "Zsh",
        ".html": "HTML", ".css": "CSS", ".scss": "SCSS",
        ".json": "JSON", ".yaml": "YAML", ".yml": "YAML",
        ".md": "Markdown", ".txt": "Text", ".toml": "TOML",
        ".sql": "SQL", ".lua": "Lua", ".pl": "Perl",
        ".dart": "Dart", ".ex": "Elixir", ".exs": "Elixir",
    }
    language = lang_map.get(ext, "Unknown")

    return (
        f"### Code Analysis: {path}\n"
        f"- Language: {language}\n"
        f"- Total lines: {total_lines}\n"
        f"- Non-empty lines: {non_empty}\n"
        f"- Comment lines: {comment_lines}\n"
        f"- File size: {p.stat().st_size} bytes\n"
    )


TOOL_DESCRIPTIONS = {
    "read": {
        "desc": "Read a file from the filesystem",
        "usage": 'read(<path>)',
        "example": 'read("src/main.py")',
    },
    "write": {
        "desc": "Write content to a file",
        "usage": 'write(<path>, <content>)',
        "example": 'write("hello.py", \'print("Hello")\')',
    },
    "edit": {
        "desc": "Search and replace text in a file",
        "usage": 'edit(<path>, <old_text>, <new_text>)',
        "example": 'edit("main.py", "old_func", "new_func")',
    },
    "ls": {
        "desc": "List files in a directory",
        "usage": 'ls(<path>)',
        "example": 'ls("src/")',
    },
    "bash": {
        "desc": "Execute a bash command",
        "usage": 'bash(<command>)',
        "example": 'bash("ls -la")',
    },
    "analyze": {
        "desc": "Analyze a source code file",
        "usage": 'analyze(<path>)',
        "example": 'analyze("app.py")',
    },
}
