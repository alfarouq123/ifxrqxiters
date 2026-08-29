const { fbdown } = require('../../lib/scrapers/downloader/facebook');
const { fetchBuffer } = require('../../lib/utils');

module.exports = {
  config: {
    name: 'facebook', alias: ['fb', 'fbdl'], category: 'download',
    description: 'Download video dari Facebook (link publik)',
    usage: '@facebook <url>', example: '@facebook https://www.facebook.com/watch?v=xxxxx',
    inputType: 'text', outputType: 'file',
  },
  run: async ({ text }) => {
    const url = text.trim().split(/\s+/)[0];
    if (!url || !url.includes('facebook.com') && !url.includes('fb.watch')) { const e = new Error('link Facebook gak valid'); e.status = 400; throw e; }

    const result = await fbdown(url);
    if (!result.status) throw new Error(result.message || 'gagal mengambil video');

    // API azbry biasanya balikin beberapa kemungkinan field nama link, coba semua yang umum dipakai
    const videoUrl = result.hd || result.url_hd || result.sd || result.url_sd || result.url || result.data?.hd || result.data?.sd
      || (Array.isArray(result.links) && (result.links.find((l) => l.quality === 'hd') || result.links[0])?.url);
    if (!videoUrl) throw new Error('link download tidak ditemukan di response API');

    const { buffer, mime } = await fetchBuffer(videoUrl, 60000);
    return { type: 'file', buffer, mime: mime || 'video/mp4', filename: 'facebook-video.mp4' };
  },
};
