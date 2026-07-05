// plugins/play.js

const INVIDIOUS_INSTANCES = [
  'https://inv.nadeko.net',
  'https://invidious.nerdvpn.de',
  'https://invidious.privacydev.net',
  'https://iv.melmac.space',
];

async function searchYoutube(query) {
  let lastErr = null;
  for (const base of INVIDIOUS_INSTANCES) {
    try {
      const res = await fetch(
        `${base}/api/v1/search?q=${encodeURIComponent(query)}&type=video&page=1`,
        { signal: AbortSignal.timeout(12000) }
      );
      if (!res.ok) { lastErr = new Error(`search gagal: ${res.status} dari ${base}`); continue; }
      const data = await res.json();
      if (!Array.isArray(data) || !data.length) { lastErr = new Error('video tidak ditemukan'); continue; }
      const v = data[0];
      return {
        videoId: v.videoId,
        title: v.title,
        author: v.author || v.authorName || 'unknown',
        duration: v.lengthSeconds || 0,
        views: v.viewCount || 0,
        thumbnail: `https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg`,
        url: `https://www.youtube.com/watch?v=${v.videoId}`
      };
    } catch (e) { lastErr = e; }
  }
  throw lastErr || new Error('semua instance invidious gagal, coba lagi nanti');
}

function fmtDuration(s) {
  s = Number(s) || 0;
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
  return `${m}:${String(sec).padStart(2,'0')}`;
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
  try { data = JSON.parse(rawText); } catch (_) { throw new Error('response nexray bukan JSON: ' + rawText.slice(0, 100)); }
  if (!data?.result?.url) throw new Error('URL audio tidak ditemukan dari nexray');
  return data.result.url;
}

async function downloadVideo(videoUrl) {
  const res = await fetch(
    `https://api.nexray.eu.cc/downloader/v1/ytmp4?url=${encodeURIComponent(videoUrl)}`,
    { signal: AbortSignal.timeout(60000) }
  );
  const rawText = await res.text();
  let data;
  try { data = JSON.parse(rawText); } catch (_) { throw new Error('response nexray bukan JSON: ' + rawText.slice(0, 100)); }
  if (!data?.result?.url) throw new Error('URL video tidak ditemukan dari nexray');
  return data.result.url;
}

module.exports = { searchYoutube, downloadAudio, downloadVideo, fmtDuration, fmtViews };
