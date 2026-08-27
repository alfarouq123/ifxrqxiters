// plugins/canvas/topixel.js — efek pixel art dari foto, digambar lokal pakai @napi-rs/canvas
const { createCanvas, loadImage } = require('@napi-rs/canvas');

module.exports = {
  config: {
    name: 'topixel', alias: ['pixelart'],
    category: 'canvas',
    description: 'Mengubah foto jadi gambar pixel art (diproses lokal)',
    usage: '/topixel (upload foto) [ukuran blok, default 12]',
    example: '/topixel 16',
    inputType: 'text+image', outputType: 'image',
  },
  run: async ({ imageBuffer, text }) => {
    if (!imageBuffer) { const e = new Error('upload foto dulu'); e.status = 400; throw e; }
    const blockSize = Math.max(4, Math.min(40, parseInt(text) || 12));

    const img = await loadImage(imageBuffer);
    const W = 720, H = Math.round((img.height / img.width) * 720) || 720;

    const small = createCanvas(Math.ceil(W / blockSize), Math.ceil(H / blockSize));
    const sctx = small.getContext('2d');
    sctx.imageSmoothingEnabled = true;
    sctx.drawImage(img, 0, 0, small.width, small.height);

    const out = createCanvas(W, H);
    const octx = out.getContext('2d');
    octx.imageSmoothingEnabled = false;
    octx.drawImage(small, 0, 0, small.width, small.height, 0, 0, W, H);

    const buffer = out.toBuffer('image/png');
    return { type: 'image', buffer, mime: 'image/png', caption: `pixel art (blok ${blockSize}px) ✅` };
  },
};
