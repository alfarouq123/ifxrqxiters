// plugins/search/spotify.js — cari lagu di Spotify
module.exports = {
  config: {
    name: 'spotify', alias: ['sp', 'spotifysearch'],
    category: 'search',
    description: 'Cari lagu/track di Spotify (judul, artis, link)',
    usage: '@spotify <judul lagu>', example: '@spotify lathi',
    inputType: 'text', outputType: 'text',
  },
  run: async ({ text }) => {
    if (!text.trim()) { const e = new Error('judulnya kosong, contoh: @spotify lathi'); e.status = 400; throw e; }
    const res = await fetch(`https://api.nexray.eu.cc/search/spotify?q=${encodeURIComponent(text.trim())}`, { signal: AbortSignal.timeout(20000) });
    const d = await res.json();
    if (!d.status || !Array.isArray(d.result) || !d.result.length) throw new Error('gak ketemu di spotify');
    const list = d.result.slice(0, 8).map((t, i) =>
      `${i + 1}. *${t.title}* — ${t.artist || '-'}\n   ⏱ ${t.duration || '-'} · 💽 ${t.album || '-'} (${(t.release_date || '').slice(0, 4)})\n   🔗 ${t.url}`
    ).join('\n\n');
    return { type: 'text', text: `🎧 *Hasil Spotify: "${text.trim()}"*\n\n${list}` };
  },
};
