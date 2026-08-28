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
    const result = await Txt2Img2(text.trim());
    if (!result.status || !result.url) {
      throw new Error(result.error || 'gagal generate gambar, coba prompt lain');
    }
    const { buffer, mime } = await getImage(result.url, { timeoutMs: 60000 });
    return { type: 'image', buffer, mime, caption: `prompt: ${text.trim()}` };
  },
};
