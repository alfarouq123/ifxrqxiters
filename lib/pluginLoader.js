// lib/pluginLoader.js
//
// Plugin loader generik buat semua fitur di folder /plugins.
// Struktur foldernya sengaja dibikin mirip bot WA aslinya:
//
//   plugins/
//     main/       -> menu, ping, stats, dll
//     tools/      -> qr, ocr, removebg, dll
//     games/      -> tebak-tebakan, kuis, dll
//     canvas/     -> generator gambar/quotes/efek teks
//     fun/        -> generator teks receh/random
//     download/   -> downloader youtube/tiktok/ig/dll
//     ai/         -> berbagai model AI text/image
//     search/     -> pencarian (wikipedia, npm, dll)
//     cek/        -> "cek sifat" random generator
//     info/       -> info publik (gempa, cuaca, dll)
//     random/     -> random meme/quotes/gambar
//     religi/     -> quran, jadwal sholat, dll
//     primbon/    -> zodiak, ramalan, dll
//     sticker/    -> maker gambar/teks bergaya sticker
//
// Setiap file plugin WAJIB export:
//   module.exports = {
//     config: {
//       name: 'fakeff',            // nama command utama (unik, huruf kecil)
//       alias: ['fakefreefire'],   // alias opsional
//       category: 'canvas',        // harus sama dengan nama folder
//       description: '...',
//       usage: '/fakeff <nama>',
//       example: '/fakeff IFxrq',
//       inputType: 'text',         // 'text' | 'image' | 'text+image' | 'none'
//       outputType: 'image',       // 'image' | 'text' | 'json' | 'audio' | 'file'
//       tags: ['image']            // opsional, buat pencarian
//     },
//     run: async (ctx) => { ... }  // lihat lib/pluginRunner.js buat kontrak return value
//   }

const fs = require('fs');
const path = require('path');

const PLUGINS_DIR = path.join(__dirname, '..', 'plugins');

const CATEGORY_META = {
  main:      { emoji: '🏠', label: 'Utama' },
  tools:     { emoji: '🛠️', label: 'Tools' },
  games:     { emoji: '🎮', label: 'Games' },
  canvas:    { emoji: '🎨', label: 'Canvas / Maker Gambar' },
  fun:       { emoji: '🎲', label: 'Fun' },
  download:  { emoji: '📥', label: 'Download' },
  ai:        { emoji: '🤖', label: 'AI' },
  search:    { emoji: '🔍', label: 'Search' },
  cek:       { emoji: '📋', label: 'Cek-Cekan' },
  info:      { emoji: 'ℹ️', label: 'Info' },
  random:    { emoji: '🎰', label: 'Random' },
  religi:    { emoji: '🕌', label: 'Religi' },
  primbon:   { emoji: '🔮', label: 'Primbon' },
  sticker:   { emoji: '🖼️', label: 'Sticker / Maker' },
  'ai-core': { emoji: '💬', label: 'AI Core (chat utama)' },
};

let _cache = null;

function isPluginFile(filename) {
  return filename.endsWith('.js') && !filename.startsWith('_');
}

function loadAll({ force = false } = {}) {
  if (_cache && !force) return _cache;

  const byCommand = new Map();
  const byCategory = new Map();
  const all = [];
  const errors = [];

  let categories = [];
  try {
    categories = fs.readdirSync(PLUGINS_DIR).filter((f) =>
      fs.statSync(path.join(PLUGINS_DIR, f)).isDirectory()
    );
  } catch (e) {
    errors.push({ file: PLUGINS_DIR, error: e.message });
    categories = [];
  }

  for (const category of categories) {
    if (category === 'ai-core') continue; // ai-core dipakai langsung oleh api/chat.js dkk, bukan lewat dispatcher generik
    const dir = path.join(PLUGINS_DIR, category);
    let files = [];
    try {
      files = fs.readdirSync(dir).filter(isPluginFile);
    } catch (e) {
      continue;
    }

    const list = [];

    for (const file of files) {
      const full = path.join(dir, file);
      try {
        delete require.cache[require.resolve(full)];
        const mod = require(full);
        if (!mod || !mod.config || typeof mod.run !== 'function') {
          errors.push({ file: full, error: 'plugin tidak punya config/run yang valid' });
          continue;
        }
        const cfg = mod.config;
        if (!cfg.name) {
          errors.push({ file: full, error: 'config.name kosong' });
          continue;
        }
        cfg.category = cfg.category || category;
        const entry = { ...mod, filePath: full };

        const names = [cfg.name, ...(cfg.alias || [])].map((n) => String(n).toLowerCase());
        for (const n of names) {
          if (byCommand.has(n)) {
            errors.push({ file: full, error: `command "${n}" bentrok, sudah dipakai plugin lain` });
            continue;
          }
          byCommand.set(n, entry);
        }

        list.push(entry);
        all.push(entry);
      } catch (e) {
        errors.push({ file: full, error: e.message });
      }
    }

    list.sort((a, b) => a.config.name.localeCompare(b.config.name));
    if (list.length) byCategory.set(category, list);
  }

  _cache = { byCommand, byCategory, all, errors, categoryMeta: CATEGORY_META };
  return _cache;
}

function getPlugin(command) {
  const { byCommand } = loadAll();
  return byCommand.get(String(command || '').toLowerCase()) || null;
}

function getCategories() {
  const { byCategory } = loadAll();
  return [...byCategory.keys()];
}

function getManifest() {
  const { byCategory, all, errors } = loadAll();
  const categories = [...byCategory.entries()].map(([key, plugins]) => ({
    key,
    ...(CATEGORY_META[key] || { emoji: '📦', label: key }),
    count: plugins.length,
    plugins: plugins.map((p) => ({
      name: p.config.name,
      alias: p.config.alias || [],
      description: p.config.description || '',
      usage: p.config.usage || `/${p.config.name}`,
      example: p.config.example || '',
      inputType: p.config.inputType || 'text',
      outputType: p.config.outputType || 'text',
      tags: p.config.tags || [],
    })),
  }));
  categories.sort((a, b) => a.label.localeCompare(b.label));
  return {
    totalPlugins: all.length,
    totalCategories: categories.length,
    categories,
    loadErrors: errors,
  };
}

module.exports = { loadAll, getPlugin, getCategories, getManifest, PLUGINS_DIR, CATEGORY_META };
