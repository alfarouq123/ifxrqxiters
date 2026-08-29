const { RedditDL } = require('../../lib/scrapers/downloader/reddit');
const { fetchBuffer } = require('../../lib/utils');

module.exports = {
  config: {
    name: 'reddit', alias: ['redditdl'], category: 'download',
    description: 'Download video/gambar dari post Reddit',
    usage: '@reddit <url>', example: '@reddit https://www.reddit.com/r/xxx/comments/xxxxx',
    inputType: 'text', outputType: 'file',
  },
  run: async ({ text }) => {
    const url = text.trim().split(/\s+/)[0];
    if (!url || !url.includes('reddit.com')) { const e = new Error('link Reddit gak valid'); e.status = 400; throw e; }
    const result = await RedditDL(url);
    if (!result.status || !result.results?.length) throw new Error(result.error || 'gagal mengambil media');
    const first = result.results[0];
    const dlUrl = first.download_url.startsWith('http') ? first.download_url : `https://redvid.io${first.download_url}`;
    const { buffer, mime } = await fetchBuffer(dlUrl, 60000);
    const ext = first.type === 'video' ? 'mp4' : 'jpg';
    return { type: 'file', buffer, mime: mime || (ext === 'mp4' ? 'video/mp4' : 'image/jpeg'), filename: `reddit-${Date.now()}.${ext}` };
  },
};
