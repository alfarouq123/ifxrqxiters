from setuptools import setup, find_packages

setup(
    name="claude-code",
    version="1.0.0",
    description="Local AI Coding Assistant CLI (Ollama Edition)",
    author="Claude Code Builder",
    packages=find_packages(),
    python_requires=">=3.8",
    install_requires=[
        "requests>=2.25.0",
    ],
    entry_points={
        "console_scripts": [
            "claude-code=claude_code.cli:main",
        ],
    },
)
