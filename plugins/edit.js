// plugins/edit.js
// alur: upload ke uguu.se -> url publik -> GET nanobanana -> balikin hasil

async function uploadToUguu(buffer, filename, mimeType) {
  const form = new FormData();
  const blob = new Blob([buffer], { type: mimeType });
  form.append('files[]', blob, filename);
  let res;
  try {
    res = await fetch('https://uguu.se/upload', { method:'POST', body:form, signal:AbortSignal.timeout(30000) });
  } catch(e) {
    const err = new Error('gagal koneksi ke uguu.se: ' + e.message); err.status = 502; throw err;
  }
  const raw = await res.text();
  let data; try { data = JSON.parse(raw); } catch(_) { data = {}; }
  const url = (data.files && data.files[0] && data.files[0].url) || data.url || (Array.isArray(data) && data[0] && data[0].url);
  if(!url) { const err = new Error('uguu.se gak balikin url: ' + raw.slice(0,200)); err.status = 502; throw err; }
  return url;
}

async function runEdit(imageBase64, mimeType, prompt) {
  if(!imageBase64) { const e = new Error('gambar kosong'); e.status = 400; throw e; }
  if(!prompt)      { const e = new Error('prompt kosong'); e.status = 400; throw e; }

  const buffer    = Buffer.from(imageBase64, 'base64');
  const ext       = ((mimeType || 'image/jpeg').split('/')[1] || 'jpg').split('+')[0];
  const publicUrl = await uploadToUguu(buffer, 'ifxrq-' + Date.now() + '.' + ext, mimeType || 'image/jpeg');

  // GET persis seperti curl
  const apiUrl = `https://api.synoxcloud.xyz/edit/nanobanana?url=${encodeURIComponent(publicUrl)}&prompt=${encodeURIComponent(prompt)}`;
  let upstream;
  try {
    upstream = await fetch(apiUrl, { signal: AbortSignal.timeout(90000) });
  } catch(e) {
    const err = new Error('gagal koneksi ke nanobanana: ' + e.message); err.status = 502; throw err;
  }

  const ct = upstream.headers.get('content-type') || '';

  // API balikin gambar binary langsung -> konversi ke data URL
  if(ct.startsWith('image/')) {
    const buf    = await upstream.arrayBuffer();
    const b64    = Buffer.from(buf).toString('base64');
    const mime   = ct.split(';')[0].trim();
    return { data:{ imageDataUrl:`data:${mime};base64,${b64}`, uploadedUrl:publicUrl }, uploadedUrl:publicUrl };
  }

  // balikin teks / JSON
  const rawText = await upstream.text();
  let data;
  try { data = JSON.parse(rawText); } catch(_) {
    const t = rawText.trim();
    if(t.startsWith('http'))       data = { url: t };
    else if(t.startsWith('data:')) data = { imageDataUrl: t };
    else                            data = { message: t };
  }

  if(!upstream.ok) {
    const err = new Error((data.error && data.error.message) || data.message || `error ${upstream.status}`);
    err.status  = upstream.status;
    err.payload = { error:{ message:err.message }, uploadedUrl:publicUrl };
    throw err;
  }
  return { data, uploadedUrl:publicUrl };
}

module.exports = { runEdit, uploadToUguu };
