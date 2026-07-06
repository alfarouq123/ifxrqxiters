// api/berfikir.js
const { runBerfikir } = require('../plugins/berfikir');

module.exports = async (req, res) => {
  if (req.method !== 'GET' && req.method !== 'POST') return res.status(405).json({ error: 'pake GET atau POST' });
  try {
    const pesan = req.method === 'GET' ? req.query.pesan : req.body?.pesan;
    const result = await runBerfikir(pesan);
    res.status(200).json({ ok: true, ...result });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
};
