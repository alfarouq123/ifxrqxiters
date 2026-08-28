// lib/scrapers/image/removebackground.js
// Diadaptasi dari plugin bot WA (src/scraper/removebackground.js).
// Versi asli baca dari file path lokal; di web kita terima Buffer langsung dari upload user.

async function pixa(imageBuffer, filename = 'image.jpg') {
  const form = new FormData();
  form.append('image', new Blob([imageBuffer], { type: 'image/jpeg' }), filename);
  form.append('format', 'png');
  form.append('model', 'v1');

  const res = await fetch('https://api2.pixelcut.app/image/matte/v1', {
    method: 'POST',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36',
      'Accept': 'application/json, text/plain, */*',
      'x-locale': 'en',
      'x-client-version': 'web:pixa.com:4a5b0af2',
      'origin': 'https://www.pixa.com',
      'referer': 'https://www.pixa.com/',
      'accept-language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
    },
    body: form,
    signal: AbortSignal.timeout(45000),
  });

  if (!res.ok) throw new Error(`removebg upstream error: ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

module.exports = { pixa };
