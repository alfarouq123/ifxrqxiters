const { getImage } = require('../../lib/engine/imageApi');

module.exports = {
  config: {
    name: 'musiccard', alias: ['nowplaying'],
    category: 'canvas',
    description: 'Membuat kartu musik "now playing" bergaya Spotify dari judul, artis, dan cover',
    usage: '/musiccard <judul>|<artis>|<url cover>',
    example: '/musiccard Blinding Lights|The Weeknd|https://example.com/cover.jpg',
    inputType: 'text', outputType: 'image',
  },
  run: async ({ text }) => {
    const [judul, artis, cover] = text.split('|').map((s) => (s || '').trim());
    if (!judul) { const e = new Error('format: /musiccard <judul>|<artis>|<url cover>'); e.status = 400; throw e; }
    const url = `https://api.nexray.eu.cc/canvas/musiccard?judul=${encodeURIComponent(judul)}&artist=${encodeURIComponent(artis || 'Unknown')}&image=${encodeURIComponent(cover || '')}`;
    const { buffer, mime } = await getImage(url);
    return { type: 'image', buffer, mime };
  },
};
