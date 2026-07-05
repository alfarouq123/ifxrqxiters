// plugins/play.js
// search YouTube pake yt-search, download pake nexray API
// persis seperti plugin bot WA ourin

async function searchYoutube(query) {
  // pake YouTube search API publik dari synoxcloud atau invidious
  // karena kita gak bisa install yt-search di serverless vercel tanpa package.json deps
  // solusi: pake endpoint search dari invidious (publik, gak butuh key)
  const res = await fetch(
    `https://inv.nadeko.net/api/v1/search?q=${encodeURIComponent(query)}&type=video&page=1`,
    { signal: AbortSignal.timeout(15000) }
  );
  if (!res.ok) throw new Error('search gagal: ' + res.status);
  const data = await res.json();
  if (!Array.isArray(data) || !data.length) throw new Error('video tidak ditemukan');
  const v = data[0];
  return {
    videoId: v.videoId,
    title: v.title,
    author: v.author,
    duration: v.lengthSeconds,
    views: v.viewCount,
    thumbnail: `https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg`,
    url: `https://www.youtube.com/watch?v=${v.videoId}`
  };
}

function fmtDuration(s) {
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
  try { data = JSON.parse(rawText); } catch(_) { throw new Error('response nexray bukan JSON: ' + rawText.slice(0,100)); }
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
  try { data = JSON.parse(rawText); } catch(_) { throw new Error('response nexray bukan JSON: ' + rawText.slice(0,100)); }
  if (!data?.result?.url) throw new Error('URL video tidak ditemukan dari API nexray');
  return data.result.url;
}

module.exports = { searchYoutube, downloadAudio, downloadVideo, fmtDuration, fmtViews };
