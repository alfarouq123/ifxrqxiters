# ifxrq-ai-chat

chat AI persona **IFxrq** pake Gemini API. api key aman di environment variable
server (vercel), bukan di kode. full-screen, tema ungu, bisa baca isi file,
bikin source code ala Claude dengan **artifact viewer** (tab kode/preview,
persis Claude.ai), plugin `@search`, plugin `@edit` (edit foto lewat AI),
plugin "bikin kode" tanpa `@`, dan editor foto ringan sebelum kirim gambar.

## struktur

```
.
├── index.html          <- semua frontend (UI, markdown/code render, upload, editor foto)
├── api/                 <- WAJIB ada di sini biar vercel otomatis bikin route (lihat catatan di bawah)
│   ├── chat.js           <- route tipis, manggil plugins/chat.js
│   ├── search.js         <- route tipis, manggil plugins/search.js
│   ├── coder.js          <- route tipis, manggil plugins/coder.js
│   └── edit.js           <- route tipis, manggil plugins/edit.js
├── plugins/             <- LOGIC asli semua fitur ada di sini
│   ├── chat.js            <- proxy ke gemini, baca GEMINI_API_KEY dari env
│   ├── search.js          <- proxy ke synoxcloud copilot-ai (plugin @search)
│   ├── coder.js           <- proxy ke synoxcloud ai-coder (fitur "bikin kode")
│   └── edit.js            <- upload foto ke uguu.se lalu proxy ke API edit foto
├── package.json
├── .env.example
└── .gitignore
```

### kenapa masih ada file di `/api` padahal lo minta pindah ke `/plugins`?

vercel itu aturannya: file yang otomatis jadi "route" HTTP (`/api/chat`, `/api/search`,
dst) **cuma dibaca dari folder `/api`** secara default. kalo semua logic gw
taruh murni di `/plugins` tanpa file apapun di `/api`, request dari frontend
ke `/api/chat` bakal 404 karena vercel gak tau itu harus dijalanin di mana.

jadi solusinya: file di `/api` sekarang **cuma tipis banget** (cuma nangkep
request HTTP terus lempar ke fungsi asli), dan **semua logic beneran** —
manggil gemini, manggil synoxcloud, dsb — udah gw pindah 100% ke `/plugins`.
kalo lo mau nambah plugin baru nanti, tinggal:
1. bikin file logic-nya di `plugins/nama-plugin.js` (export function)
2. bikin file tipis `api/nama-plugin.js` yang import & panggil function itu

## cara deploy ke vercel

