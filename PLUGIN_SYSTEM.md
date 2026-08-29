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

## ⚠️ FIX PENTING (update ini): prefix HARUS "@", bukan "/"

Sebelumnya ada bug: mekanisme dispatch di `index.html` cuma ngenalin prefix **"@"**, tapi teks
`usage`/`example` di 65+ file plugin (dan output `@menu`, `@carifitur`) masih nulis contoh pakai
**"/"** — jadi kalau user ngetik `/fakeff ...` beneran gak kepanggil apa-apa dan otomatis jatuh ke
chat AI biasa. Ini yang bikin "plugin belum masuk ke @".

Yang sudah diperbaiki:
1. **Semua `config.usage` / `config.example` di 79 plugin** (dan di 3 file engine generik:
   `lib/engine/randomAnswer.js`, `lib/engine/aiChatModel.js`, `lib/engine/quizGame.js`) diganti dari
   `/nama` jadi `@nama`.
2. **Semua pesan error/instruksi di dalam `run()`** yang sebelumnya nyebut `/nama` (misal
   `"contoh: /qrcode ..."`) juga diganti ke `@nama`.
3. **`plugins/main/menu.js`** dan **`plugins/main/carifitur.js`** — output teksnya sekarang nampilin
   `@nama` bukan `/nama`.
4. **Bug race-condition di `index.html`**: sebelumnya kalau plugin dinamis (`/api/menu`) belum
   selesai di-fetch pas user ngetik `@`, dropdown tetap muncul isinya cuma 7 command bawaan
   (search/edit/play/dst) — jadi user ngira "plugin baru gak ada". Sekarang `triggerMentionCheck()`
   otomatis coba `loadDynamicPlugins()` ulang kalau belum sukses, dan dropdown/menu "+" auto-refresh
   begitu selesai.
5. Ditambah `console.log`/`console.error` di browser console pas plugin berhasil/gagal di-load dari
   `/api/menu` — buka DevTools (F12) > Console kalau mau debug kenapa plugin gak muncul.

**Cara pakai yang BENAR sekarang:** ketik `@` di kolom chat → dropdown nongol → ketik beberapa huruf
nama plugin (misal `@fakeff`) → pilih dari dropdown ATAU lanjut ketik argumennya langsung setelah
nama plugin → kirim. **Jangan pakai `/`**, itu gak dikenali sama sekali dan bakal dianggap chat
biasa ke AI.

Kalau setelah update ini plugin masih belum muncul pas ketik `@`, kemungkinan penyebabnya:
- Belum `npm install` ulang / belum redeploy setelah replace file-file baru.
- Folder `/plugins`, `/lib`, `/api/menu.js`, `/api/run.js` gak ke-upload semua (pastikan struktur
  foldernya lengkap sama kayak di zip).
- Buka DevTools Console di browser, cek ada log `[plugin] berhasil load...` atau `[plugin] gagal
  load...` — itu bakal kasih tau persis penyebabnya (misal `/api/menu` 404 atau 500).

## Apa yang SUDAH di-porting (update terbaru — 87 plugin di 11 kategori)

### `main/` (5)
menu, ping, stats, rules, carifitur — utilitas dasar buat browsing plugin itu sendiri.

### `tools/` (16)
qrcode (generate lokal), removebg, upscale (HD 2x), ipwho (IP lookup), nikparser (parsing NIK KTP,
dihitung lokal), dnslookup/whois, pastebin (upload & baca paste), kalkulatormbg (kalkulator dana
publik, murni matematika), caribug (AI code review), cjstoesm & esmtocjs (converter module JS),
hitungwrmlbb (kalkulator winrate, murni matematika), carbon (kode jadi gambar), ssweb (screenshot
website), tempmail (email sementara), dafont (cari font).

### `canvas/` (12)
fakeff (fake lobby Free Fire), fakeml, balogo, watercolortext, iqc, musiccard, animequotes, starboy,
pakustad, topixel (pixel art, dirender lokal pakai `@napi-rs/canvas`), fakestory (kartu ala IG story,
dirender lokal), quotesv1.

