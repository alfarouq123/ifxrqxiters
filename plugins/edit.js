// plugins/edit.js
module.exports = async (req, res) => {
  if (!['GET', 'POST'].includes(req.method)) {
    return res.status(405).json({ error: { message: 'method not allowed' } });
  }

  const url = req.method === 'GET' ? req.query.url : req.body?.url;
  const prompt = req.method === 'GET' ? req.query.prompt : req.body?.prompt;

  if (!url || !prompt) {
    return res.status(400).json({ error: { message: 'url gambar atau prompt belum diisi' } });
  }

  try {
    const apiUrl = `https://api.synoxcloud.xyz/edit/nanobanana?url=${encodeURIComponent(url)}&prompt=${encodeURIComponent(prompt)}`;
    const upstream = await fetch(apiUrl, { headers: { Accept: 'application/json, text/plain, */*' } });
    
    const text = await upstream.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      return res.status(200).json({ image: text, message: 'sukses' });
    }

    return res.status(upstream.status).json(data);
  } catch (err) {
    return res.status(500).json({ error: { message: err.message || 'internal error' } });
  }
};