// plugins/canvas/gura.js — foto lu jadi Gawr Gura (oc gura, via nexray)
const { getImage } = require('../../lib/engine/imageApi');
const { uploadToUguu } = require('../ai-core/edit');

module.exports = {
  config: {
    name: 'gura', alias: ['guraoc', 'sharkgirl'],
    category: 'canvas',
    description: 'Ubah foto kamu jadi karakter Gawr Gura (Hololive)',
    usage: '@gura (upload foto)', example: '@gura',
    inputType: 'image', outputType: 'image',
  },
  run: async ({ imageBuffer, imageMime }) => {
    if (!imageBuffer) { const e = new Error('upload foto dulu'); e.status = 400; throw e; }
    const publicUrl = await uploadToUguu(imageBuffer, 'gura-' + Date.now() + '.png', imageMime || 'image/png');
    const { buffer, mime } = await getImage(`https://api.nexray.eu.cc/canvas/gura?url=${encodeURIComponent(publicUrl)}`, { timeoutMs: 60000 });
    return { type: 'image', buffer, mime, caption: '🦈 a' };
  },
};
