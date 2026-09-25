// api/router.js — SATU serverless function buat SEMUA endpoint /api/*.
// (Vercel hobby dibatasi 12 function — makanya semua route digabung ke sini,
//  URL /api/chat, /api/run, dst tetap sama lewat rewrites di vercel.json)
const ROUTES = {
  '/api/arcade': require('../lib/routes/arcade'),
  '/api/auth': require('../lib/routes/auth'),
  '/api/berfikir': require('../lib/routes/berfikir'),
  '/api/chat': require('../lib/routes/chat'),
  '/api/code': require('../lib/routes/code'),
  '/api/edit': require('../lib/routes/edit'),
  '/api/games': require('../lib/routes/games'),
  '/api/hd': require('../lib/routes/hd'),
  '/api/menu': require('../lib/routes/menu'),
  '/api/music': require('../lib/routes/music'),
  '/api/play': require('../lib/routes/play'),
  '/api/run': require('../lib/routes/run'),
  '/api/studio': require('../lib/routes/studio'),
  '/api/football': require('../lib/routes/football'),
  '/api/search': require('../lib/routes/search'),
  '/api/uhd': require('../lib/routes/uhd'),
  '/api/upload': require('../lib/routes/upload'),
};

module.exports = async (req, res) => {
  try {
    const path = String(req.url || '').split('?')[0].replace(/\/+$/, '');
    const h = ROUTES[path] || (path.startsWith('/api/music') ? ROUTES['/api/music'] : null);
    if (h) return await h(req, res);
    return res.status(404).json({ error: 'endpoint gak ada: ' + path });
  } catch (e) {
    return res.status(500).json({ error: { message: e.message } });
  }
};
