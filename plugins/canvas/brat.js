// plugins/canvas/brat.js
// Port PERSIS dari src/lib/ourin-brat.js punya bot WA (IFxrqBotz):
//   512×512, maxFontSize 130 turun -5, lineHeightMult 1.1, area teks 450×450
//   centered (256,256), emoji dihitung 1.15× fontSize, trailing space dibuang.
// Dirender 100% lokal pakai @napi-rs/canvas — gak manggil API luar.
const { createCanvas } = require('@napi-rs/canvas');

const VARIANTS = {
  default: '#8ACE00',
  green: '#8ACE00',
  white: '#FFFFFF',
  black: '#000000',
  pink: '#F5A9D0',
  blue: '#A9C9F5',
};

const EMOJI_RE = /(\p{Extended_Pictographic}|\p{Emoji_Presentation}|\uFE0F|\u200D)/u;

/* tokenize — persis ourin-brat: pecah per kata, emoji jadi token sendiri, width emoji = 1.15× fontSize */
function tokenize(text) {
  const raw = String(text).split(/\s+/).filter(Boolean);
  const tokens = [];
  for (const word of raw) {
    const parts = word.split(/(\p{Extended_Pictographic}+|\p{Emoji_Presentation}+)/u).filter(Boolean);
    for (const part of parts) {
      if (EMOJI_RE.test(part)) {
        for (const ch of part.match(/\p{Extended_Pictographic}|\p{Emoji_Presentation}/gu) || []) {
          tokens.push({ text: ch, emoji: true });
        }
      } else {
        tokens.push({ text: part, emoji: false });
      }
    }
  }
  return tokens;
}

/* buildLines — greedy fill maxWidth, trailing space dibuang */
function buildLines(ctx, tokens, fontSize, maxWidth) {
  const lines = [];
  let line = '';
  let lineW = 0;
  for (const tok of tokens) {
    const tokW = tok.emoji ? fontSize * 1.15 : ctx.measureText(tok.text).width;
    const spaceW = line ? ctx.measureText(' ').width : 0;
    if (line && lineW + spaceW + tokW > maxWidth) {
      lines.push(line.replace(/\s+$/, ''));
      line = tok.text;
      lineW = tokW;
    } else {
      line += (line ? ' ' : '') + tok.text;
      lineW += spaceW + tokW;
    }
  }
  if (line.trim()) lines.push(line.replace(/\s+$/, ''));
  return lines;
}

function drawBrat({ text, bgColor, width = 512, height = 512, maxWidth = 450, maxHeight = 450,
                    centerX = 256, centerY = 256, maxFontSize = 130, fontDecrement = 5,
                    minFontSize = 20, lineHeightMult = 1.1, textColor = '#111111', rotationAngle = 0 }) {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, width, height);

  const tokens = tokenize(text);

  /* cari fontSize yang muat: semua baris ≤ maxWidth & total tinggi ≤ maxHeight */
  let fontSize = maxFontSize;
  let lines = [];
  for (;;) {
    ctx.font = `bold ${fontSize}px Arial, sans-serif`;
    lines = buildLines(ctx, tokens, fontSize, maxWidth);
    const totalH = lines.length * fontSize * lineHeightMult;
    const widest = lines.reduce((w, l) => Math.max(w, ctx.measureText(l).width), 0);
    if ((totalH <= maxHeight && widest <= maxWidth) || fontSize <= minFontSize) break;
    fontSize -= fontDecrement;
  }

  const lineHeight = fontSize * lineHeightMult;
  const totalH = lines.length * lineHeight;

  ctx.save();
  if (rotationAngle) {
    ctx.translate(centerX, centerY);
    ctx.rotate(rotationAngle);
    ctx.translate(-centerX, -centerY);
  }
  ctx.fillStyle = textColor;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';

  let y = centerY - totalH / 2 + lineHeight / 2;
  for (const line of lines) {
    const lw = ctx.measureText(line).width;
    ctx.fillText(line, centerX - lw / 2, y);
    y += lineHeight;
  }
  ctx.restore();

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
    if (VARIANTS[lastWord] && words.length > 1) {
      variantKey = lastWord;
      content = words.slice(0, -1).join(' ');
    }
    const bg = VARIANTS[variantKey] || VARIANTS.default;
    const textColor = bg === '#000000' ? '#FFFFFF' : '#111111';
    const buffer = drawBrat({ text: content.toLowerCase(), bgColor: bg, textColor });
    return { type: 'image', buffer, mime: 'image/png', caption: `brat: "${content}" (${variantKey})` };
  },
};
