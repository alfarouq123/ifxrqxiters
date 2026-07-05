// plugins/play.js
// search YouTube pake invidious API (multiple instances buat fallback)
// download pake nexray API — persis kayak plugin bot WA

// FIX BUG 2: multiple invidious instances, coba satu-satu sampe ada yang respond
const INVIDIOUS_INSTANCES = [
  'inv.nadeko.net',
  'invidious.fdn.fr',
  'invidious.privacyredirect.com',
  'vid.puffyan.us',
  'yewtu.be',
  'invidious.lunar.icu',
  'iv.nboeck.de',
  'invidious.protokolla.fi',
  'yt.artemislena.eu'
];

async function searchYoutube(query) {
  const errors = [];

  for (const instance of INVIDIOUS_INSTANCES) {
    try {
      const res = await fetch(
        `https://${instance}/api/v1/search?q=${encodeURIComponent(query)}&type=video&page=1`,
        { signal: AbortSignal.timeout(8000) }
      );
      if (!res.ok) {
        errors.push(`${instance}: HTTP ${res.status}`);
        continue;
      }
      const data = await res.json();
      if (!Array.isArray(data) || !data.length) {
        errors.push(`${instance}: no results`);
        continue;
      }
      const v = data[0];
      return {
        videoId: v.videoId,
        title: v.title,
        author: v.author || v.authorId || 'Unknown',
        duration: v.lengthSeconds || 0,
        views: v.viewCount || 0,
        thumbnail: `https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg`,
        url: `https://www.youtube.com/watch?v=${v.videoId}`
      };
    } catch (e) {
      errors.push(`${instance}: ${e.message}`);
      continue;
    }
  }

  // semua instance gagal
  const err = new Error(
    'search gagal: semua instance invidious down.\n' +
    errors.slice(0, 4).map(e => '  • ' + e).join('\n')
  );
  err.status = 503;
  throw err;
}

function fmtDuration(s) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  return `${m}:${String(sec).padStart(2, '0')}`;
}

function fmtViews(n) {
  if (!n) return '0';
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return String(n);
}

async function downloadAudio(videoUrl) {
  const res = await fetch(
    `https://api.nexray.eu.cc/downloader/v1/ytmp3?url=${encodeURIComponent(videoUrl)}`,
    { signal: AbortSignal.timeout(60000) }
  );
  const rawText = await res.text();
  let data;
  try {
    data = JSON.parse(rawText);
  } catch (_) {
    throw new Error('response nexray bukan JSON: ' + rawText.slice(0, 100));
  }
  if (!data?.result?.url) throw new Error('URL audio tidak ditemukan dari API nexray');
  return data.result.url;
}

async function downloadVideo(videoUrl) {
  const res = await fetch(
    `https://api.nexray.eu.cc/downloader/v1/ytmp4?url=${encodeURIComponent(videoUrl)}`,
    { signal: AbortSignal.timeout(60000) }
  );
  const rawText = await res.text();
  let data;
  try {
    data = JSON.parse(rawText);
  } catch (_) {
    throw new Error('response nexray bukan JSON: ' + rawText.slice(0, 100));
  }
  if (!data?.result?.url) throw new Error('URL video tidak ditemukan dari API nexray');
  return data.result.url;
}

module.exports = { searchYoutube, downloadAudio, downloadVideo, fmtDuration, fmtViews };
