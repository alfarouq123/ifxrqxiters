// lib/scrapers/ai/img2prompt.js — diadaptasi buat terima Buffer langsung (bukan file path)
async function imgtoprompt(imageBuffer, mime = 'image/jpeg') {
  const base64 = imageBuffer.toString('base64');
  const res = await fetch('https://imageprompt.org/api/ai/prompts/image', {
    method: 'POST',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Linux; Android 10)',
      'Content-Type': 'application/json',
      origin: 'https://imageprompt.org',
      referer: 'https://imageprompt.org/image-to-prompt',
    },
    body: JSON.stringify({ base64Url: `data:${mime};base64,${base64}`, imageModelId: 0, language: 'en' }),
    signal: AbortSignal.timeout(30000),
  });
  if (!res.ok) throw new Error(`img2prompt upstream error ${res.status}`);
  const data = await res.json();
  return { prompt: data.prompt, generatedAt: data.generatedAt };
}

module.exports = imgtoprompt;