### `ai/` (8)
gpt5, deepseek (mode reasoning), qwen3, claudehaiku (semua model AI teks gratis tanpa API key),
txt2img (text-to-image pakai FLUX, ada auto-moderation dari upstream), img2img (edit gambar pakai
AI), img2prompt (tebak prompt dari gambar), persona (chat dengan karakter AI **fiksi**).

### `games/` (9) — BARU
tebakbendera, tebakkata, family100, caklontong, tebaktebakan, tebakhewan, tebaknegara, tebakmakanan,
susunkata. Semua **stateless** (gak butuh session/database) — pas mulai ronde, nomor soal
dikembalikan ke kamu, terus balas dengan format `/namagame <no_soal>|<jawabanmu>`. Datanya asli dari
bot WA (`src/data/*.json`, sudah dipindah ke `lib/data/`).

### `fun/` (15) — BARU
akankah, apakah, bagaimana, berapa, bisakah, dimana, haruskah, kapan, mengapa, siapa (generator
jawaban random ala magic-8-ball), rate, truth, dare, bucin, cekkhodam.

### `search/` (3) — BARU
wikipedia, npm (cari package Node.js), resep (cari resep masakan).

### `info/` (2) — BARU
gempa (data real-time BMKG), harilibur (hari libur nasional per tahun).

### `random/` (3) — BARU
meme (Reddit, difilter NSFW), quotesimage (quote motivasi), wallpaper (Unsplash).

### `religi/` (3) — BARU
quran (ayat + terjemahan), jadwalsholat (per kota), asmaulhusna (random dari 99 nama).

### `primbon/` (3) — BARU
zodiak (dari tanggal lahir), artinama (karakter dari nama, hasil konsisten), tafsirmimpi (tafsir
berdasarkan kata kunci).

### `download/` (8) — BARU
youtube (audio mp3/video mp4), tiktok (tanpa watermark), instagram, twitter/x, facebook, mediafire,
terabox, reddit. Semua pakai scraper murni dari `lib/scrapers/downloader/` (hasil port bot WA).

## Kategori yang MASIH KOSONG (folder sudah disiapkan)
`cek/`, `sticker/` — belum digarap, giliran berikutnya kalau kamu mau lanjut.

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
- **Kategori lain** (cek, download, sticker) — BELUM digarap di fase ini. Foldernya sudah
  disiapkan kosong di `/plugins`, tinggal lanjut kapan-kapan.

## Fix penting di update ini: integrasi ke sistem "@" yang sudah ada

Sebelumnya plugin baru cuma bisa diakses lewat panel floating "🔌 Plugins", **belum nyambung** ke
sistem `@command` yang sudah ada di chat (yang dipakai buat `@search`, `@edit`, dst). Ini sudah
diperbaiki:

1. `index.html` sekarang fetch `/api/menu` sekali pas halaman dibuka (`loadDynamicPlugins()`),
   lalu semua 79 plugin baru otomatis didaftarkan ke array `PLUGIN_MENU` yang sama dipakai buat
   dropdown "@" dan menu "+".
2. Ketik `@` di kolom chat sekarang bakal nampilin plugin bawaan (search, edit, dst) **dan**
   semua plugin baru (fakeff, tebakbendera, gpt5, qrcode, dst) — plus alias-nya masing-masing.
3. Ditambah fungsi `runGenericPlugin()` di `index.html` yang otomatis dipanggil kalau kamu ketik
   `@namaplugin ...` dan nama itu bukan salah satu command bawaan — dia yang urus kirim ke
   `/api/run`, render hasilnya (gambar/teks/audio/file), dan simpan ke history chat.
4. Dropdown & menu "+" sekarang bisa di-scroll (`max-height` + `overflow-y:auto`) karena
   isinya udah puluhan item, bukan cuma 7 kayak sebelumnya.

**Cara pakai sekarang:** ketik `@` aja di kolom chat → ketik beberapa huruf nama plugin (misal
`@fakeff` atau `@tebakbendera`) → pilih dari dropdown atau lanjut ketik argumennya langsung →
kirim. Panel floating "🔌 Plugins" tetap ada sebagai cara alternatif buat browse semua plugin per
kategori kalau kamu lupa nama command-nya.

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
