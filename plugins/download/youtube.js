const { ytdl } = require('../../lib/scrapers/downloader/youtube');
const { fetchBuffer } = require('../../lib/utils');

module.exports = {
  config: {
    name: 'youtube', alias: ['yt', 'ytmp3', 'ytmp4'], category: 'download',
    description: 'Download audio/video dari YouTube. Tambahkan "mp4" di akhir buat video, default audio mp3',
    usage: '@youtube <url> [mp4]', example: '@youtube https://youtu.be/dQw4w9WgXcQ',
    inputType: 'text', outputType: 'file',
  },
  run: async ({ text }) => {
    const parts = text.trim().split(/\s+/);
    const url = parts.find((p) => /youtu\.?be/.test(p));
    if (!url) { const e = new Error('link YouTube gak valid. contoh: @youtube https://youtu.be/xxxx'); e.status = 400; throw e; }
    const format = /mp4|video/i.test(text) ? 'mp4' : 'mp3';

    const result = await ytdl(url, format);
    if (!result.status || !result.dl) throw new Error(result.mess || 'gagal download, coba lagi');

    const { buffer, mime } = await fetchBuffer(result.dl, 90000);
    const ext = format === 'mp4' ? 'mp4' : 'mp3';
    const safeTitle = (result.title || 'youtube-download').replace(/[\\/:*?"<>|]/g, '').slice(0, 60);
    return { type: 'file', buffer, mime: mime || (format === 'mp4' ? 'video/mp4' : 'audio/mpeg'), filename: `${safeTitle}.${ext}` };
  },
};
