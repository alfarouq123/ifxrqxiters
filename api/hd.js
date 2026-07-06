// api/hd.js
const { runHd } = require('../plugins/hd');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'pake POST' });
  try {
    const { imageBase64, mimeType } = req.body || {};
    const result = await runHd(imageBase64, mimeType);
    res.status(200).json({ ok: true, ...result });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
};
