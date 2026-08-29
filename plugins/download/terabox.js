const { TeraBoxDL } = require('../../lib/scrapers/downloader/terabox');
const { fetchBuffer } = require('../../lib/utils');

module.exports = {
  config: {
    name: 'terabox', alias: ['tbdl'], category: 'download',
    description: 'Download file/video dari link TeraBox',
    usage: '@terabox <url>', example: '@terabox https://terabox.com/s/xxxxx',
    inputType: 'text', outputType: 'file',
  },
  run: async ({ text }) => {
    const url = text.trim().split(/\s+/)[0];
    if (!url || !/terabox|1024tera|teraboxapp/.test(url)) { const e = new Error('link TeraBox gak valid'); e.status = 400; throw e; }
    const result = await TeraBoxDL(url);
    if (!result.status || !result.download_url) throw new Error(result.error || 'gagal mengambil file');
    const { buffer, mime } = await fetchBuffer(result.download_url, 90000);
    const filename = (result.file_name || 'terabox-file').replace(/[\\/:*?"<>|]/g, '_');
    return { type: 'file', buffer, mime: mime || 'application/octet-stream', filename };
  },
};
