# ifxrq-ai-chat

chat AI persona **IFxrq** pake Gemini API. api key udah gak nempel di kode
sama sekali — dia jalan lewat serverless function (`api/chat.js`) yang baca
key dari environment variable, jadi aman walau repo-nya public di github.

## struktur

```
.
├── index.html        <- frontend (UI chat, markdown/code/table/image render, upload file)
├── api/
│   └── chat.js        <- serverless function, proxy ke gemini, baca GEMINI_API_KEY dari env
├── package.json
├── .env.example        <- contoh env var (JANGAN commit .env asli)
└── .gitignore
```

## cara deploy ke vercel

1. push folder ini ke repo github lo (pastiin `.env` gak ikut ke-push — udah di-handle sama `.gitignore`).
2. buka [vercel.com](https://vercel.com) → **Add New Project** → import repo github lo.
3. pas setup project, buka bagian **Environment Variables**, tambahin:
   - key: `GEMINI_API_KEY`
   - value: api key gemini lo (dari [ai.google.dev](https://ai.google.dev) / Google AI Studio)
4. klik **Deploy**. tunggu bentar, selesai.
5. buka url yang dikasih vercel (misal `ifxrq-ai.vercel.app`) — chat langsung jalan, key gak pernah keliatan di client/browser/github.

kalo lo ganti/rotate api key nanti, tinggal update value env var di **Project Settings → Environment Variables** di dashboard vercel, terus redeploy (atau klik "Redeploy" aja, gak perlu ubah kode).

## develop lokal (opsional)

butuh [vercel CLI](https://vercel.com/docs/cli):

```bash
npm i -g vercel
vercel dev
```

ini bakal jalanin `index.html` + `api/chat.js` sekalian secara lokal di `localhost:3000`, lengkap sama env var dari `.env` (bikin file `.env` lokal, isi `GEMINI_API_KEY=...`, jangan di-commit).

> kalo `index.html` dibuka langsung dobel-klik dari file explorer (tanpa `vercel dev` / tanpa deploy), fitur chat gak bakal jalan karena `/api/chat` butuh server buat nangkep request-nya.

## kenapa lebih aman dari versi sebelumnya

sebelumnya api key ditaruh di variable javascript di `index.html` — itu artinya
siapa aja yang buka "view source" atau lihat repo github bisa nyolong key lo.
sekarang, browser cuma manggil `/api/chat` (endpoint punya lo sendiri), dan
cuma server vercel yang tau api key aslinya lewat `process.env.GEMINI_API_KEY`.

## fitur yang udah jalan

- render markdown penuh di jawaban bot: **code block** (dengan syntax highlight + tombol copy), **tabel**, **gambar** (kalau model kasih link gambar / markdown image).
- upload file (gambar, pdf, txt, dll — max 8mb per file) buat dikirim ke gemini sebagai konteks (vision/multimodal).
- histori percakapan tetep jalan (dikirim ulang tiap request karena gemini API stateless).

## belum digarap (nanti nyusul bareng api-nya masing-masing)

fitur-fitur kayak generate gambar, illegal ai, nanobanana, dll sengaja belum
dipasang UI + wiring API-nya — nunggu lo tentuin masing-masing itu manggil
API/service apa, biar strukturnya konsisten kayak `/api/chat` (satu endpoint
serverless per fitur, key-nya di env var juga).
