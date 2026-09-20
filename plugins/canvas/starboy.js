// plugins/canvas/starboy.js — efek starboy via AI edit nanobanana (API cuki udah butuh key)
const { runEdit } = require('../ai-core/edit');

const PROMPT = 'ubah foto ini jadi gaya starboy the weeknd: pencahayaan neon merah gelap yang mewah, '
  + 'vibe sinematik malam hari, kontras tinggi, tetap kenali wajah dan pose aslinya';

module.exports = {
  config: {
    name: 'starboy', alias: ['starboyeffect'],
    category: 'canvas',
    description: 'Membuat efek gambar "Starboy" dari foto yang kamu upload',
    usage: '/starboy (upload foto)', example: '/starboy',
    inputType: 'image', outputType: 'image',
  },
  run: async ({ imageBuffer, imageMime }) => {
    if (!imageBuffer) { const e = new Error('upload foto dulu'); e.status = 400; throw e; }
    let r;
    let lastErr;
    for (let i = 0; i < 2 && !r; i++) {
      try { r = await runEdit(imageBuffer.toString('base64'), imageMime || 'image/jpeg', PROMPT); } catch (e) { lastErr = e; } }
    const dataUrl = r?.data?.imageDataUrl || (typeof r?.data?.url === 'string' && r.data.url.startsWith('data:') ? r.data.url : null);
    if (!r) throw new Error((lastErr && lastErr.message) || 'efek starboy gagal, coba lagi');
    if (!dataUrl) throw new Error(r?.data?.message || 'efek starboy gagal, coba lagi');
    const [meta, b64] = dataUrl.split(',');
    const mime = (meta.match(/data:([^;]+)/) || [])[1] || 'image/png';
    return { type: 'image', buffer: Buffer.from(b64, 'base64'), mime, caption: '✨ starboy edition' };
  },
};
