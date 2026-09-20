// plugins/search/pinterest.js — cari gambar di Pinterest
module.exports = {
  config: {
    name: 'pinterest', alias: ['pin', 'pint'],
    category: 'search',
    description: 'Cari gambar/foto di Pinterest, hasilnya link gambar langsung',
    usage: '@pinterest <kata kunci>', example: '@pinterest anime aesthetic',
    inputType: 'text', outputType: 'text',
  },
  run: async ({ text }) => {
    if (!text.trim()) { const e = new Error('kata kuncinya kosong, contoh: @pinterest anime'); e.status = 400; throw e; }
    const res = await fetch(`https://api.nexray.eu.cc/search/pinterest?q=${encodeURIComponent(text.trim())}`, { signal: AbortSignal.timeout(20000) });
    const d = await res.json();
    if (!d.status || !Array.isArray(d.result) || !d.result.length) throw new Error('gak ketemu di pinterest');
    const list = d.result.slice(0, 8).map((p, i) => `${i + 1}. ${p.images_url || p.pin}`).join('\n');
    return { type: 'text', text: `📌 *Pinterest: "${text.trim()}"* (top 8)\n\n${list}` };
  },
};
