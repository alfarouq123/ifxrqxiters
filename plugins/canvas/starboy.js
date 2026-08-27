const { getImage } = require('../../lib/engine/imageApi');
module.exports = {
  config: {
    name: 'starboy', category: 'canvas',
    description: 'Membuat efek gambar "Starboy" dari foto yang kamu upload',
    usage: '/starboy (upload foto)', example: '/starboy',
    inputType: 'image', outputType: 'image',
  },
  run: async ({ imageBuffer, imageMime }) => {
    if (!imageBuffer) { const e = new Error('upload foto dulu'); e.status = 400; throw e; }
    const form = new FormData();
    form.append('reqtype', 'fileupload');
    form.append('fileToUpload', new Blob([imageBuffer], { type: imageMime || 'image/jpeg' }), 'photo.jpg');
    const up = await fetch('https://catbox.moe/user/api.php', { method: 'POST', body: form, signal: AbortSignal.timeout(30000) });
    const photoUrl = (await up.text()).trim();
    if (!photoUrl.startsWith('http')) throw new Error('gagal upload foto sementara');
    const { buffer, mime } = await getImage(`https://api.cuki.biz.id/api/canvas/starboy?apikey=cuki&image=${encodeURIComponent(photoUrl)}`);
    return { type: 'image', buffer, mime };
  },
};
