// plugins/play.js
// search YouTube pake Piped API (alternative Invidious yang lebih reliable)
// download pake nexray API

// FIX: pake Piped API instances (lebih stabil dari Invidious)
const PIPED_INSTANCES = [
  'pipedapi.kavin.rocks',
  'pipedapi.adminforge.de',
  'api.piped.projectsegfau.lt',
  'pipedapi.in.projectsegfau.lt',
  'pipedapi.leptons.xyz'
];

// fallback ke Invidious kalo Piped gagal
const INVIDIOUS_INSTANCES = [
  'yewtu.be',
  'vid.puffyan.us',
  'invidious.fdn.fr'
];

async function searchYoutube(query) {
  const errors = [];

  // coba Piped dulu
  for (const instance of PIPED_INSTANCES) {
    try {
      const res = await fetch(
        `https://${instance}/search?q=${encodeURIComponent(query)}&filter=videos`,
        { signal: AbortSignal.timeout(8000) }
      );
      if (!res.ok) {
        errors.push(`${instance} (piped): HTTP ${res.status}`);
        continue;
      }
      const data = await res.json();
      if (!data.items || !Array.isArray(data.items) || !data.items.length) {
        errors.push(`${instance} (piped): no results`);
        continue;
      }
      const v = data.items[0];
      if (!v.url && !v.id) {
        errors.push(`${instance} (piped): invalid result`);
        continue;
      }
      const videoId = v.url ? v.url.replace('/watch?v=', '') : v.id;
      return {
        videoId: videoId,
        title: v.title,
        author: v.uploaderName || v.uploader || 'Unknown',
        duration: v.duration || 0,
        views: v.views || 0,
        thumbnail: v.thumbnail || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        url: `https://www.youtube.com/watch?v=${videoId}`
      };
    } catch (e) {
      errors.push(`${instance} (piped): ${e.message}`);
      continue;
    }
  }

  // fallback ke Invidious
  for (const instance of INVIDIOUS_INSTANCES) {
    try {
      const res = await fetch(
        `https://${instance}/api/v1/search?q=${encodeURIComponent(query)}&type=video&page=1`,
        { signal: AbortSignal.timeout(8000) }
      );
      if (!res.ok) {
        errors.push(`${instance} (invidious): HTTP ${res.status}`);
        continue;
      }
      const data = await res.json();
      if (!Array.isArray(data) || !data.length) {
        errors.push(`${instance} (invidious): no results`);
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
      errors.push(`${instance} (invidious): ${e.message}`);
      continue;
    }
  }

  // semua instance gagal
  const err = new Error(
    'search gagal: semua API YouTube down.\n' +
    errors.slice(0, 5).map(e => '  • ' + e).join('\n')
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
