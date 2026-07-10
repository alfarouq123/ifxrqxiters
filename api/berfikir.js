const { runBerfikir } = require('../plugins/berfikir');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'pake POST' });

  try {
    const { pesan, history, imageUrl } = req.body || {};
    if (!pesan) return res.status(400).json({ error: 'pertanyaan kosong' });

    const result = await runBerfikir(pesan, history || [], imageUrl || null);
    return res.status(200).json({ ok: true, ...result });
  } catch (err) {
    return res.status(err.status || 500).json({
      ok: false,
      error: err.message
    });
  }
};
