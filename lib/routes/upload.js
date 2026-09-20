// api/upload.js — proxy upload gambar, coba beberapa host

async function tryUguu(buffer, fname, mimeType) {
  const form = new FormData();
  form.append('files[]', new Blob([buffer], { type: mimeType }), fname);
  const res  = await fetch('https://uguu.se/upload', { method:'POST', body:form, signal:AbortSignal.timeout(20000) });
  const raw  = await res.text();
  let data; try { data = JSON.parse(raw); } catch(_) { throw new Error('uguu.se balikin bukan JSON: ' + raw.slice(0,80)); }
  const url = (data.files && data.files[0] && data.files[0].url) || data.url;
  if (!url) throw new Error('uguu.se gak balikin url');
  return url;
}

async function tryTmpfiles(buffer, fname, mimeType) {
  const form = new FormData();
  form.append('file', new Blob([buffer], { type: mimeType }), fname);
  const res  = await fetch('https://tmpfiles.org/api/v1/upload', { method:'POST', body:form, signal:AbortSignal.timeout(20000) });
  const raw  = await res.text();
  let data; try { data = JSON.parse(raw); } catch(_) { throw new Error('tmpfiles balikin bukan JSON: ' + raw.slice(0,80)); }
  // tmpfiles balikin url style https://tmpfiles.org/XXXXX/file.jpg
  // perlu diubah ke https://tmpfiles.org/dl/XXXXX/file.jpg biar bisa diakses langsung
  const url = data.data && data.data.url;
  if (!url) throw new Error('tmpfiles gak balikin url');
  return url.replace('tmpfiles.org/', 'tmpfiles.org/dl/');
}

async function tryCatbox(buffer, fname, mimeType) {
  const form = new FormData();
  form.append('reqtype', 'fileupload');
  form.append('fileToUpload', new Blob([buffer], { type: mimeType }), fname);
  const res = await fetch('https://catbox.moe/user/api.php', { method:'POST', body:form, signal:AbortSignal.timeout(20000) });
  const url = (await res.text()).trim();
  if (!url.startsWith('http')) throw new Error('catbox gak balikin url: ' + url.slice(0,80));
  return url;
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'pake POST' });

  try {
    const { imageBase64, mimeType, filename } = req.body || {};
    if (!imageBase64) return res.status(400).json({ error: 'imageBase64 kosong' });

    const clean  = imageBase64.replace(/^data:[^;]+;base64,/, '');
    const buffer = Buffer.from(clean, 'base64');
    const ext    = ((mimeType || 'image/jpeg').split('/')[1] || 'jpg').split('+')[0];
    const fname  = filename || ('ifxrq-' + Date.now() + '.' + ext);

    const hosts = [
      { name:'catbox',   fn: () => tryCatbox(buffer, fname, mimeType || 'image/jpeg') },
      { name:'tmpfiles', fn: () => tryTmpfiles(buffer, fname, mimeType || 'image/jpeg') },
      { name:'uguu',     fn: () => tryUguu(buffer, fname, mimeType || 'image/jpeg') },
    ];

    let lastErr = null;
    for (const host of hosts) {
      try {
        const url = await host.fn();
        return res.status(200).json({ ok: true, url, host: host.name });
      } catch(e) {
        lastErr = e;
        console.error(`[upload] ${host.name} gagal:`, e.message);
      }
    }

    return res.status(502).json({ error: 'semua host upload gagal: ' + (lastErr && lastErr.message) });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
