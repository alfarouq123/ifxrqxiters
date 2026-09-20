// api music route — sumber metadata SPOTIFY via spotsaver (persis play.js v7):
//   search → judul & artis bersih + album + durasi + cover (CDN deezer/spotify)
//   audio  → auto-match judul+artis+durasi ke video YT (piped) → azbry ytmp3
//   lirik  → lrclib pakai judul+artis+album+durasi
const { readDb, withDbWrite, openToken } = require('../db');

const SPOTSAVER = 'https://spotsaver.net/api/spotify/';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    /* ── SEARCH (spotify via spotsaver) ── */
    if (req.method === 'GET' && req.url.startsWith('/api/music/search')) {
      const q = new URL(req.url, 'http://x').searchParams.get('q') || '';
      if (!q.trim()) return res.status(400).json({ error: 'query kosong' });
      const r = await fetch(SPOTSAVER + '?q=' + encodeURIComponent(q), {
        headers: { 'User-Agent': UA, Accept: 'application/json' },
        signal: AbortSignal.timeout(15000),
      });
      if (!r.ok) return res.status(502).json({ error: 'spotify search gagal (' + r.status + ')' });
      const d = await r.json();
      const items = (d.items || []).slice(0, 20).map((t) => ({
        id: t.id,
        title: t.title, artist: t.artist, album: t.album || '',
        duration: Number(t.duration) || 0,
        thumb: t.thumbnail || '',
      }));
      return res.status(200).json({ ok: true, items });
    }

    /* ── STREAM: auto-match by judul+artis+durasi (persis cariAudioMatch play.js) ── */
    if (req.method === 'GET' && req.url.startsWith('/api/music/stream')) {
      const u = new URL(req.url, 'http://x');
      const title = u.searchParams.get('title') || '';
      const artist = u.searchParams.get('artist') || '';
      const dur = Number(u.searchParams.get('dur')) || 0;
      if (!title) return res.status(400).json({ error: 'judul kosong' });

      const norm = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
      const s = await fetch(`https://api.piped.private.coffee/search?q=${encodeURIComponent((title + ' ' + artist).trim())}&filter=videos`, { signal: AbortSignal.timeout(20000) });
      const sd = await s.json();
      let vids = (sd.items || []).filter((x) => x.type === 'stream' && Number(x.duration) > 0);
      if (!vids.length) return res.status(502).json({ error: 'audio gak ketemu — coba lagu lain' });

      /* skor: selisih durasi + kemiripan judul - popularitas (persis play.js) */
      const tNorm = norm(title);
      let best = null, bestSkor = Infinity;
      for (const v of vids.slice(0, 10)) {
        const d = Number(v.duration) || 0;
        const selisih = dur > 0 ? Math.abs(d - dur) : 0;
        const mirip = norm(v.title).includes(tNorm) ? 0 : 60;
        const skor = selisih + mirip - Math.min(10, (v.views || 0) / 1e5);
        if (skor < bestSkor) { bestSkor = skor; best = v; }
      }
      best = best || vids[0];
      const vid = String(best.url).split('v=')[1];

      const d = await fetch(`https://api.azbry.com/api/download/ytmp3?url=${encodeURIComponent('https://www.youtube.com/watch?v=' + vid)}`, { signal: AbortSignal.timeout(45000) });
      const dd = await d.json();
      if (!dd.status || !dd.result || !dd.result.download) return res.status(502).json({ error: 'mp3 gak bisa diambil — coba lagi / lagu lain' });
      return res.status(200).json({ ok: true, url: dd.result.download, duration: dd.result.duration || best.duration, title, artist });
    }

    /* ── LYRICS: judul+artis+album+durasi (persis play.js) ── */
    if (req.method === 'GET' && req.url.startsWith('/api/music/lyrics')) {
      const u = new URL(req.url, 'http://x');
      const title = u.searchParams.get('title') || '';
      const artist = u.searchParams.get('artist') || '';
      const album = u.searchParams.get('album') || '';
      const dur = Number(u.searchParams.get('dur')) || 0;
      if (!title) return res.status(400).json({ error: 'judul kosong' });
      const H = { 'User-Agent': 'LRCGET (github.com/tranxuanthang/lrcget)' };
      let lr = null;
      if (album || dur) {
        const qs = new URLSearchParams({ track_name: title, artist_name: artist });
        if (album) qs.set('album_name', album);
        if (dur) qs.set('duration', String(Math.round(dur)));
        lr = await fetch('https://lrclib.net/api/get?' + qs, { headers: H, signal: AbortSignal.timeout(12000) }).catch(() => null);
      }
      if (!lr || !lr.ok) {
        lr = await fetch('https://lrclib.net/api/get?track_name=' + encodeURIComponent(title) + '&artist_name=' + encodeURIComponent(artist), { headers: H, signal: AbortSignal.timeout(12000) }).catch(() => null);
      }
      if (!lr || !lr.ok) return res.status(404).json({ error: 'lirik gak ketemu' });
      const ld = await lr.json();
      const plain = ld.plainLyrics || (ld.syncedLyrics || '').replace(/\[[^\]]*\]/g, '').trim();
      if (!plain) return res.status(404).json({ error: 'lirik gak ketemu' });
      return res.status(200).json({ ok: true, lyrics: plain, synced: ld.syncedLyrics || null });
    }

    if (req.method !== 'POST') return res.status(405).json({ error: 'method gak didukung' });

    /* ── data user (butuh login) ── */
    const { action, token, song, name, songId } = req.body || {};
    const t = openToken(token);
    if (!t) return res.status(401).json({ error: 'login dulu buat pakai fitur ini' });

    const ensureMusic = (db) => {
      if (!db.music) db.music = {};
      if (!db.music[t.uid]) db.music[t.uid] = { favorites: [], playlists: {}, plays: {} };
      return db.music[t.uid];
    };
    const cleanSong = (s) => ({
      id: String(s.id || '').slice(0, 40), title: String(s.title || 'lagu').slice(0, 120),
      artist: String(s.artist || '-').slice(0, 80), album: String(s.album || '').slice(0, 80),
      thumb: String(s.thumb || '').slice(0, 300), duration: Number(s.duration) || 0,
    });

    if (action === 'data') {
      const { db } = await readDb();
      const m = (db.music || {})[t.uid] || { favorites: [], playlists: {}, plays: {} };
      const agg = {};
      for (const uid of Object.keys(db.music || {})) {
        const um = db.music[uid] || {};
        for (const [id, n] of Object.entries(um.plays || {})) {
          if (!agg[id]) agg[id] = { id, plays: 0, meta: null };
          agg[id].plays += n;
          agg[id].meta = agg[id].meta || (um.playsMeta || {})[id] || null;
        }
      }
      const top = Object.values(agg).filter((x) => x.meta && x.meta.title)
        .map((x) => ({ ...x.meta, id: x.id, plays: x.plays }))
        .sort((a, b) => b.plays - a.plays).slice(0, 10);
      return res.status(200).json({ ok: true, favorites: m.favorites || [], playlists: m.playlists || {}, top });
    }

    if (action === 'fav') {
      if (!song || !song.id) return res.status(400).json({ error: 'lagunya kosong' });
      const favd = await withDbWrite(async (db) => {
        const m = ensureMusic(db);
        const i = m.favorites.findIndex((f) => f.id === song.id);
        if (i >= 0) { m.favorites.splice(i, 1); return false; }
        m.favorites.unshift(cleanSong(song));
        if (m.favorites.length > 200) m.favorites.pop();
        return true;
      });
      return res.status(200).json({ ok: true, favorited: favd === true });
    }

    if (action === 'play') {
      await withDbWrite(async (db) => {
        const m = ensureMusic(db);
        if (!m.plays) m.plays = {};
        if (!m.playsMeta) m.playsMeta = {};
        const id = String(songId || song?.id || '');
        if (!id) return false;
        m.plays[id] = (m.plays[id] || 0) + 1;
        if (song?.title) m.playsMeta[id] = cleanSong(song);
        return true;
      });
      return res.status(200).json({ ok: true });
    }

    if (action === 'playlist-create') {
      const nm = String(name || '').trim().slice(0, 40);
      if (!nm) return res.status(400).json({ error: 'nama playlist kosong' });
      await withDbWrite(async (db) => {
        const m = ensureMusic(db);
        if (!m.playlists[nm]) m.playlists[nm] = [];
        return true;
      });
      return res.status(200).json({ ok: true, name: nm });
    }
    if (action === 'playlist-add') {
      const nm = String(name || '').trim().slice(0, 40);
      if (!nm || !song || !song.id) return res.status(400).json({ error: 'playlist/lagu kosong' });
      await withDbWrite(async (db) => {
        const m = ensureMusic(db);
        if (!m.playlists[nm]) m.playlists[nm] = [];
        if (!m.playlists[nm].some((s) => s.id === song.id)) m.playlists[nm].push(cleanSong(song));
        return true;
      });
      return res.status(200).json({ ok: true });
    }
    if (action === 'playlist-remove') {
      const nm = String(name || '').trim().slice(0, 40);
      await withDbWrite(async (db) => {
        const m = ensureMusic(db);
        if (m.playlists[nm]) m.playlists[nm] = (m.playlists[nm] || []).filter((s) => s.id !== songId);
        return true;
      });
      return res.status(200).json({ ok: true });
    }
    if (action === 'playlist-delete') {
      const nm = String(name || '').trim().slice(0, 40);
      await withDbWrite(async (db) => {
        const m = ensureMusic(db);
        delete m.playlists[nm];
        return true;
      });
      return res.status(200).json({ ok: true });
    }
    if (action === 'rename') {
      const nm = String(name || '').trim().slice(0, 40);
      if (!nm) return res.status(400).json({ error: 'nama kosong' });
      await withDbWrite(async (db) => {
        const u = Object.values(db.users).find((x) => x.uid === t.uid);
        if (u) u.name = nm;
        return true;
      });
      return res.status(200).json({ ok: true, name: nm });
    }

    return res.status(400).json({ error: 'action gak dikenal' });
  } catch (err) {
    return res.status(500).json({ error: { message: err.message } });
  }
};
