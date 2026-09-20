const { runUhd } = require('../../plugins/ai-core/uhd');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'pake POST' });

  try {
    const { imageUrl, imageBase64, mimeType } = req.body || {};
    if (!imageUrl && !imageBase64) return res.status(400).json({ error: 'gambar kosong' });

    const result = await runUhd(imageUrl, imageBase64, mimeType);
    return res.status(200).json(result);
  } catch (err) {
    return res.status(err.status || 500).json({
      error: { message: err.message },
      uploadedUrl: err.payload?.uploadedUrl || null
    });
  }
};
