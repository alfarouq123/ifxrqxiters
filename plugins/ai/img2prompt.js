const imgtoprompt = require('../../lib/scrapers/ai/img2prompt');

module.exports = {
  config: {
    name: 'img2prompt', alias: ['whatprompt'],
    category: 'ai',
    description: 'Menebak prompt/deskripsi teks dari sebuah gambar (image-to-prompt AI)',
    usage: '/img2prompt (upload gambar)',
    example: '/img2prompt',
    inputType: 'image', outputType: 'text',
  },
  run: async ({ imageBuffer }) => {
    if (!imageBuffer) { const e = new Error('upload gambar dulu'); e.status = 400; throw e; }
    const result = await imgtoprompt(imageBuffer, 'image/jpeg');
    const prompt = result?.prompt || result?.result || result;
    if (!prompt) throw new Error('gagal menganalisa gambar');
    return { type: 'text', text: `🖼️ *Prompt hasil analisa:*\n\n${prompt}` };
  },
};
