// api/code.js — route tipis buat @code
const { runCode } = require('../plugins/code');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'pake POST' });

  try {
    const { prompt, history, attachedCode } = req.body || {};
    if (!prompt) return res.status(400).json({ ok: false, error: 'perintah kosong' });

    const result = await runCode(prompt, history || [], attachedCode || null);
    return res.status(200).json(result);
  } catch (err) {
    return res.status(err.status || 500).json({
      ok: false,
      error: err.message
    });
  }
};
