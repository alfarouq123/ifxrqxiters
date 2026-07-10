# Claude Code (Ollama Edition)

Claude Code versi lokal yang jalan pake **Ollama** — gratis, offline, dan tanpa API key!

## 📦 Instalasi

### Prasyarat
- Python 3.8+
- [Ollama](https://ollama.ai) sudah terinstall dan jalan
- Pull model: `ollama pull codellama` (atau model lain)

### Install
```bash
cd claude-code
pip install -e .
```

Atau langsung aja jalanin:
```bash
python -m claude_code.cli
```

## 🚀 Penggunaan

### Interactive Mode
```bash
claude-code
```
Mulai sesi chat coding langsung di terminal.

### Single Prompt
```bash
claude-code "Buat REST API dengan FastAPI"
```

### CLI Options
```bash
claude-code --model llama3.2       # Pake model tertentu
claude-code --models                # Lihat semua model yg available
claude-code --analyze app.py        # Analisis file kode
claude-code --host http://10.0.0.1:11434  # Ollama di host lain
```

## 🛠️ Fitur

### Chat Commands
| Command | Fungsi |
|---------|--------|
| `/help` | Tampilkan bantuan |
| `/tools` | Lihat tools yang tersedia |
| `/model <name>` | Ganti model AI |
| `/models` | List semua model Ollama |
| `/clear` | Hapus history chat |
| `/save <name>` | Simpan session |
| `/load <name>` | Load session |
| `/sessions` | List session tersimpan |
| `/exit` | Keluar |

### Tools (dipanggil oleh AI)
| Tool | Fungsi |
|------|--------|
| `read("path")` | Baca file |
| `write("path", "content")` | Tulis file |
| `edit("path", "old", "new")` | Edit file |
| `ls("path")` | List direktori |
| `bash("cmd")` | Eksekusi perintah |
| `analyze("path")` | Analisis kode |

## ⚙️ Konfigurasi
Config file: `~/.claude-code/config.json`

```json
{
  "ollama_host": "http://localhost:11434",
  "model": "codellama",
  "temperature": 0.2,
  "max_tokens": 4096,
  "context_length": 10,
  "safe_mode": false
}
```

## 🧠 Model yang Direkomendasikan
- `codellama` — khusus coding
- `llama3.2` — general purpose
- `deepseek-coder` — coding specialist
- `qwen2.5-coder` — coding specialist
- `mistral` — ringan dan cepat
- `phi3` — sangat ringan

## 📁 Struktur Project
```
claude-code/
├── claude_code/
│   ├── __init__.py
│   ├── cli.py        # Main CLI
│   ├── ai_client.py  # Ollama API client
│   ├── tools.py      # File/bash/code tools
│   ├── session.py    # Session management
│   └── config.py     # Configuration
├── setup.py
└── README.md
```

---
Dibuat dengan ❤️ buat coding tanpa batas!
