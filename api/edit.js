// api/edit.js
const { runEdit } = require('../plugins/edit');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: { message: 'pake POST' } });
  try {
    const { imageUrl, imageBase64, mimeType, prompt } = req.body || {};
    const result = await runEdit(imageUrl || imageBase64, mimeType, prompt);
    res.status(200).json(result);
  } catch (err) {
    res.status(err.status || 500).json(err.payload || { error: { message: err.message } });
  }
};
