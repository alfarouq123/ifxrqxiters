// plugins/edit.js
// alur: gambar (base64) dari user -> upload ke uguu.se biar dapet url publik
// -> url + prompt dilempar ke API edit foto (synoxcloud nanobanana2) ->
// hasilnya dibalikin ke frontend. bisa dioverride lewat env var
// IMAGE_EDIT_API_URL kalau nanti endpoint-nya ganti.

async function uploadToUguu(buffer, filename, mimeType) {
  const form = new FormData();
  const blob = new Blob([buffer], { type: mimeType });
  form.append('files[]', blob, filename);

  const res = await fetch('https://uguu.se/upload', { method: 'POST', body: form });
  const data = await res.json();

  // uguu.se (ala pomf) biasanya balikin { success:true, files:[{url,...}] }
  const url =
    (data && data.files && data.files[0] && data.files[0].url) ||
    (data && data.url) ||
    (Array.isArray(data) && data[0] && data[0].url);

  if (!url) {
    const err = new Error('gagal dapetin url dari uguu.se, response mentahnya: ' + JSON.stringify(data));
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

  // template diisi lewat env var (opsional), contoh:
  // IMAGE_EDIT_API_URL=https://api.contoh.xyz/edit?image={url}&prompt={prompt}
  // defaultnya udah diisi endpoint yang dikasih (synoxcloud nanobanana2)
  const template = process.env.IMAGE_EDIT_API_URL ||
    'https://api.synoxcloud.xyz/edit/nanobanana?url={url}&prompt={prompt}';

  const finalUrl = template.replace('{url}', encodeURIComponent(publicUrl)).replace('{prompt}', encodeURIComponent(prompt));
  const upstream = await fetch(finalUrl);
  const data = await upstream.json();

  if (!upstream.ok) {
    const err = new Error((data && data.error && data.error.message) || ('upstream error ' + upstream.status));
    err.status = upstream.status;
    err.payload = data;
    throw err;
  }

  return { data, uploadedUrl: publicUrl };
}

module.exports = { runEdit, uploadToUguu };
