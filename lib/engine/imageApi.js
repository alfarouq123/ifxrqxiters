// lib/engine/imageApi.js
// Helper generik: banyak plugin canvas di bot WA cuma manggil satu endpoint GET
// yang langsung balikin gambar. Fungsi ini generalisasi pola itu buat web.

async function getImage(url, { timeoutMs = 30000 } = {}) {
  const res = await fetch(url, {
    signal: AbortSignal.timeout(timeoutMs),
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
  });
  if (!res.ok) {
    let msg = `upstream API error ${res.status}`;
    try {
      const ct = res.headers.get('content-type') || '';
      if (ct.includes('json')) {
        const j = await res.json();
        msg = j.message || j.error || msg;
      }
    } catch (_) {}
    throw new Error(msg);
  }
  const ct = (res.headers.get('content-type') || '').split(';')[0].trim();
  if (ct.includes('json')) {
    // sebagian API balikin JSON berisi url gambar, bukan gambar langsung
    const data = await res.json();
    const imgUrl = data.result?.url || data.result || data.url || data.data?.url || data.image;
    if (!imgUrl) throw new Error('upstream tidak mengembalikan gambar');
    return getImage(imgUrl, { timeoutMs });
  }
  const buffer = Buffer.from(await res.arrayBuffer());
  const mime = ct && ct.startsWith('image/') ? ct : 'image/png';
  return { buffer, mime };
}

/** Buat plugin config+run singkat untuk pola "generate gambar dari 1 parameter teks" */
function makeSimpleImagePlugin({ name, alias = [], description, usage, example, buildUrl, paramRequired = true }) {
  return {
    config: {
      name, alias, category: 'canvas', description, usage, example,
      inputType: 'text', outputType: 'image',
    },
    run: async ({ text }) => {
      if (paramRequired && !text.trim()) {
        const e = new Error(`teks kosong. ${usage}`);
        e.status = 400;
        throw e;
      }
      const url = buildUrl(text.trim());
      const { buffer, mime } = await getImage(url);
      return { type: 'image', buffer, mime };
    },
  };
}

module.exports = { getImage, makeSimpleImagePlugin };
