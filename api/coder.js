// api/coder.js — tipis, logic asli di plugins/coder.js (lihat catatan di api/chat.js)

const { runCoder } = require('../plugins/coder');

module.exports = async (req, res) => {
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.status(405).json({ error: { message: 'method not allowed' } });
    return;
  }

  const prompt = req.method === 'GET' ? req.query.prompt : req.body?.prompt;
  const session = req.method === 'GET' ? req.query.session : req.body?.session;

  try {
    const { data, session: usedSession } = await runCoder(prompt, session);
    res.status(200).json({ ...data, session: usedSession });
  } catch (err) {
    res.status(err.status || 500).json(err.payload || { error: { message: err.message } });
  }
};
