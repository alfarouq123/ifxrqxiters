# 🔌 Sistem Plugin — IFxrq AI Web

Dokumen ini menjelaskan sistem plugin baru yang di-porting dari bot WhatsApp `IFxrqBotz` ke web app ini.

## Struktur folder

```
plugins/
  ai-core/     <- fitur AI utama yang SUDAH ADA sebelumnya (chat, search, edit, hd, uhd, berfikir, code, play)
                 dipanggil langsung oleh api/chat.js, api/search.js, dst (TIDAK lewat dispatcher generik)
  main/        <- menu, ping, stats, rules, carifitur
  tools/       <- qrcode, removebg, upscale, ipwho, nikparser, dnslookup, pastebin, dll
  canvas/      <- fakeff, fakeml, fakestory, topixel, quotesv1, dll (generator gambar)
  ai/          <- gpt5, deepseek, qwen3, claudehaiku, txt2img, img2img, img2prompt, persona

lib/
  pluginLoader.js   <- scanner otomatis semua folder di /plugins
  utils.js          <- helper umum (fetch, buffer<->dataURL, dll)
  engine/           <- engine generik yang dipakai banyak plugin sekaligus
    imageApi.js        (pola "generate gambar dari API")
    aiChatModel.js      (pola "chat ke satu model AI")
  scrapers/         <- scraper murni hasil port dari src/scraper/ bot WA (ESM -> CommonJS)
    downloader/  ai/  image/  misc/

api/
  run.js       <- SATU endpoint generik untuk menjalankan SEMUA plugin di atas
  menu.js      <- mengembalikan daftar semua plugin+kategori (dipakai UI)
```

## Cara kerja

1. **Loader** (`lib/pluginLoader.js`) membaca semua file `.js` di `plugins/<kategori>/`, memvalidasi
   bahwa tiap file punya `config` + `run()`, lalu mendaftarkannya ke satu registry (nama command -> plugin).
2. **Dispatcher** (`api/run.js`) adalah satu-satunya endpoint HTTP yang dipanggil untuk menjalankan
   plugin apapun: `POST /api/run` dengan body `{ command, text, imageBase64 }`.
   Artinya nambah plugin baru **tidak perlu bikin file `api/xxx.js` baru** — cukup taruh file
   plugin baru di folder kategori yang sesuai.
3. **Frontend**: tombol bulat 🔌 di kanan-bawah `index.html` membuka panel yang fetch `/api/menu`,
   menampilkan semua plugin per kategori, lalu ada form kecil (teks/gambar) buat menjalankannya lewat `/api/run`.

## Kontrak plugin

```js
// plugins/<kategori>/<nama>.js
module.exports = {
  config: {
    name: 'qrcode',          // nama command, wajib unik
    alias: ['qr'],           // alias opsional
    category: 'tools',       // idealnya sama dengan nama folder
    description: '...',
    usage: '/qrcode <teks>',
    example: '/qrcode https://google.com',
    inputType: 'text',       // 'text' | 'image' | 'text+image' | 'none'
    outputType: 'image',     // 'image' | 'text' | 'audio' | 'file' | 'json'
  },
  run: async ({ text, args, imageBuffer, imageMime }) => {
    // return salah satu:
    // { type: 'text', text }
    // { type: 'image', buffer, mime, caption? }
    // { type: 'audio', buffer, mime }
    // { type: 'file', buffer, mime, filename }
    // { type: 'json', data }
    // lempar Error(pesan) kalau gagal -> otomatis jadi { ok:false, error }
  },
};
```

## Apa yang SUDAH di-porting (fokus tahap ini: tools, canvas, ai)

### `main/` (5)
menu, ping, stats, rules, carifitur — utilitas dasar buat browsing plugin itu sendiri.

### `tools/` (16)
qrcode (generate lokal), removebg, upscale (HD 2x), ipwho (IP lookup), nikparser (parsing NIK KTP,
dihitung lokal), dnslookup/whois, pastebin (upload & baca paste), kalkulatormbg (kalkulator dana
publik, murni matematika), caribug (AI code review), cjstoesm & esmtocjs (converter module JS),
hitungwrmlbb (kalkulator winrate, murni matematika), carbon (kode jadi gambar), ssweb (screenshot
website), tempmail (email sementara), dafont (cari font).

