const { getImage } = require('../../lib/engine/imageApi');
const { bufferToDataUrl, dataUrlToBuffer } = require('../../lib/utils');

module.exports = {
  config: {
    name: 'fakeml',
    alias: ['fakelobyml'],
    category: 'canvas',
    description: 'Membuat fake profile card Mobile Legends dari foto avatar yang kamu upload',
    usage: '/fakeml <nama> (upload foto avatar)',
    example: '/fakeml IFxrq',
    inputType: 'text+image',
    outputType: 'image',
  },
  run: async ({ text, imageBuffer, imageMime }) => {
    if (!text.trim()) { const e = new Error('nama kosong, contoh: /fakeml IFxrq'); e.status = 400; throw e; }
    let avatarUrl = 'https://api.dicebear.com/7.x/identicon/png?seed=' + encodeURIComponent(text.trim());
    // kalau user upload gambar, upload dulu ke catbox sementara biar bisa dipakai sebagai parameter url
    if (imageBuffer) {
      const form = new FormData();
      form.append('reqtype', 'fileupload');
      form.append('fileToUpload', new Blob([imageBuffer], { type: imageMime || 'image/jpeg' }), 'avatar.jpg');
      const up = await fetch('https://catbox.moe/user/api.php', { method: 'POST', body: form, signal: AbortSignal.timeout(30000) });
      const url = (await up.text()).trim();
      if (url.startsWith('http')) avatarUrl = url;
    }
    const url = `https://api.nexray.web.id/maker/fakelobyml?avatar=${encodeURIComponent(avatarUrl)}&name=${encodeURIComponent(text.trim())}`;
    const { buffer, mime } = await getImage(url);
    return { type: 'image', buffer, mime };
  },
};
