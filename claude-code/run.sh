#!/bin/bash
# Claude Code - langsung jalan tanpa install
cd "$(dirname "$0")"
python -m claude_code.cli "$@"
