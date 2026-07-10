const { runChat } = require('../plugins/chat');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'pake POST' });

  try {
    const { model, systemInstruction, contents, generationConfig } = req.body || {};
    if (!contents) return res.status(400).json({ error: 'contents kosong' });

    const data = await runChat({ model, systemInstruction, contents, generationConfig });
    return res.status(200).json(data);
  } catch (err) {
    return res.status(err.status || 500).json({
      error: { message: err.message },
      payload: err.payload || null
    });
  }
};
