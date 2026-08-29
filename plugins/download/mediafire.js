const mediafire = require('../../lib/scrapers/downloader/mediafire');
const { fetchBuffer } = require('../../lib/utils');

module.exports = {
  config: {
    name: 'mediafire', alias: ['mfdl'], category: 'download',
    description: 'Download file dari link MediaFire',
    usage: '@mediafire <url>', example: '@mediafire https://www.mediafire.com/file/xxxxx',
    inputType: 'text', outputType: 'file',
  },
  run: async ({ text }) => {
    const url = text.trim().split(/\s+/)[0];
    if (!url || !url.includes('mediafire.com')) { const e = new Error('link MediaFire gak valid'); e.status = 400; throw e; }
    const result = await mediafire(url);
    const { buffer, mime } = await fetchBuffer(result.download.link_download, 90000);
    const filename = (result.meta.title || 'mediafire-file').replace(/[\\/:*?"<>|]/g, '_');
    return { type: 'file', buffer, mime: mime || result.download.mimetype || 'application/octet-stream', filename };
  },
};
