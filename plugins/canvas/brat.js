// plugins/canvas/brat.js
// PORT PERSIS 100% dari src/lib/ourin-brat.js + bratgreen.js punya bot WA:
// token emoji/text/space, buildLines per-line width (trailing space dipuang),
// font "bold Npx sans-serif", loop decrement cuma cek totalH,
// render translate(cx,cy) + center per-line by -line.width/2,
// param bratgreen: 512×512, area 450×450, center 256, maxFont 130, dec 5, lh 1.1, #000.
const { createCanvas } = require('@napi-rs/canvas');

const VARIANTS = {
  default: '#8ACE00',
  green: '#8ACE00',
  white: '#FFFFFF',
  black: '#000000',
  pink: '#F5A9D0',
  blue: '#A9C9F5',
};

function getTokenWidth(ctx, token, fontSize) {
  if (token.type === 'space') return ctx.measureText(' ').width;
  if (token.type === 'emoji') return fontSize * 1.15;
  return ctx.measureText(token.value || '').width;
}

function buildLines(ctx, tokens, fontSize, maxW) {
  ctx.font = `bold ${fontSize}px sans-serif`;
  const lines = [];
  let line = [];
  let lineW = 0;
  for (const token of tokens) {
    const w = getTokenWidth(ctx, token, fontSize);
    if (token.type === 'space') {
      if (line.length > 0) { line.push({ ...token, w }); lineW += w; }
      continue;
    }
    if (line.length > 0 && lineW + w > maxW) {
      while (line.length > 0 && line[line.length - 1].type === 'space') {
        lineW -= line[line.length - 1].w;
        line.pop();
      }
      lines.push({ items: line, width: lineW });
      line = [{ ...token, w }];
      lineW = w;
    } else {
      line.push({ ...token, w });
      lineW += w;
    }
  }
  if (line.length > 0) {
    while (line.length > 0 && line[line.length - 1].type === 'space') {
      lineW -= line[line.length - 1].w;
      line.pop();
    }
    lines.push({ items: line, width: lineW });
  }
  return lines;
}

function tokenize(text) {
  const emojiRegex = /\p{Emoji_Presentation}|\p{Extended_Pictographic}/gu;
  const raw = [];
  let lastIndex = 0;
  let match;
  while ((match = emojiRegex.exec(text)) !== null) {
    if (match.index > lastIndex) raw.push({ type: 'text', value: text.slice(lastIndex, match.index) });
    raw.push({ type: 'emoji', value: match[0] });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) raw.push({ type: 'text', value: text.slice(lastIndex) });
  const tokens = [];
  for (const seg of raw) {
    if (seg.type === 'emoji') {
      if (tokens.length > 0) tokens.push({ type: 'space' });
      tokens.push({ type: 'emoji', value: seg.value });
    } else {
      const words = seg.value.split(/\s+/).filter((w) => w.length > 0);
      words.forEach((w) => {
        if (tokens.length > 0) tokens.push({ type: 'space' });
        tokens.push({ type: 'text', value: w });
      });
    }
  }
  return tokens;
}

function drawBrat({
  text, bgColor,
  width = 512, height = 512,
  centerX, centerY,
  maxWidth, maxHeight,
  rotationAngle = 0,
  maxFontSize = 130, minFontSize = 10, fontDecrement = 2,
  lineHeightMult = 1.2, textColor = '#000000',
  align = 'center', textBaseline = 'middle',
}) {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, width, height);

  const tokens = tokenize(text);
  let fontSize = maxFontSize;
  let lines = buildLines(ctx, tokens, fontSize, maxWidth);

  while (fontSize > minFontSize) {
    lines = buildLines(ctx, tokens, fontSize, maxWidth);
    const totalH = lines.length * fontSize * lineHeightMult;
    if (totalH <= maxHeight) break;
    fontSize -= fontDecrement;
  }

  const lineHeight = fontSize * lineHeightMult;
  const totalHeight = lines.length * lineHeight;
  const cx = typeof centerX === 'function' ? centerX(width, height) : (centerX || width / 2);
  const cy = typeof centerY === 'function' ? centerY(width, height) : (centerY || height / 2);

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rotationAngle);
  ctx.fillStyle = textColor;
  ctx.textBaseline = textBaseline;

  const startY = -(totalHeight / 2) + lineHeight / 2;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const y = startY + i * lineHeight;
    ctx.font = `bold ${fontSize}px sans-serif`;
    let currentX = align === 'center' ? -line.width / 2 : -(maxWidth / 2);
    for (const token of line.items) {
      if (token.type === 'text') {
        ctx.fillText(token.value, currentX, y);
        currentX += token.w;
      } else if (token.type === 'space') {
        currentX += token.w;
      }
    }
  }
  ctx.restore();
  return canvas.toBuffer('image/png');
}

module.exports = {
  config: {
    name: 'brat',
    alias: ['bratimg', 'brattext', 'bratgreen', 'brat2'],
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
    const textColor = bg === '#000000' ? '#FFFFFF' : '#000000';
    const buffer = drawBrat({
      text: content, bgColor: bg,
      width: 512, height: 512, maxWidth: 450, maxHeight: 450,
      centerX: 256, centerY: 256,
      maxFontSize: 130, fontDecrement: 5, lineHeightMult: 1.1,
      textColor,
    });
    return { type: 'image', buffer, mime: 'image/png', caption: `brat: "${content}" (${variantKey})` };
  },
};
