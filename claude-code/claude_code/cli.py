"""
Main CLI entry point for Claude Code.
"""
import argparse
import sys
import os
import shutil
import json
from pathlib import Path

from . import __version__
from .config import ensure_config, save_config, list_models_from_ollama
from .ai_client import AIClient
from .session import Session
from .tools import read_file, write_file, edit_file, list_files, run_bash, analyze_code, TOOL_DESCRIPTIONS


# ─── Color helpers ───────────────────────────────────────────────────────
class Colors:
    HEADER = '\033[95m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    BOLD = '\033[1m'
    DIM = '\033[2m'
    RESET = '\033[0m'


def cprint(text, color="", bold=False, end="\n"):
    if bold:
        color += Colors.BOLD
    sys.stdout.write(f"{color}{text}{Colors.RESET}{end}")
    sys.stdout.flush()


def print_banner():
    banner = f"""
{Colors.CYAN}{Colors.BOLD}   ╔══════════════════════════════════════╗
   ║       CLAUDE CODE (Ollama Edition)    ║
   ║     Local AI Coding Assistant CLI      ║
   ╚══════════════════════════════════════╝{Colors.RESET}
    """
    print(banner)


def print_tool_help():
    print(f"\n{Colors.BOLD}Available Tools:{Colors.RESET}")
    for name, info in TOOL_DESCRIPTIONS.items():
        print(f"  {Colors.GREEN}{name}{Colors.RESET}: {info['desc']}")
        print(f"    Usage: {Colors.DIM}{info['usage']}{Colors.RESET}")
        print(f"    Example: {Colors.DIM}{info['example']}{Colors.RESET}")
        print()


def print_help():
    print(f"""
{Colors.BOLD}Commands:{Colors.RESET}
  /help              - Show this help
  /tools             - Show available tools
  /model <name>      - Switch AI model (e.g., /model codellama)
  /models            - List available models from Ollama
  /clear             - Clear conversation history
  /save [name]       - Save current session
  /load <name>       - Load a session
  /sessions          - List saved sessions
  /config            - Show current configuration
  /exit, /quit       - Exit Claude Code

{Colors.BOLD}Tools (use inside chat):{Colors.RESET}
  read("path")       - Read a file
  write("p","c")     - Write to a file
  edit("p","o","n")  - Edit a file (search & replace)
  ls("path")         - List directory contents
  bash("cmd")        - Run a bash command
  analyze("path")    - Analyze source code
""")


def parse_tool_calls(text: str, cwd: str) -> str:
    """Parse and execute tool calls in AI response."""
    import re

    result_text = text
    # Pattern: tool_name("arg1", "arg2", ...)
    pattern = r'(read|write|edit|ls|bash|analyze)\(((?:[^"\)]|"[^"]*")*)\)'
    
    def execute_tool(match):
        tool_name = match.group(1)
        args_str = match.group(2)
        # Parse arguments
        args = re.findall(r'"((?:[^"\\]|\\.)*)"', args_str)
        args = [a.replace('\\"', '"').replace('\\n', '\n') for a in args]

        tool_map = {
            "read": lambda: read_file(args[0]) if args else "[ERROR] Missing path argument",
            "write": lambda: write_file(args[0], args[1]) if len(args) >= 2 else "[ERROR] Missing arguments",
            "edit": lambda: edit_file(args[0], args[1], args[2]) if len(args) >= 3 else "[ERROR] Missing arguments",
            "ls": lambda: list_files(args[0]) if args else list_files(cwd),
            "bash": lambda: run_bash(args[0], cwd=cwd) if args else "[ERROR] Missing command",
            "analyze": lambda: analyze_code(args[0]) if args else "[ERROR] Missing path",
        }

        result = tool_map.get(tool_name, lambda: "[ERROR] Unknown tool")()
        return f"\n[{tool_name} result]\n{result}\n[/{tool_name}]\n"

    result_text = re.sub(pattern, lambda m: execute_tool(m), result_text)
    return result_text


def interactive_mode(config: dict):
    """Main interactive loop."""
    os.system("cls" if os.name == "nt" else "clear")
    print_banner()

    client = AIClient(
        host=config["ollama_host"],
        model=config["model"],
        temperature=config["temperature"],
        max_tokens=config["max_tokens"],
    )
    session = Session()
    cwd = os.getcwd()

    # Check if Ollama is running
    try:
        import requests
        resp = requests.get(f"{config['ollama_host']}/api/tags", timeout=3)
        if resp.status_code != 200:
            cprint(f"⚠  Ollama not responding at {config['ollama_host']}", Colors.YELLOW)
            cprint(f"   Make sure Ollama is running: ollama serve", Colors.YELLOW)
        else:
            models = [m["name"] for m in resp.json().get("models", [])]
            if config["model"] not in models:
                cprint(f"⚠  Model '{config['model']}' not found in Ollama", Colors.YELLOW)
                cprint(f"   Available: {', '.join(models[:5])}{'...' if len(models) > 5 else ''}", Colors.YELLOW)
                cprint(f"   Use /model <name> to switch, or /models to see all", Colors.YELLOW)
            else:
                cprint(f"✓ Connected to Ollama | Model: {config['model']}", Colors.GREEN)
    except Exception:
        cprint(f"✗ Cannot connect to Ollama at {config['ollama_host']}", Colors.RED)
        cprint(f"  Start Ollama: 'ollama serve'", Colors.YELLOW)

    cprint(f"  Working directory: {cwd}", Colors.DIM)
    cprint(f"  Type /help for commands, /exit to quit\n", Colors.DIM)

    while True:
        try:
            # Get user input
            user_input = input(f"\n{Colors.BOLD}{Colors.BLUE}You >{Colors.RESET} ").strip()
        except (EOFError, KeyboardInterrupt):
            print()
            cprint("\n👋 Goodbye!", Colors.GREEN)
            session.save()
            break

        if not user_input:
            continue

        # Handle commands
        if user_input.startswith("/"):
            cmd_parts = user_input[1:].strip().split(maxsplit=1)
            cmd = cmd_parts[0].lower() if cmd_parts else ""
            cmd_arg = cmd_parts[1] if len(cmd_parts) > 1 else ""

            if cmd in ("exit", "quit"):
                cprint("👋 Goodbye!", Colors.GREEN)
                session.save()
                break

            elif cmd == "help":
                print_help()

            elif cmd == "tools":
                print_tool_help()

            elif cmd == "model":
                if cmd_arg:
                    config["model"] = cmd_arg
                    client.model = cmd_arg
                    save_config(config)
                    cprint(f"✓ Model switched to: {cmd_arg}", Colors.GREEN)
                else:
                    cprint(f"Current model: {config['model']}", Colors.CYAN)

            elif cmd == "models":
                cprint("Fetching models from Ollama...", Colors.DIM)
                models = client.list_models()
                if models:
                    cprint("Available models:", Colors.BOLD)
                    for m in models:
                        marker = " ✓" if m == config["model"] else ""
                        cprint(f"  • {m}{marker}", Colors.CYAN if m == config["model"] else "")
                else:
                    cprint("No models found or cannot connect to Ollama.", Colors.YELLOW)

            elif cmd == "clear":
                session = Session()
                cprint("✓ Conversation history cleared.", Colors.GREEN)

            elif cmd == "save":
                name = cmd_arg or session.session_id
                session.session_id = name
                session.save()
                cprint(f"✓ Session saved: {name}", Colors.GREEN)

            elif cmd == "load":
                if cmd_arg:
                    try:
                        session = Session.load(cmd_arg)
                        cprint(f"✓ Session loaded: {cmd_arg} ({len(session.messages)} messages)", Colors.GREEN)
                    except FileNotFoundError:
                        cprint(f"✗ Session not found: {cmd_arg}", Colors.RED)
                else:
                    cprint("Usage: /load <session_id>", Colors.YELLOW)

            elif cmd == "sessions":
                from .config import SESSION_DIR
                if SESSION_DIR.exists():
                    sessions = sorted(SESSION_DIR.glob("*.json"))
                    if sessions:
                        cprint("Saved sessions:", Colors.BOLD)
                        for s in sessions:
                            try:
                                with open(s) as f:
                                    data = json.load(f)
                                n_msgs = len(data.get("messages", []))
                                cprint(f"  • {s.stem} ({n_msgs} messages)", Colors.CYAN)
                            except:
                                cprint(f"  • {s.stem} (corrupt)", Colors.RED)
                    else:
                        cprint("No saved sessions.", Colors.DIM)
                else:
                    cprint("No saved sessions.", Colors.DIM)

            elif cmd == "config":
                cprint("Current configuration:", Colors.BOLD)
                for k, v in config.items():
                    cprint(f"  {k}: {v}", Colors.CYAN)

            else:
                cprint(f"Unknown command: {user_input}", Colors.RED)
                cprint("Type /help for available commands.", Colors.YELLOW)

            continue

        # ─── Process user message ───────────────────────────────────
        session.add_message("user", user_input)

        # Build messages for AI
        messages = session.get_messages(config["system_prompt"], config["context_length"])

        # Get AI response
        cprint("\nClaude Code >", Colors.GREEN, bold=True, end=" ")
        full_response = ""

        try:
            for chunk in client.chat(messages):
                print(chunk, end="", flush=True)
                full_response += chunk
            print()

            # Process tool calls in response
            processed = parse_tool_calls(full_response, cwd)
            if processed != full_response:
                # There were tool calls - show results and send back to AI
                cprint("\n[Tool results sent back to AI for final response...]\n", Colors.DIM)
                session.add_message("assistant", full_response)
                session.add_message("user", f"[Tool execution results]\n{processed}\n\nPlease provide a final summary of what was done.")

                messages2 = session.get_messages(config["system_prompt"], config["context_length"])
                cprint("Claude Code >", Colors.GREEN, bold=True, end=" ")
                full_response2 = ""
                for chunk in client.chat(messages2):
                    print(chunk, end="", flush=True)
                    full_response2 += chunk
                print()
                session.add_message("assistant", full_response2)
            else:
                session.add_message("assistant", full_response)

            # Auto-save every message
            session.save()

        except KeyboardInterrupt:
            print("\n")
            cprint("⏹  Interrupted.", Colors.YELLOW)
            if full_response:
                session.add_message("assistant", full_response + "... [interrupted]")
            continue
        except Exception as e:
            cprint(f"\n✗ Error: {e}", Colors.RED)
            continue


def non_interactive_mode(config: dict, prompt: str):
    """Run a single prompt and exit."""
    client = AIClient(
        host=config["ollama_host"],
        model=config["model"],
        temperature=config["temperature"],
        max_tokens=config["max_tokens"],
    )
    session = Session()

    session.add_message("user", prompt)
    messages = session.get_messages(config["system_prompt"], config["context_length"])

    for chunk in client.chat(messages, stream=False):
        print(chunk, end="")
    print()


def main():
    parser = argparse.ArgumentParser(
        description="Claude Code - Local AI Coding Assistant (Ollama Edition)",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  claude-code                   Start interactive mode
  claude-code "Buat REST API"   Run single prompt
  claude-code --model codellama Start with specific model
  claude-code --models          List available models
  claude-code --analyze file.py Analyze a code file
        """
    )
    parser.add_argument("prompt", nargs="?", help="Single prompt to run (non-interactive)")
    parser.add_argument("--model", "-m", help="AI model to use (overrides config)")
    parser.add_argument("--models", action="store_true", help="List available models and exit")
    parser.add_argument("--analyze", metavar="FILE", help="Analyze a code file and exit")
    parser.add_argument("--version", "-v", action="store_true", help="Show version")
    parser.add_argument("--host", help="Ollama host URL (default: http://localhost:11434)")

    args = parser.parse_args()
    config = ensure_config()

    if args.version:
        print(f"Claude Code v{__version__} (Ollama Edition)")
        return

    if args.host:
        config["ollama_host"] = args.host
        save_config(config)

    if args.model:
        config["model"] = args.model
        save_config(config)

    if args.models:
        print("Fetching models from Ollama...")
        models = list_models_from_ollama(config["ollama_host"])
        if models:
            print("\nAvailable models:")
            for m in models:
                print(f"  • {m}")
        else:
            print("No models found. Make sure Ollama is running.")
        return

    if args.analyze:
        print(analyze_code(args.analyze))
        return

    # Set working directory to current dir
    os.chdir(os.getcwd())

    if args.prompt:
        non_interactive_mode(config, args.prompt)
    else:
        interactive_mode(config)


if __name__ == "__main__":
    main()
