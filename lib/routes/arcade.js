// lib/routes/arcade.js — game HTML (GenAI HTML player bot → iframe web)
//   GET /api/arcade                → daftar game
//   GET /api/arcade?game=key&name=Nama → { ok, html }
const ARCADE = require('../arcade');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();
  try {
    const u = new URL(req.url, 'http://x');
    const game = u.searchParams.get('game');
    if (!game) {
      return res.status(200).json({ ok: true, games: Object.values(ARCADE).map((m) => m.config) });
    }
    const mod = ARCADE[game];
    if (!mod) return res.status(404).json({ error: 'game arcade gak ada' });
    const name = (u.searchParams.get('name') || 'Player').slice(0, 24);
    return res.status(200).json({ ok: true, html: mod.build({ playerName: name }) });
  } catch (e) {
    return res.status(500).json({ error: { message: e.message } });
  }
};
