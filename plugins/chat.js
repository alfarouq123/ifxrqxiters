// plugins/chat.js
module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: { message: 'method not allowed, pake POST jir' } });
    return;
  }

  const API_KEY = process.env.GEMINI_API_KEY;
  if (!API_KEY) {
    res.status(500).json({ error: { message: 'GEMINI_API_KEY belum di-set di environment' } });
    return;
  }

  try {
    const { model, systemInstruction, contents, generationConfig } = req.body || {};
    if (!contents) {
      res.status(400).json({ error: { message: 'contents kosong, gak ada yang mau dikirim' } });
      return;
    }

    const useModel = model || 'gemini-3.1-flash-lite';
    const upstream = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${useModel}:generateContent?key=${API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: systemInstruction ? { parts: [{ text: systemInstruction }] } : undefined,
          contents,
          generationConfig: generationConfig || { temperature: 0.9, maxOutputTokens: 1024 }
        })
      }
    );

    const data = await upstream.json();
    if (!upstream.ok) {
      res.status(upstream.status).json(data);
      return;
    }

    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: { message: err.message || 'internal error' } });
  }
};