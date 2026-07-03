// plugins/edit.js
module.exports = async (req, res) => {
  // Set CORS headers biar ga error pas di-hit dari domain frontend lo
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: { message: 'method tidak diizinkan, wajib pake POST jir 🗿' } });
  }

  const { url, prompt } = req.body || {};
  if (!url || !prompt) {
    return res.status(400).json({ error: { message: 'url gambar dari uguu atau prompt-nya kosong, isi dulu lah' } });
  }

  try {
    const apiUrl = `https://api.synoxcloud.xyz/edit/nanobanana?url=${encodeURIComponent(url)}&prompt=${encodeURIComponent(prompt)}`;
    const upstream = await fetch(apiUrl, { headers: { Accept: 'application/json, text/plain, */*' } });
    
    const text = await upstream.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      // jika response ternyata link text mentah, bungkus jadi json
      return res.status(200).json({ image: text, message: 'sukses' });
    }

    return res.status(upstream.status).json(data);
  } catch (err) {
    return res.status(500).json({ error: { message: err.message || 'internal error pas edit foto' } });
  }
};
