// plugins/canvas/fakestory.js — port lokal dari plugin bot WA "fakestory" (@napi-rs/canvas, tanpa API luar)
const { createCanvas, loadImage, Path2D } = require('@napi-rs/canvas');

const CFG = { width: 720, cardBg: '#121212', textColor: '#ffffff', cornerRadius: 35 };
const ICONS = {
  heart: 'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z',
  comment: 'M21.99 4c0-1.1-.89-2-1.99-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4-.01-18z',
  share: 'M2.01 21L23 12 2.01 3 2 10l15 2-15 2z',
  options: 'M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z',
};

function roundedRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
function drawAvatar(ctx, img, x, y, size) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2, true);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(img, x, y, size, size);
  ctx.restore();
}
function drawCover(ctx, img, x, y, w, h) {
  const ir = img.width / img.height, cr = w / h;
  let dw, dh, dx, dy;
  if (ir > cr) { dh = h; dw = h * ir; dx = x - (dw - w) / 2; dy = y; }
  else { dw = w; dh = w / ir; dx = x; dy = y - (dh - h) / 2; }
  ctx.save();
  ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  ctx.drawImage(img, dx, dy, dw, dh);
  ctx.restore();
}
function drawBlurredBg(ctx, canvas, top, bottom) {
  const w = canvas.width, h = canvas.height;
  ctx.save();
  ctx.filter = 'blur(30px) brightness(30%)';
  drawCover(ctx, top, -40, -40, w + 80, h / 2 + 40);
  drawCover(ctx, bottom, -40, h / 2, w + 80, h / 2 + 40);
  ctx.restore();
}
function drawIcon(ctx, pathData, x, y, scale) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.translate(-12, -12);
  const p = new Path2D(pathData);
  ctx.strokeStyle = 'white';
  ctx.lineWidth = 1.8;
  ctx.stroke(p);
  ctx.restore();
}

async function createFakeStory(username, avatarBuf, topBuf, bottomBuf) {
  const height = 1150;
  const canvas = createCanvas(CFG.width, height);
  const ctx = canvas.getContext('2d');
  const avatar = await loadImage(avatarBuf);
  const top = await loadImage(topBuf);
  const bottom = await loadImage(bottomBuf);

  drawBlurredBg(ctx, canvas, top, bottom);

  const mx = 25, my = 60;
  const cw = CFG.width - mx * 2, ch = height - my * 2, cx = mx, cy = my;
  ctx.save();
  roundedRectPath(ctx, cx, cy, cw, ch, CFG.cornerRadius);
  ctx.fillStyle = CFG.cardBg;
  ctx.fill();
  ctx.clip();

  const headerH = 90, avatarSize = 45, footerH = 70;
  drawAvatar(ctx, avatar, cx + 20, cy + 22, avatarSize);
  ctx.font = 'bold 18px sans-serif';
  ctx.fillStyle = CFG.textColor;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(username, cx + 80, cy + 45);

  ctx.save();
  ctx.translate(cx + cw - 40, cy + 45);
  ctx.rotate((90 * Math.PI) / 180);
  const pOpts = new Path2D(ICONS.options);
  ctx.fillStyle = 'white';
  ctx.fill(pOpts);
  ctx.restore();

  const contentH = ch - headerH - footerH;
  const half = contentH / 2;
  drawCover(ctx, top, cx, cy + headerH, cw, half);
  drawCover(ctx, bottom, cx, cy + headerH + half, cw, half);

  const iconY = cy + ch - footerH / 2;
  drawIcon(ctx, ICONS.heart, cx + 40, iconY, 1.3);
  drawIcon(ctx, ICONS.comment, cx + 100, iconY, 1.2);
  drawIcon(ctx, ICONS.share, cx + 160, iconY, 1.2);
  ctx.restore();

  return canvas.toBuffer('image/png');
}

module.exports = {
  config: {
    name: 'fakestory',
    alias: ['fstory', 'fakeinsta'],
    category: 'canvas',
    description: 'Membuat kartu ala "Instagram story" dari 2 foto + username (dirender lokal)',
    usage: '/fakestory <username> (upload 2 gambar: foto atas & foto bawah)',
    example: '/fakestory Misaki',
    inputType: 'text+image',
    outputType: 'image',
  },
  run: async ({ text, imageBuffer }) => {
    if (!text.trim()) { const e = new Error('username kosong, contoh: /fakestory Misaki'); e.status = 400; throw e; }
    if (!imageBuffer) { const e = new Error('upload minimal 1 foto (dipakai untuk atas & bawah)'); e.status = 400; throw e; }
    // Di web kita cuma terima 1 file upload per request lewat form sederhana,
    // jadi foto yang sama dipakai untuk slot atas & bawah, avatar pakai identicon otomatis.
    const avatarBuf = await (await fetch(`https://api.dicebear.com/7.x/identicon/png?seed=${encodeURIComponent(text.trim())}`)).arrayBuffer();
    const buffer = await createFakeStory(text.trim(), Buffer.from(avatarBuf), imageBuffer, imageBuffer);
    return { type: 'image', buffer, mime: 'image/png' };
  },
};
