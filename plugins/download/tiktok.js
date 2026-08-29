const ttdown = require('../../lib/scrapers/downloader/tiktok');
const { fetchBuffer } = require('../../lib/utils');

module.exports = {
  config: {
    name: 'tiktok', alias: ['tt', 'ttdl'], category: 'download',
    description: 'Download video TikTok tanpa watermark (atau audio-nya)',
    usage: '@tiktok <url> [audio]', example: '@tiktok https://vt.tiktok.com/xxxxx',
    inputType: 'text', outputType: 'file',
  },
  run: async ({ text }) => {
    const url = text.trim().split(/\s+/)[0];
    if (!url || !url.includes('tiktok.com')) { const e = new Error('link TikTok gak valid'); e.status = 400; throw e; }
    const wantAudio = /audio|mp3|musik/i.test(text);

    const result = await ttdown(url);
    if (!result?.downloads?.length) throw new Error('gagal mengambil video, coba lagi');

    let picked = wantAudio
      ? result.downloads.find((d) => d.type === 'mp3')
      : result.downloads.find((d) => d.type === 'nowatermark_hd') || result.downloads.find((d) => d.type === 'nowatermark');
    if (!picked) picked = result.downloads[0];

    const { buffer, mime } = await fetchBuffer(picked.url, 60000);
    const ext = picked.type === 'mp3' ? 'mp3' : 'mp4';
    const safeTitle = (result.title || 'tiktok').replace(/[\\/:*?"<>|]/g, '').slice(0, 60);
    return { type: 'file', buffer, mime: mime || (ext === 'mp3' ? 'audio/mpeg' : 'video/mp4'), filename: `${safeTitle}.${ext}` };
  },
};
