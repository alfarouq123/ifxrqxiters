// plugins/uhd.js
// pake nanobanana (endpoint edit) dengan prompt khusus UHD enhancement

const UHD_PROMPT = 'Ultra-premium professional image enhancement. Transform the uploaded low-quality, blurry image into extreme high-detail cinematic quality. Preserve 100% original identity, face structure, expression, pose, clothing, accessories, background, framing, and composition. Do NOT alter, redesign, replace, or add anything. Recover micro-details: sharp facial features natural skin texture visible pores realistic hair strands crisp eyes clean refined edges High-contrast clarity, deep depth, and balanced cinematic lighting. Poster-grade realism with dramatic but accurate detail. Output in 8K resolution, ProRes quality, studio-level sharpness. Photorealistic textures only. True-to-source enhancement only. Keep everything exactly the same — only enhance quality. Negative Prompt (VERY IMPORTANT): blur, low quality, low resolution, over smoothing, plastic skin, wax skin, artificial look, over sharpening, face distortion, face deformation, changed facial features, extra fingers, artifacts, noise, cartoon, anime, painting, unrealistic';

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
