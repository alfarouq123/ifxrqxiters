// plugins/play.js
// search: pake ytapi.one (bisa diakses dari vercel, gak kena block)
// download: nexray.eu.cc (sama kayak plugin bot WA)

async function searchYoutube(query) {
  // ytapi.one — public, gak butuh key, bisa diakses dari server
  const res = await fetch(
    `https://ytapi.one/api/search?q=${encodeURIComponent(query)}&limit=1`,
    { signal: AbortSignal.timeout(15000) }
  );
  if (!res.ok) throw new Error(`search gagal: ${res.status}`);
  const raw = await res.text();
  let data;
  try { data = JSON.parse(raw); } catch(_) { throw new Error('response search bukan JSON'); }

  // ytapi.one balikin { data: [ { videoId, title, author, ... } ] }
  const list = data.data || data.videos || data.items || data.results || (Array.isArray(data) ? data : null);
  if (!list || !list.length) throw new Error('video tidak ditemukan');
  const v = list[0];

  const videoId = v.videoId || v.id || v.video_id;
  if (!videoId) throw new Error('videoId tidak ditemukan dari API search');

  return {
    videoId,
    title:     v.title || 'unknown',
    author:    v.author || v.channel || v.channelName || 'unknown',
    duration:  v.duration || v.length || 0,
    durationFmt: v.durationFormatted || v.timestamp || fmtDuration(v.duration || 0),
    views:     v.views || v.viewCount || 0,
    viewsFmt:  fmtViews(v.views || v.viewCount || 0),
    likes:     v.likes || v.likeCount || null,
    comments:  v.comments || v.commentCount || null,
    thumbnail: v.thumbnail || v.thumbnailUrl || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    url:       `https://www.youtube.com/watch?v=${videoId}`
  };
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
    { signal: AbortSignal.timeout(90000) }
  );
  const raw = await res.text();
  let data;
  try { data = JSON.parse(raw); } catch(_) { throw new Error('nexray audio: bukan JSON'); }
  if (!data?.result?.url) throw new Error('URL audio tidak ditemukan dari nexray');
  return data.result.url;
}

async function downloadVideo(videoUrl) {
  const res = await fetch(
    `https://api.nexray.eu.cc/downloader/v1/ytmp4?url=${encodeURIComponent(videoUrl)}`,
    { signal: AbortSignal.timeout(90000) }
  );
  const raw = await res.text();
  let data;
  try { data = JSON.parse(raw); } catch(_) { throw new Error('nexray video: bukan JSON'); }
  if (!data?.result?.url) throw new Error('URL video tidak ditemukan dari nexray');
  return data.result.url;
}

module.exports = { searchYoutube, downloadAudio, downloadVideo, fmtDuration, fmtViews };
