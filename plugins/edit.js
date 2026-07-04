// plugins/edit.js
// alur: gambar (base64) dari user -> upload ke uguu.se biar dapet url publik
// -> url + prompt dilempar ke API edit foto (synoxcloud nanobanana2) ->
// API BALIKIN GAMBAR LANGSUNG (binary PNG/JPEG, BUKAN JSON) -> dikonversi
// ke base64 data URL -> dikirim ke frontend buat ditampilin.

async function uploadToUguu(buffer, filename, mimeType) {
  const form = new FormData();
  const blob = new Blob([buffer], { type: mimeType });
  form.append('files[]', blob, filename);

  let res;
  try {
    res = await fetch('https://uguu.se/upload', {
      method: 'POST',
      body: form,
      signal: AbortSignal.timeout(30000)
    });
  } catch (fetchErr) {
    const err = new Error('gagal koneksi ke uguu.se: ' + fetchErr.message);
    err.status = 502;
    throw err;
  }

  const rawText = await res.text();
  let data;
  try { data = JSON.parse(rawText); } catch (_) { data = {}; }

  const url =
    (data && data.files && data.files[0] && data.files[0].url) ||
    (data && data.url) ||
    (Array.isArray(data) && data[0] && data[0].url);

  if (!url) {
    const err = new Error('gagal dapetin url dari uguu.se — response: ' + rawText.slice(0, 200));
    err.status = 502;
    throw err;
  }
  return url;
}

async function runEdit(imageBase64, mimeType, prompt) {
  if (!imageBase64) {
    const err = new Error('gambar kosong, gak ada yang mau di-upload');
    err.status = 400;
    throw err;
  }
  if (!prompt) {
    const err = new Error('prompt edit kosong, mau diubah jadi apa?');
    err.status = 400;
    throw err;
  }

  const buffer = Buffer.from(imageBase64, 'base64');
  const ext = ((mimeType || 'image/jpeg').split('/')[1] || 'jpg').split('+')[0];
  const publicUrl = await uploadToUguu(buffer, 'ifxrq-' + Date.now() + '.' + ext, mimeType || 'image/jpeg');

  const template = process.env.IMAGE_EDIT_API_URL ||
    'https://api.synoxcloud.xyz/edit/nanobanana?url={url}&prompt={prompt}';

  const finalUrl = template
    .replace('{url}', encodeURIComponent(publicUrl))
    .replace('{prompt}', encodeURIComponent(prompt));

  let upstream;
  try {
    upstream = await fetch(finalUrl, { signal: AbortSignal.timeout(60000) });
  } catch (fetchErr) {
    const err = new Error('gagal koneksi ke edit API: ' + fetchErr.message);
    err.status = 502;
    throw err;
  }

  const contentType = upstream.headers.get('content-type') || '';

  // === KASUS 1: API balikin gambar langsung (PNG/JPEG/WEBP) ===
  // ini yang selama ini bikin error "Unexpected token PNG is not valid JSON"
  if (contentType.startsWith('image/')) {
    const imgBuffer = await upstream.arrayBuffer();
    const imgBase64 = Buffer.from(imgBuffer).toString('base64');
    const dataUrl = `data:${contentType.split(';')[0]};base64,${imgBase64}`;
    return {
      data: { imageDataUrl: dataUrl, uploadedUrl: publicUrl },
      uploadedUrl: publicUrl
    };
  }

  // === KASUS 2: API balikin JSON (url gambar atau pesan) ===
  const rawText = await upstream.text();
  let data;
  try { data = JSON.parse(rawText); } catch (_) {
    // kalau bukan JSON dan bukan image, kemungkinan url mentah atau plain text
    // coba deteksi kalau isinya url gambar langsung
    const trimmed = rawText.trim();
    if (trimmed.startsWith('http')) {
      data = { url: trimmed };
    } else {
      data = { message: trimmed };
    }
  }

  if (!upstream.ok) {
    const err = new Error(
      (data && data.error && data.error.message) ||
      (data && data.message) ||
      `upstream error ${upstream.status}`
    );
    err.status = upstream.status;
    err.payload = data;
    throw err;
  }

  return { data, uploadedUrl: publicUrl };
}

module.exports = { runEdit, uploadToUguu };
