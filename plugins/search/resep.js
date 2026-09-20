// plugins/search/resep.js — cari resep masakan indonesia
module.exports = {
  config: {
    name: 'resep', alias: ['cariresep', 'masak'],
    category: 'search',
    description: 'Cari resep masakan lengkap (bahan + langkah)',
    usage: '@resep <nama masakan>', example: '@resep rendang',
    inputType: 'text', outputType: 'text',
  },
  run: async ({ text }) => {
    if (!text.trim()) { const e = new Error('masakannya apa, contoh: @resep rendang'); e.status = 400; throw e; }
    const res = await fetch(`https://api.nexray.eu.cc/search/resep?q=${encodeURIComponent(text.trim())}`, { signal: AbortSignal.timeout(20000) });
    const d = await res.json();
    if (!d.status || !Array.isArray(d.result) || !d.result.length) throw new Error(`resep "${text.trim()}" gak ketemu`);
    const r = d.result[0];
    const lain = d.result.slice(1, 5).map((x) => `• ${x.judul}`).join('\n');
    return {
      type: 'text',
      text: `🍳 *${r.judul}*
⏱ ${r.waktu_masak || '-'} · 🍽 ${r.hasil || '-'} · 📊 ${r.tingkat_kesulitan || '-'}

*BAHAN:*
${r.bahan}

*LANGKAH:*
${r.langkah_langkah}
${lain ? `\n_resep lain:_\n${lain}` : ''}`,
    };
  },
};
