const { Img2Img } = require('../../lib/scrapers/ai/img2img');
const { getImage } = require('../../lib/engine/imageApi');

module.exports = {
  config: {
    name: 'img2img', alias: ['editaigambar'],
    category: 'ai',
    description: 'Edit/transformasi gambar pakai AI berdasarkan instruksi teks',
    usage: '/img2img <instruksi edit> (upload gambar)',
    example: '/img2img ubah jadi gaya lukisan cat air',
    inputType: 'text+image', outputType: 'image',
  },
  run: async ({ text, imageBuffer }) => {
    if (!text.trim()) { const e = new Error('instruksi edit kosong'); e.status = 400; throw e; }
    if (!imageBuffer) { const e = new Error('upload gambar dulu'); e.status = 400; throw e; }
    const result = await Img2Img(text.trim(), imageBuffer, 'upload.png');
    const url = result?.url || result?.result?.url || result;
    if (!url || typeof url !== 'string') throw new Error('gagal edit gambar, coba lagi');
    const { buffer, mime } = await getImage(url, { timeoutMs: 60000 });
    return { type: 'image', buffer, mime };
  },
};
