// api/play.js — route tipis, manggil plugins/play.js
// Vercel otomatis bikin route /api/play dari file ini

const { searchYoutube, downloadAudio, downloadVideo, fmtDuration, fmtViews } = require('../plugins/play.js');

module.exports = async function handler(req, res) {
  // CORS headers (biar aman)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  const { action, query, url } = req.query;

  try {
    if (action === 'search') {
      if (!query) {
        return res.status(400).json({ ok: false, error: { message: 'query kosong' } });
      }
      const result = await searchYoutube(query);
      return res.json({
        ok: true,
        videoId: result.videoId,
        title: result.title,
        author: result.author,
        duration: result.duration,
        durationFmt: fmtDuration(result.duration),
        views: result.views,
        viewsFmt: fmtViews(result.views),
        thumbnail: result.thumbnail,
        url: result.url
      });
    }

    if (action === 'audio') {
      if (!url) {
        return res.status(400).json({ ok: false, error: { message: 'url kosong' } });
      }
      const audioUrl = await downloadAudio(url);
      return res.json({ ok: true, audioUrl });
    }

    if (action === 'video') {
      if (!url) {
        return res.status(400).json({ ok: false, error: { message: 'url kosong' } });
      }
      const videoUrl = await downloadVideo(url);
      return res.json({ ok: true, videoUrl });
    }

    return res.status(400).json({ ok: false, error: { message: 'action tidak valid, pake: search, audio, atau video' } });

  } catch (err) {
    console.error('[api/play] error:', err.message);
    return res.status(err.status || 500).json({
      ok: false,
      error: { message: err.message }
    });
  }
};
