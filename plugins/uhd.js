// plugins/uhd.js
// pake nanobanana (endpoint edit) dengan prompt khusus UHD enhancement

const UHD_PROMPT = 'Enhance this low-quality blurry image into ultra high definition 8K resolution with sharp details and clean textures. Improve lighting, clarity, and dynamic range while keeping the original identity, facial features, skin tone, body shape, and proportions exactly the same. The result must look photorealistic, natural camera quality, not like a painting, illustration, or Al-generated art. Preserve natural skin texture, realistic lighting, and accurate shadows. Apply professional photo restoration, noise reduction, detail sharpening, and cinematic color grading while maintaining authenticity of the original photo. Output should look like it was captured with a professional DSLR camera, studio quality, ultra-detailed, crisp focus, 8K resolution, realistic skin pores, natural light balance, and high dynamic range..';

const { uploadToUguu } = require('./edit');

async function runUhd(imageBase64, mimeType) {
  if (!imageBase64) {
    const err = new Error('gambar kosong');
    err.status = 400;
    throw err;
  }

  const buffer    = Buffer.from(imageBase64, 'base64');
  const ext       = ((mimeType || 'image/jpeg').split('/')[1] || 'jpg').split('+')[0];
  const publicUrl = await uploadToUguu(buffer, 'ifxrq-uhd-' + Date.now() + '.' + ext, mimeType || 'image/jpeg');

  const apiUrl = `https://api.synoxcloud.xyz/edit/nanobanana?url=${encodeURIComponent(publicUrl)}&prompt=${encodeURIComponent(UHD_PROMPT)}`;

  let upstream;
  try {
    upstream = await fetch(apiUrl, { signal: AbortSignal.timeout(120000) });
  } catch (e) {
    const err = new Error('gagal koneksi ke nanobanana: ' + e.message);
    err.status = 502;
    throw err;
  }

  const ct = upstream.headers.get('content-type') || '';

  if (ct.startsWith('image/')) {
    const buf  = await upstream.arrayBuffer();
    const b64  = Buffer.from(buf).toString('base64');
    const mime = ct.split(';')[0].trim();
    return { data: { imageDataUrl: `data:${mime};base64,${b64}`, uploadedUrl: publicUrl }, uploadedUrl: publicUrl };
  }

  const rawText = await upstream.text();
  let data;
  try { data = JSON.parse(rawText); } catch (_) {
    const t = rawText.trim();
    if (t.startsWith('http'))       data = { url: t };
    else if (t.startsWith('data:')) data = { imageDataUrl: t };
    else                             data = { message: t };
  }

  if (!upstream.ok) {
    const err = new Error((data.error && data.error.message) || data.message || `error ${upstream.status}`);
    err.status  = upstream.status;
    err.payload = { error: { message: err.message }, uploadedUrl: publicUrl };
    throw err;
  }

  return { data, uploadedUrl: publicUrl };
}

module.exports = { runUhd };
