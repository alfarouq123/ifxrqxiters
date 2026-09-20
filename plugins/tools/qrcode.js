// plugins/tools/qrcode.js — QR code generator 100% lokal (lib qrcode, gak pake API luar)
const QRCode = require('qrcode');

module.exports = {
  config: {
    name: 'qrcode', alias: ['qr'],
    category: 'tools',
    description: 'Bikin QR code dari teks/link apa pun',
    usage: '@qrcode <teks/link>', example: '@qrcode https://ifxrqxiters.my.id',
    inputType: 'text', outputType: 'image',
  },
  run: async ({ text }) => {
    if (!text.trim()) { const e = new Error('teksnya kosong, contoh: @qrcode https://google.com'); e.status = 400; throw e; }
    const buffer = await QRCode.toBuffer(text.trim(), { width: 512, margin: 2, color: { dark: '#111111', light: '#FFFFFF' } });
    return { type: 'image', buffer, mime: 'image/png', caption: text.trim().slice(0, 80) };
  },
};
