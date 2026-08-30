// plugins/canvas/brat.js
// Generator gambar gaya "brat" (background polos minimalis + teks kecil rata kiri, sedikit blur).
// Dirender 100% lokal pakai @napi-rs/canvas, gak manggil API luar & gak pakai aset gambar
// berhak cipta apapun — cuma warna solid + teks, jadi aman dipakai bebas.
const { createCanvas } = require('@napi-rs/canvas');

const VARIANTS = {
  default: '#8ACE00', // hijau khas
  green: '#8ACE00',
  white: '#FFFFFF',
  black: '#000000',
  pink: '#F5A9D0',
  blue: '#A9C9F5',
};

function wrapText(ctx, text, maxWidth) {
  const words = text.split(/\s+/);
  const lines = [];
  let line = '';
  for (const word of words) {
    const test = line ? line + ' ' + word : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function renderBrat(text, variantKey) {
  const size = 800;
  const bg = VARIANTS[variantKey] || VARIANTS.default;
  const isDark = bg === '#000000';
  const textColor = isDark ? '#FFFFFF' : '#111111';

  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, size, size);

  // sedikit noise/blur look ala cover brat (pakai filter blur ringan di layer teks)
  ctx.filter = 'blur(0.6px)';
  ctx.fillStyle = textColor;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';

  let fontSize = Math.floor(size / Math.max(4, Math.sqrt(text.length) * 1.8));
  fontSize = Math.max(36, Math.min(fontSize, 110));
  ctx.font = `${fontSize}px Arial`;

  const padding = 56;
  const maxWidth = size - padding * 2;
  let lines = wrapText(ctx, text.toLowerCase(), maxWidth);

  // kalo kepanjangan & lines kebanyakan, kecilin font lagi
  while (lines.length * (fontSize * 1.05) > size - padding * 2 && fontSize > 20) {
    fontSize -= 4;
    ctx.font = `${fontSize}px Arial`;
    lines = wrapText(ctx, text.toLowerCase(), maxWidth);
  }

  const lineHeight = fontSize * 1.05;
  const totalHeight = lines.length * lineHeight;
  let y = (size - totalHeight) / 2 + lineHeight / 2;

  for (const line of lines) {
    ctx.fillText(line, padding, y);
    y += lineHeight;
  }
  ctx.filter = 'none';

  return canvas.toBuffer('image/png');
}

module.exports = {
  config: {
    name: 'brat',
    alias: ['bratimg', 'brattext', 'bratgreen'],
    category: 'canvas',
    description: 'Bikin gambar gaya "brat" (background polos + teks kecil) dari teks kamu, dikirim sebagai foto',
    usage: '@brat <teks> [warna: green/white/black/pink/blue]',
    example: '@brat hai semua',
    inputType: 'text',
    outputType: 'image',
  },
  run: async ({ text }) => {
    if (!text.trim()) {
      const e = new Error('teks kosong, contoh: @brat hai semua');
      e.status = 400;
      throw e;
    }
    const words = text.trim().split(/\s+/);
    const lastWord = words[words.length - 1].toLowerCase();
    let variantKey = 'default';
    let content = text.trim();
    if (VARIANTS[lastWord]) {
      variantKey = lastWord;
      content = words.slice(0, -1).join(' ') || lastWord;
    }

    const buffer = renderBrat(content, variantKey);
    return { type: 'image', buffer, mime: 'image/png', caption: `brat: "${content}"` };
  },
};