### `canvas/` (12)
fakeff (fake lobby Free Fire — **contoh yang kamu minta**), fakeml, balogo, watercolortext, iqc,
musiccard, animequotes, starboy, pakustad, topixel (pixel art, dirender lokal pakai
`@napi-rs/canvas`), fakestory (kartu ala IG story, dirender lokal), quotesv1.

### `ai/` (8)
gpt5, deepseek (mode reasoning), qwen3, claudehaiku (semua model AI teks gratis tanpa API key),
txt2img (text-to-image pakai FLUX, ada auto-moderation dari upstream), img2img (edit gambar pakai
AI), img2prompt (tebak prompt dari gambar), persona (chat dengan karakter AI **fiksi**).

## Apa yang SENGAJA TIDAK di-porting, dan kenapa

- **Fitur murni WhatsApp**: hidetag, tagall, antilink, afk, ping-versi-WA, kick/promote/demote,
  broadcast grup, dll — semuanya butuh protokol Baileys/session WA yang tidak ada konsepnya di web.
- **`fakebankjago`, `fakedana`, `fakegopay`, `fakeovo`** (generator bukti transfer palsu) — ini
  berpotensi disalahgunakan untuk **penipuan online** (bukti transfer palsu ke penjual), jadi
  sengaja tidak dibuatkan.
- **`fakecall`, `qwa`, `tiktokchat`** (generator screenshot palsu yang meniru UI asli WA/TikTok
  dengan percakapan buatan) — berisiko dipakai untuk fabrikasi "bukti" percakapan/panggilan yang
  tidak pernah terjadi.
- **`rvo`, `sendngl`/`spamngl`, `ttboost`, `reactchannel`, `izen`** — fitur bypass privasi (view-once),
  spam, manipulasi engagement palsu, dan bypass proteksi shortlink. Semuanya berpotensi disalahgunakan.
- **2 persona AI di `unlimitedai` yang meniru tokoh politik nyata** (mantan & Presiden RI) sudah
  diganti jadi karakter fiksi netral — supaya tidak menghasilkan kutipan palsu atas nama orang nyata.
- **`musikapaini`, `videotranscribe`, sebagian `hd2/hd3/hd4/hdvid/wink`** — butuh API key
  berbayar milik developer bot aslinya atau butuh FFmpeg biner yang berat untuk serverless;
  di-skip di tahap ini untuk fokus ke kualitas daripada kuantitas.
- **Kategori lain** (games, fun, download, search, cek, info, random, religi, primbon, sticker) —
  BELUM digarap di tahap ini sesuai request kamu ("fokus tools, canvas, ai dulu"). Foldernya sudah
  disiapkan kosong di `/plugins`, tinggal lanjut kapan-kapan.

## Environment variables opsional

Beberapa plugin butuh API key sendiri (daftar gratis di masing-masing servicenya), taruh di `.env`:

```
CUKI_API_KEY=          # buat /caribug, beberapa canvas (opsional, ada default publik)
PASTEBIN_API_KEY=      # buat /pastebin mode upload (pastebin.com/doc_api)
QUIZ_SECRET=           # buat game tebak-tebakan stateless (dipakai kalau kategori games digarap nanti)
```

## Cara install & jalanin

```bash
npm install
vercel dev      # atau npm run dev kalau ada, sesuai setup Vercel kamu
```

Dependency baru yang ditambahkan ke `package.json`: `axios`, `cheerio`, `form-data`, `mime-types`,
`tough-cookie`, `axios-cookiejar-support`, `gsmarena-api`, `qrcode`, `@napi-rs/canvas`.

> Catatan: sandbox pembuatan project ini tidak punya akses internet, jadi seluruh plugin sudah
> lolos `node --check` (syntax valid) dan plugin loader sudah dites bisa mendaftarkan semua
> plugin tanpa bentrok nama — tapi panggilan ke API eksternal (misalnya hasil gambar dari
> `/fakeff`) belum bisa dites end-to-end di sini. Kalau ada endpoint upstream yang berubah/mati,
> tinggal edit URL-nya di file plugin terkait.
