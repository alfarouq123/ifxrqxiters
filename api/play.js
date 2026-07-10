const { searchYoutube, downloadAudio, downloadVideo } = require('../plugins/play');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'pake GET' });

  try {
    const action = req.query.action;
    const url    = req.query.url;

    if (!action || !url) return res.status(400).json({ error: 'action dan url diperlukan' });

    if (action === 'search') {
      const q = req.query.q;
      if (!q) return res.status(400).json({ error: 'query search diperlukan' });
      const result = await searchYoutube(q);
      return res.status(200).json(result);
    }

    if (action === 'audio') {
      const audioUrl = await downloadAudio(url);
      return res.status(200).json({ audioUrl });
    }

    if (action === 'video') {
      const videoUrl = await downloadVideo(url);
      return res.status(200).json({ videoUrl });
    }

    return res.status(400).json({ error: 'action harus search/audio/video' });
  } catch (err) {
    return res.status(500).json({ error: { message: err.message } });
  }
};
