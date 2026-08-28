const { getManifest } = require('../../lib/pluginLoader');

module.exports = {
  config: {
    name: 'carifitur',
    alias: ['findplugin', 'cariplugin'],
    category: 'main',
    description: 'Cari plugin berdasarkan nama/kata kunci',
    usage: '/carifitur <kata kunci>',
    example: '/carifitur foto',
    inputType: 'text',
    outputType: 'text',
  },
  run: async ({ text }) => {
    if (!text.trim()) {
      const e = new Error('kata kunci kosong, contoh: /carifitur foto');
      e.status = 400;
      throw e;
    }
    const kw = text.trim().toLowerCase();
    const manifest = getManifest();
    const found = [];
    for (const cat of manifest.categories) {
      for (const p of cat.plugins) {
        const hay = [p.name, ...(p.alias || []), p.description, ...(p.tags || [])].join(' ').toLowerCase();
        if (hay.includes(kw)) found.push({ ...p, category: cat.label, emoji: cat.emoji });
      }
    }
    if (!found.length) {
      return { type: 'text', text: `tidak ada plugin yang cocok dengan "${text.trim()}"` };
    }
    let txt = `🔎 Ditemukan ${found.length} plugin untuk "${text.trim()}":\n\n`;
    for (const p of found) {
      txt += `${p.emoji} */${p.name}* — ${p.description}\n`;
    }
    return { type: 'text', text: txt };
  },
};
