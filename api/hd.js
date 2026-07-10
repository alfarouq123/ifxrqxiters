const { runHd } = require('../plugins/hd');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'pake POST' });

  try {
    const { imageBase64, mimeType } = req.body || {};
    if (!imageBase64) return res.status(400).json({ error: 'gambar kosong' });

    const result = await runHd(imageBase64, mimeType);
    return res.status(200).json({ ok: true, ...result });
  } catch (err) {
    return res.status(err.status || 500).json({
      error: err.message,
      ok: false
    });
  }
};
