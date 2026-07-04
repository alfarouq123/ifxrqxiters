// api/search.js — tipis, logic asli di plugins/search.js (lihat catatan di api/chat.js)

const { runSearch } = require('../plugins/search');

module.exports = async (req, res) => {
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.status(405).json({ error: { message: 'method not allowed' } });
    return;
  }

  const message = req.method === 'GET' ? req.query.message : req.body?.message;
  const model = (req.method === 'GET' ? req.query.model : req.body?.model) || 'think-deeper';

  try {
    const data = await runSearch(message, model);
    res.status(200).json(data);
  } catch (err) {
    res.status(err.status || 500).json(err.payload || { error: { message: err.message } });
  }
};
