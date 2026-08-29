const instagramDownloader = require('../../lib/scrapers/downloader/instagram');
const { fetchBuffer } = require('../../lib/utils');

module.exports = {
  config: {
    name: 'instagram', alias: ['ig', 'igdl'], category: 'download',
    description: 'Download foto/video/reels dari Instagram (link publik)',
    usage: '@instagram <url>', example: '@instagram https://www.instagram.com/p/xxxxx',
    inputType: 'text', outputType: 'file',
  },
  run: async ({ text }) => {
    const url = text.trim().split(/\s+/)[0];
    if (!url || !url.includes('instagram.com')) { const e = new Error('link Instagram gak valid'); e.status = 400; throw e; }

    const result = await instagramDownloader(url);
    if (!result.status || !result.media?.length) throw new Error('gagal mengambil media, pastikan post-nya publik');

    const first = result.media[0];
    const { buffer, mime } = await fetchBuffer(first.url, 60000);
    const ext = first.type === 'video' ? 'mp4' : 'jpg';
    const filename = `instagram-${(result.username || 'post').replace(/[^a-z0-9]/gi, '')}.${ext}`;

    if (result.media.length > 1) {
      return { type: 'file', buffer, mime, filename, caption: `1 dari ${result.media.length} media (post ini punya beberapa slide, cuma yang pertama yang bisa ditampilkan di sini)` };
    }
    return { type: 'file', buffer, mime, filename };
  },
};
