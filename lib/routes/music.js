// api/music.js — music player backend (Spotify-style)
//   GET /api/music/search?q=judul       → hasil lagu (piped)
//   GET /api/music/stream?id=VIDEOID    → URL mp3 (azbry) + naikin play count
//   GET /api/music/lyrics?title=&artist= → lirik (lrclib)
//   POST {action:'data', token}          → favorites + playlists + playcount user
//   POST {action:'fav', token, song}     → toggle favorite
//   POST {action:'playlist-create', token, name}
//   POST {action:'playlist-add', token, name, song}
//   POST {action:'playlist-remove', token, name, song}
//   POST {action:'playlist-delete', token, name}
//   POST {action:'rename', token, name}  → ganti nama user
const { readDb, withDbWrite, openToken } = require('../../lib/db');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    /* ── SEARCH ── */
    if (req.method === 'GET' && req.url.startsWith('/api/music/search')) {
      const q = new URL(req.url, 'http://x').searchParams.get('q') || '';
      if (!q.trim()) return res.status(400).json({ error: 'query kosong' });
      const s = await fetch(`https://api.piped.private.coffee/search?q=${encodeURIComponent(q)}&filter=videos`, { signal: AbortSignal.timeout(20000) });
      const sd = await s.json();
      const items = (sd.items || []).filter((x) => x.type === 'stream').slice(0, 20).map((x) => ({
        id: String(x.url).split('v=')[1],
        title: x.title, artist: x.uploader || '-', duration: x.duration,
        thumb: x.thumbnail,
      }));
      return res.status(200).json({ ok: true, items });
    }

    /* ── STREAM (mp3 + play count) ── */
    if (req.method === 'GET' && req.url.startsWith('/api/music/stream')) {
      const id = new URL(req.url, 'http://x').searchParams.get('id') || '';
      if (!/^[\w-]{6,20}$/.test(id)) return res.status(400).json({ error: 'id gak valid' });
      const d = await fetch(`https://api.azbry.com/api/download/ytmp3?url=${encodeURIComponent('https://www.youtube.com/watch?v=' + id)}`, { signal: AbortSignal.timeout(45000) });
      const dd = await d.json();
      if (!dd.status || !dd.result || !dd.result.download) return res.status(502).json({ error: 'lagu gak bisa di-stream, coba yang lain' });
      const r = dd.result;
      return res.status(200).json({
        ok: true, url: r.download, title: r.title, duration: r.duration, thumb: r.thumbnail,
      });
    }

    /* ── LYRICS ── */
    if (req.method === 'GET' && req.url.startsWith('/api/music/lyrics')) {
      const u = new URL(req.url, 'http://x');
      const title = u.searchParams.get('title') || '';
      const artist = u.searchParams.get('artist') || '';
      if (!title) return res.status(400).json({ error: 'judul kosong' });
      const lr = await fetch(`https://lrclib.net/api/get?track_name=${encodeURIComponent(title)}&artist_name=${encodeURIComponent(artist)}`,
        { headers: { 'User-Agent': 'LRCGET (github.com/tranxuanthang/lrcget)' }, signal: AbortSignal.timeout(12000) });
      if (!lr.ok) return res.status(404).json({ error: 'lirik gak ketemu' });
      const ld = await lr.json();
      const plain = ld.plainLyrics || (ld.syncedLyrics || '').replace(/\[[^\]]*\]/g, '').trim();
      if (!plain) return res.status(404).json({ error: 'lirik gak ketemu' });
      return res.status(200).json({ ok: true, lyrics: plain, synced: !!ld.plainLyrics ? null : ld.syncedLyrics });
    }

    if (req.method !== 'POST') return res.status(405).json({ error: 'method gak didukung' });

    /* ── data user (butuh login) ── */
    const { action, token, song, name, songTitle, songId } = req.body || {};
    const t = openToken(token);
    if (!t) return res.status(401).json({ error: 'login dulu buat pakai fitur ini' });

    const ensureMusic = (db) => {
      if (!db.music) db.music = {};
      if (!db.music[t.uid]) db.music[t.uid] = { favorites: [], playlists: {}, plays: {} };
      return db.music[t.uid];
    };
    const cleanSong = (s) => ({
      id: String(s.id || '').slice(0, 24), title: String(s.title || 'lagu').slice(0, 120),
      artist: String(s.artist || '-').slice(0, 80), thumb: String(s.thumb || '').slice(0, 300),
      duration: Number(s.duration) || 0,
    });

    if (action === 'data') {
      const { db } = await readDb();
      const m = (db.music || {})[t.uid] || { favorites: [], playlists: {}, plays: {} };
      /* top lagu: sort by play count */
      const top = Object.entries(m.plays || {}).map(([id, n]) => ({ ...(m.playsMeta || {})[id], id, plays: n })).filter((x) => x.title).sort((a, b) => b.plays - a.plays).slice(0, 10);
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
      return res.status(200).json({ ok: true, favorited: favd === true ? true : false });
    }

    if (action === 'play') {
      /* naikin counter putar */
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
