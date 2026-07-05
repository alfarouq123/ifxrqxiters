// api/edit.js — tipis, logic asli di plugins/edit.js (lihat catatan di api/chat.js)

const { runEdit } = require('../plugins/edit');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: { message: 'method not allowed, pake POST' } });
    return;
  }

  try {
    const { imageBase64, mimeType, prompt } = req.body || {};
    const result = await runEdit(imageBase64, mimeType, prompt);
    res.status(200).json(result);
  } catch (err) {
    res.status(err.status || 500).json(err.payload || { error: { message: err.message } });
  }
};
