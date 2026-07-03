// api/search.js
// proxy buat plugin @search. frontend manggil /api/search?message=...
// bukan langsung ke api.synoxcloud.xyz, biar:
// 1. gak kena CORS block dari browser
// 2. gampang nambahin auth/key di sini nanti kalo servicenya butuh itu
// 3. gampang ganti provider search tanpa ubah kode frontend

module.exports = async (req, res) => {
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.status(405).json({ error: { message: 'method not allowed' } });
    return;
  }

  const message = req.method === 'GET' ? req.query.message : req.body?.message;
  const model = (req.method === 'GET' ? req.query.model : req.body?.model) || 'think-deeper';

  if (!message) {
    res.status(400).json({ error: { message: 'query kosong, gak ada yang mau dicari' } });
    return;
  }

  try {
    const url = `https://api.synoxcloud.xyz/ai-chat/copilot-ai?message=${encodeURIComponent(message)}&model=${encodeURIComponent(model)}`;
    const upstream = await fetch(url);
    const data = await upstream.json();
    res.status(upstream.ok ? 200 : upstream.status).json(data);
  } catch (err) {
    res.status(500).json({ error: { message: err.message || 'internal error' } });
  }
};
