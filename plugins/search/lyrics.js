// plugins/search/lyrics.js — lirik lagu (plain, gampang dibaca)
module.exports = {
  config: {
    name: 'lyrics', alias: ['lirik', 'liriklagu'],
    category: 'search',
    description: 'Cari lirik lagu',
    usage: '@lyrics <judul lagu>', example: '@lyrics komang',
    inputType: 'text', outputType: 'text',
  },
  run: async ({ text }) => {
    if (!text.trim()) { const e = new Error('judulnya kosong, contoh: @lyrics komang'); e.status = 400; throw e; }
    const res = await fetch(`https://api.nexray.eu.cc/search/lyrics?q=${encodeURIComponent(text.trim())}`, { signal: AbortSignal.timeout(20000) });
    const d = await res.json();
    const r = d.result || {};
    const lyr = (r.lyrics && (r.lyrics.plain_lyrics || r.lyrics.plainLyrics)) || r.plain_lyrics || r.lyrics_text || '';
    if (!d.status || !lyr) throw new Error(`lirik "${text.trim()}" gak ketemu`);
    return { type: 'text', text: `🎵 *${r.title || text.trim()}* — ${r.artist || '-'}\n\n${String(lyr).slice(0, 3500)}` };
  },
};
