const { getImage } = require('../../lib/engine/imageApi');

module.exports = {
  config: {
    name: 'quotesv1', alias: ['quotecard'],
    category: 'canvas',
    description: 'Membuat gambar quote dari foto + teks (style umum)',
    usage: '/quotesv1 <teks quote> (upload foto, opsional)',
    example: '/quotesv1 Waktu adalah hal paling berharga',
    inputType: 'text+image', outputType: 'image',
  },
  run: async ({ text, imageBuffer, imageMime }) => {
    if (!text.trim()) { const e = new Error('teks quote kosong'); e.status = 400; throw e; }
    let photoUrl = 'https://api.dicebear.com/7.x/shapes/png?seed=' + encodeURIComponent(text.trim());
    if (imageBuffer) {
      const form = new FormData();
      form.append('reqtype', 'fileupload');
      form.append('fileToUpload', new Blob([imageBuffer], { type: imageMime || 'image/jpeg' }), 'photo.jpg');
      const up = await fetch('https://catbox.moe/user/api.php', { method: 'POST', body: form, signal: AbortSignal.timeout(30000) });
      const url = (await up.text()).trim();
      if (url.startsWith('http')) photoUrl = url;
    }
    const url = `https://api.synoxcloud.xyz/canvas/quotes?text=${encodeURIComponent(text.trim())}&image=${encodeURIComponent(photoUrl)}`;
    const { buffer, mime } = await getImage(url);
    return { type: 'image', buffer, mime };
  },
};