1. push folder ini ke repo github lo (`.env` otomatis kelewat karena ada di `.gitignore`).
2. buka [vercel.com](https://vercel.com) → **Add New** → **Project** → import repo.
3. di bagian **Environment Variables**, tambahin:
   - `GEMINI_API_KEY` = api key gemini lo (dari [aistudio.google.com](https://aistudio.google.com))
   - (opsional) `IMAGE_EDIT_API_URL` — cuma perlu kalau mau ganti endpoint
     plugin `@edit`, default-nya udah otomatis kepake tanpa perlu di-set
4. klik **Deploy**.
5. buka url yang dikasih vercel, chat langsung jalan.

## fitur

### chat biasa
histori percakapan dikirim ulang tiap request (gemini API stateless), render
markdown penuh (paragraf, list, tabel, gambar). batas panjang jawaban
(`maxOutputTokens`) dinaikin ke **65536** (dari awalnya 1024) — diset di dua
tempat: default di `plugins/chat.js` dan eksplisit dikirim dari `index.html`
(`MAX_OUTPUT_TOKENS`). jujur aja: gak ada API model AI yang beneran
"unlimited" — selalu ada batas keras dari modelnya sendiri (gemini-3.1-flash-lite
punya cap output token tersendiri di sisi google). 65536 udah jauh di atas
kebutuhan chat normal; kalau google tetep nolak/motong di angka tertentu,
berarti itu emang batas mentok modelnya, tinggal turunin nilainya di dua
tempat itu.

### source code ala Claude (artifact viewer)
setiap kode yang di-generate bot (chat biasa maupun plugin) tampil dulu
sebagai **card ringkas** di chat (bisa dipotong preview-nya kalau panjang).
pencet card itu (atau tombol **⤢ buka**) buat munculin **artifact viewer**
full-screen — persis kayak canvas/artifact di Claude.ai:
- tab **kode** — lihat source lengkap dengan syntax highlight
- tab **preview** — cuma muncul kalau kodenya html, nge-render langsung di
  iframe (`srcdoc`, aman, gak nyentuh domain lain), otomatis kebuka duluan
  kalau emang html
- tombol **copy** dan **⬇ unduh** di header — unduh bikin file beneran
  (`.html`, `.js`, `.py`, dst sesuai bahasanya), ini yang bikin AI-nya bisa
  "kirim dokumen hasil kodingan" kayak Claude

### plugin `@search`
ketik `@` di kolom chat → muncul dropdown (kayak chatgpt) → pilih `search` →
lanjut ketik query. manggil `/api/search` (proxy ke synoxcloud copilot-ai).
hasil ditampilin dengan badge "🔍 hasil pencarian" + daftar sumber (favicon +
judul + tombol **SUMBER**). pencet SUMBER buka halaman aslinya di overlay
iframe di dalam app — url address bar browser tetep di domain lo, gak
pindah keluar. ada tombol ↗ fallback buka tab baru kalau situsnya nge-block
iframe (banyak situs pasang `X-Frame-Options`, di luar kendali kita).

### plugin "bikin kode" (tanpa `@`)
pencet **+** → **plugin** → **bikin kode**. muncul banner mode di atas kolom
chat. abis itu tinggal ketik langsung apa yang mau dibikin (gak perlu ketik
apa-apa di depannya), kirim, dan itu manggil `/api/coder` (proxy ke synoxcloud
ai-coder) bukan gemini. `session` dipertahanin otomatis biar revisi lanjutan
("ubah warnanya jadi biru") masih nyambung sama sesi kode sebelumnya di sisi
synoxcloud. keluar dari mode ini pencet ✕ di banner.

### plugin `@edit` — edit foto lewat AI
alurnya persis yang lo minta:
1. attach fotonya dulu (pencet **+** → **foto**/**kamera**, ngelewatin editor
   rotate/brightness/contrast dulu kayak biasa)
2. ketik `@edit <instruksinya>`, contoh: `@edit ubah jadi malam`
3. frontend kirim foto (base64) + prompt ke `/api/edit`
4. `plugins/edit.js` upload fotonya ke **uguu.se** dulu biar dapet url publik
5. url + prompt itu dilempar ke `https://api.synoxcloud.xyz/edit/nanobanana2`
   (endpoint yang lo kasih), hasilnya (url gambar baru) ditampilin di chat
   dengan badge "🖌️ hasil edit foto"

endpoint-nya udah di-hardcode default di `plugins/edit.js`. kalau nanti mau
ganti endpoint tanpa ubah kode, bisa override lewat env var
`IMAGE_EDIT_API_URL` di vercel (format placeholder `{url}` dan `{prompt}`
sama kayak default-nya).

kalau belum attach foto dan langsung ketik `@edit ...`, muncul pesan
`[system]` yang minta lo attach fotonya dulu — itu emang disengaja, bukan bug.

> catatan privasi: uguu.se itu hosting file publik & sementara (mirip
> pomf-style uploader, biasanya file kehapus otomatis setelah beberapa jam).
> foto yang di-upload lewat sini jadi bisa diakses siapa aja yang tau url-nya
> selama belum expired — kasih tau ke user kalau perlu.

### upload & baca file
pencet **+** → **kamera** / **foto** / **file**.
- file gambar (kamera/foto) masuk ke **editor foto** dulu (rotate kiri/kanan,
  slider terang & kontras) sebelum beneran ke-attach — mirip preview-before-send
  di whatsapp. bisa "lewati" per foto atau "pakai foto" buat konfirmasi.
- file teks (`.txt .md .csv .json .js .py .html .css` dst) dibaca isinya
  langsung (bukan cuma dikirim sebagai lampiran biner) dan ditempel sebagai
  teks ke prompt, jadi AI beneran "baca" isinya, bukan cuma tau ada file.
- gambar & file non-teks lain dikirim sebagai `inlineData` (base64) ke gemini
  vision.

## catatan soal API plugin (search & coder)

bentuk JSON asli yang dibalikin `copilot-ai` dan `ai-coder` belum pernah gw
tes langsung (gak ada akses network ke domain itu dari sandbox gw), jadi
`parseSearchResponse()` dan `parseCoderResponse()` di `index.html` nyoba
beberapa kemungkinan nama field sekaligus (`message`, `result`, `code`,
`sources`, dll) plus nyoba nge-extract fenced code block (```` ```lang ... ``` ````)
dari teks kalau field code terpisah gak ketemu. kalo pas dites hasilnya
meleset — buka devtools → network → liat response asli → sesuain nama field
di fungsi-fungsi itu (atau di `plugins/search.js` / `plugins/coder.js` kalau
mau diproses di sisi server sebelum sampe ke frontend).

## belum digarap

fitur kayak generate gambar (selain edit foto), illegal ai lain, dll masih
nyusul — struktur `plugins/` udah siap buat nampung itu kapan pun lo
tentuin API-nya.

## perbaikan layout

- **kolom ketik kepotong/kebawah di hp**: penyebabnya `100vh` di mobile
  browser gak ngitung address bar yang bisa collapse/expand, jadi tinggi app
  suka salah hitung. sekarang pake `100dvh` (dynamic viewport height, browser
  modern) dengan fallback `100vh`, plus padding aman buat home-indicator hp
  yang punya notch (`env(safe-area-inset-bottom)` + `viewport-fit=cover`).
- **bubble chat / kode yang bikin layout bisa digeser ke kanan**: itu bug
  klasik flexbox — anak flex (bubble) defaultnya gak mau menyusut di bawah
  lebar konten aslinya (`min-width:auto`), jadi kalau ada baris kode yang
  panjang banget, dia dorong keluar batas bubble dan bikin seluruh chat bisa
  di-scroll ke samping. udah difix dengan kasih `min-width:0` di rantai
  `.row` → `.bubble`, plus kode sekarang **wrap ke bawah** (bukan scroll ke
  kanan) baik di card ringkas maupun di artifact viewer, sesuai yang diminta.
  `.chat` juga dikasih `overflow-x:hidden` sebagai jaring pengaman tambahan.
