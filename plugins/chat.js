// plugins/chat.js
// logic buat chat utama (gemini). dipisah dari api/chat.js biar
// business logic-nya ada di folder plugins, bukan numpuk di api/.

async function runChat({ model, systemInstruction, contents, generationConfig }) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    const err = new Error('GEMINI_API_KEY belum di-set di environment variable vercel');
    err.status = 500;
    throw err;
  }

  if (!contents) {
    const err = new Error('contents kosong, gak ada yang mau dikirim');
    err.status = 400;
    throw err;
  }

  const useModel = model || 'gemini-3.1-flash-lite';

  const upstream = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${useModel}:generateContent?key=${apiKey}`,
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
    const err = new Error(data?.error?.message || `upstream error ${upstream.status}`);
    err.status = upstream.status;
    err.payload = data;
    throw err;
  }
  return data;
}

module.exports = { runChat };
