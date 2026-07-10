const { runEdit } = require('../plugins/edit');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'pake POST' });

  try {
    const { imageBase64, mimeType, prompt } = req.body || {};
    if (!imageBase64) return res.status(400).json({ error: 'gambar kosong' });
    if (!prompt) return res.status(400).json({ error: 'prompt kosong' });

    const result = await runEdit(imageBase64, mimeType, prompt);
    return res.status(200).json(result);
  } catch (err) {
    return res.status(err.status || 500).json({
      error: { message: err.message },
      uploadedUrl: err.payload?.uploadedUrl || null
    });
  }
};
