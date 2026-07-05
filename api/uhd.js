// api/uhd.js — enhance foto menggunakan AI
const { runUhd } = require('../plugins/uhd');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: { message: 'pake POST' } });
  try {
    const { imageUrl, imageBase64, mimeType } = req.body || {};
    // terima imageUrl (dari upload browser) atau imageBase64 (fallback lama)
    const result = await runUhd(imageUrl, imageBase64, mimeType);
    res.status(200).json(result);
  } catch (err) {
    res.status(err.status || 500).json(err.payload || { error: { message: err.message } });
  }
};
