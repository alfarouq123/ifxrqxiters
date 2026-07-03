// plugins/coder.js
module.exports = async (req, res) => {
  if (!['GET', 'POST'].includes(req.method)) {
    return res.status(405).json({ error: { message: 'method not allowed' } });
  }

  const prompt = req.method === 'GET' ? req.query.prompt : req.body?.prompt;
  const session = (req.method === 'GET' ? req.query.session : req.body?.session) || 'oiNkyZ6';

  if (!prompt?.trim()) {
    return res.status(400).json({ error: { message: 'prompt kodingan kosong' } });
  }

  try {
    const upstream = await fetch(
      `https://api.synoxcloud.xyz/ai-chat/ai-coder?prompt=${encodeURIComponent(prompt)}&session=${encodeURIComponent(session)}`,
      { headers: { Accept: 'application/json, text/plain, */*' } }
    );

    const text = await upstream.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      // Kalo response mentah berupa text/markdown langsung balikin object terbungkus
      return res.status(upstream.status).json({ result: text });
    }

    return res.status(upstream.status).json(data);
  } catch (err) {
    return res.status(500).json({ error: { message: err.message || 'internal error' } });
  }
};