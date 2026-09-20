// api/menu.js — daftar semua plugin buat panel ⚙️ di web
const { getManifest } = require('../../lib/pluginLoader');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'pake GET' });

  try {
    const manifest = getManifest();
    return res.status(200).json({ ok: true, ...manifest });
  } catch (err) {
    return res.status(500).json({ error: { message: err.message } });
  }
};
