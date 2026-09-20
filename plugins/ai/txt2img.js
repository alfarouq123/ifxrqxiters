const { Txt2Img2 } = require('../../lib/scrapers/ai/txt2img2');
const { getImage } = require('../../lib/engine/imageApi');

module.exports = {
  config: {
    name: 'txt2img', alias: ['imagine', 'aiimage'],
    category: 'ai',
    description: 'Generate gambar dari deskripsi teks pakai model FLUX (text-to-image AI)',
    usage: '/txt2img <deskripsi gambar>',
    example: '/txt2img kucing oren pakai jas astronot, gaya digital art',
    inputType: 'text', outputType: 'image',
  },
  run: async ({ text }) => {
    if (!text.trim()) { const e = new Error('deskripsi gambar kosong'); e.status = 400; throw e; }
    let url = null;
    try {
      const result = await Txt2Img2(text.trim());
      if (result.status && result.url) url = result.url;
    } catch (_e) { /* fallback di bawah */ }
    if (!url) {
      // fallback: pollinations image (terbukti stabil)
      url = `https://image.pollinations.ai/prompt/${encodeURIComponent(text.trim())}?width=768&height=768&nologo=true`;
    }
    const { buffer, mime } = await getImage(url, { timeoutMs: 90000 });
    return { type: 'image', buffer, mime, caption: `prompt: ${text.trim()}` };
  },
};
