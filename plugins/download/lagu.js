// plugins/download/lagu.js — cari lagu → mp3 + lirik
// piped (search YT) → azbry ytmp3 (download) → lrclib (lirik)
const { getImage } = require('../../lib/engine/imageApi');
const fetchBuffer = async (url, ms = 90000) => {
  const res = await fetch(url, { signal: AbortSignal.timeout(ms) });
  if (!res.ok) throw new Error('download gagal http ' + res.status);
  return Buffer.from(await res.arrayBuffer());
};

module.exports = {
  config: {
    name: 'lagu', alias: ['play', 'carilagu', 'ytplay'],
    category: 'download',
    description: 'Cari lagu dari judul → langsung mp3 + lirik',
    usage: '@lagu <judul lagu>', example: '@lagu komang raim laode',
    inputType: 'text', outputType: 'audio',
  },
  run: async ({ text }) => {
    const q = text.trim();
    if (!q) { const e = new Error('judulnya kosong, contoh: @lagu komang'); e.status = 400; throw e; }

    /* 1. search YT via piped */
    const s = await fetch(`https://api.piped.private.coffee/search?q=${encodeURIComponent(q)}&filter=videos`, { signal: AbortSignal.timeout(20000) });
    const sd = await s.json();
    const items = (sd.items || []).filter((x) => x.type === 'stream');
    if (!items.length) throw new Error(`lagu "${q}" gak ketemu`);
    const first = items[0];
    const watchUrl = 'https://www.youtube.com/watch?v=' + String(first.url).split('v=')[1];

    /* 2. mp3 via azbry */
    const d = await fetch(`https://api.azbry.com/api/download/ytmp3?url=${encodeURIComponent(watchUrl)}`, { signal: AbortSignal.timeout(40000) });
    const dd = await d.json();
    if (!dd.status || !dd.result || !dd.result.download) throw new Error(dd.result?.title ? 'mp3-nya gak bisa diambil, coba judul lain' : 'downloader lagi down');
    const r = dd.result;
    const buffer = await fetchBuffer(r.download);

    /* 3. lirik via lrclib (bonus, kalau ada) */
    let caption = `🎵 ${r.title || first.title} (${r.duration ? Math.floor(r.duration / 60) + ':' + String(r.duration % 60).padStart(2, '0') : '-'})`;
    try {
      const art = (r.title || first.title || '').split(' - ')[0].trim();
      const track = (r.title || first.title || '').split(' - ').slice(1).join(' - ').trim() || (first.title || '');
      const lr = await fetch(`https://lrclib.net/api/get?track_name=${encodeURIComponent(track)}&artist_name=${encodeURIComponent(art)}`,
        { headers: { 'User-Agent': 'LRCGET (github.com/tranxuanthang/lrcget)' }, signal: AbortSignal.timeout(10000) });
      if (lr.ok) {
        const ld = await lr.json();
        const plain = ld.plainLyrics || (ld.syncedLyrics || '').replace(/\[[^\]]*\]/g, '').trim();
        if (plain) caption += '\n\n' + plain.slice(0, 1500);
      }
    } catch (_e) { /* lirik opsional */ }

    const safeTitle = String(r.title || 'lagu').replace(/[\\/:*?"<>|]/g, '').slice(0, 60);
    return { type: 'audio', buffer, mime: 'audio/mpeg', filename: safeTitle + '.mp3', caption };
  },
};
