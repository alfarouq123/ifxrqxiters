const { runSearch } = require('../plugins/search');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'pake GET' });

  try {
    const message = req.query.message;
    const model   = req.query.model || 'think-deeper';
    if (!message) return res.status(400).json({ error: 'query kosong' });

    const data = await runSearch(message, model);
    return res.status(200).json(data);
  } catch (err) {
    return res.status(err.status || 500).json({
      error: { message: err.message },
      payload: err.payload || null
    });
  }
};
