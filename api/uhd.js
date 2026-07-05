// api/uhd.js — route tipis, logic di plugins/uhd.js
const { runUhd } = require('../plugins/uhd');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: { message: 'pake POST' } });
  }
  try {
    const { imageBase64, mimeType } = req.body || {};
    const result = await runUhd(imageBase64, mimeType);
    res.status(200).json(result);
  } catch (err) {
    res.status(err.status || 500).json(err.payload || { error: { message: err.message } });
  }
};
