// api/play.js — route handler, logic di plugins/play.js
const { searchYoutube, downloadAudio, downloadVideo, fmtDuration, fmtViews } = require('../plugins/play');

module.exports = async (req, res) => {
  if (req.method !== 'GET') return res.status(405).json({ error: { message: 'pake GET' } });

  const { action, query, url } = req.query;

  try {
    if (action === 'search') {
      if (!query) return res.status(400).json({ error: { message: 'query kosong' } });
      const info = await searchYoutube(query);
      return res.status(200).json({ ok: true, ...info });
    }
    if (action === 'audio') {
      if (!url) return res.status(400).json({ error: { message: 'url kosong' } });
      const audioUrl = await downloadAudio(url);
      return res.status(200).json({ ok: true, audioUrl });
    }
    if (action === 'video') {
      if (!url) return res.status(400).json({ error: { message: 'url kosong' } });
      const videoUrl = await downloadVideo(url);
      return res.status(200).json({ ok: true, videoUrl });
    }
    return res.status(400).json({ error: { message: 'action harus: search / audio / video' } });
  } catch (err) {
    return res.status(err.status || 500).json({ error: { message: err.message } });
  }
};
