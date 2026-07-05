// api/chat.js
// vercel WAJIB baca file endpoint dari folder /api biar otomatis kebaca
// sebagai route (ini aturan bawaan vercel, gak bisa dipindah total ke
// folder lain tanpa config routing manual). jadi file ini sengaja tipis
// banget — cuma nangkep request HTTP terus lempar ke logic aslinya yang
// ada di plugins/chat.js.

const { runChat } = require('../plugins/chat');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: { message: 'method not allowed, pake POST jir' } });
    return;
  }

  try {
    const data = await runChat(req.body || {});
    res.status(200).json(data);
  } catch (err) {
    res.status(err.status || 500).json(err.payload || { error: { message: err.message } });
  }
};
