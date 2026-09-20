// plugins/ai/img2img.js — edit gambar pakai AI (nanobanana via synoxcloud,
// engine yang sama dengan fitur @edit — fgsi.dpdns.org udah mati)
const { runEdit } = require('../ai-core/edit');

module.exports = {
  config: {
    name: 'img2img', alias: ['editaigambar'],
    category: 'ai',
    description: 'Edit/transformasi gambar pakai AI berdasarkan instruksi teks',
    usage: '/img2img <instruksi edit> (upload gambar)',
    example: '/img2img ubah jadi gaya lukisan cat air',
    inputType: 'text+image', outputType: 'image',
  },
  run: async ({ text, imageBuffer, imageMime }) => {
    if (!text.trim()) { const e = new Error('instruksi edit kosong'); e.status = 400; throw e; }
    if (!imageBuffer) { const e = new Error('upload gambar dulu'); e.status = 400; throw e; }
    let r;
    let lastErr;
    for (let i = 0; i < 2 && !r; i++) {
      try { r = await runEdit(imageBuffer.toString('base64'), imageMime || 'image/png', text.trim()); } catch (e) { lastErr = e; } }
    const dataUrl = r?.data?.imageDataUrl || (typeof r?.data?.url === 'string' && r.data.url.startsWith('data:') ? r.data.url : null);
    if (!r) throw new Error((lastErr && lastErr.message) || 'AI edit gagal, coba lagi');
    if (!dataUrl) throw new Error(r?.data?.message || 'AI edit gagal, coba lagi');
    const [meta, b64] = dataUrl.split(',');
    const mime = (meta.match(/data:([^;]+)/) || [])[1] || 'image/png';
    return { type: 'image', buffer: Buffer.from(b64, 'base64'), mime, caption: text.trim() };
  },
};
