const x2twitterDl = require('../../lib/scrapers/downloader/twitter');
const { fetchBuffer } = require('../../lib/utils');

module.exports = {
  config: {
    name: 'twitter', alias: ['x', 'xdl', 'twdl'], category: 'download',
    description: 'Download video dari X/Twitter',
    usage: '@twitter <url>', example: '@twitter https://x.com/user/status/xxxxx',
    inputType: 'text', outputType: 'file',
  },
  run: async ({ text }) => {
    const url = text.trim().split(/\s+/)[0];
    if (!url || !/(twitter\.com|x\.com)/.test(url)) { const e = new Error('link X/Twitter gak valid'); e.status = 400; throw e; }

    const result = await x2twitterDl(url);
    if (result.error || !result.videos?.length) throw new Error(result.message || 'gagal mengambil video (mungkin post-nya cuma teks/gambar)');

    const best = result.videos.reduce((a, b) => (parseInt(b.resolution) > parseInt(a.resolution) ? b : a));
    const { buffer, mime } = await fetchBuffer(best.url, 60000);
    return { type: 'file', buffer, mime: mime || 'video/mp4', filename: `twitter-${best.resolution}.mp4` };
  },
};
