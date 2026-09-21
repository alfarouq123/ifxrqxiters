// lib/routes/studio.js — IFz Studio: AI video (Veo) + image (Nano Banana) creator
// Pakai Gemini API key dari env (yang sama dengan /api/chat) — key pool GEMINI_API_KEYS
// (comma-separated) di-rotate otomatis pas kena limit (429) → praktis "unlimited":
// tambah key gratis dari aistudio.google.com (per akun google) kapan aja.
//
//   GET  /api/studio                              → katalog model (nama IFz/Laps + durasi)
//   POST {action:'image', model, prompt, aspect}  → {url|base64}
//   POST {action:'veo-start', model, prompt, seconds, aspect} → {op}
//   POST {action:'veo-poll', op}                  → {pending|url}
const { uploadToUguu } = require('../../plugins/ai-core/edit');

const GEM = 'https://generativelanguage.googleapis.com/v1beta';

function keys() {
  return String(process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || '')
    .split(',').map((s) => s.trim()).filter(Boolean);
}

/* ── katalog (nama web = punya sendiri, mesin = google flow) ── */
const VIDEO_MODELS = {
  'ifz-low':    { label: 'IFz Low',    durations: [4, 6, 8],    desc: 'cepat & hemat — buat eksperimen', chain: ['veo-3.1-lite-generate-preview'] },
  'ifz-lite':   { label: 'IFz Lite',   durations: [4, 6, 8],    desc: 'kualitas seimbang, generate cepat', chain: ['veo-3.1-fast-generate-preview'] },
  'ifz-ultra':  { label: 'IFz Ultra',  durations: [8],          desc: 'kualitas tertinggi — detail & sinematik', chain: ['veo-3.1-generate-preview'] },
  'ifz-stable': { label: 'IFz Stable', durations: [4, 6, 8, 10], desc: 'stabil 720p, durasi paling fleksibel', chain: ['veo-3.1-lite-generate-preview'] },
};
const IMAGE_MODELS = {
  'laps-lite':  { label: 'Laps Lite',  desc: 'hasil cepat, buat iterasi ide', chain: ['gemini-3.1-flash-lite-image'] },
  'laps-fast':  { label: 'IFz Laps Fast', desc: 'nano banana 2 — detail bagus', chain: ['gemini-3.1-flash-image', 'gemini-2.5-flash-image'] },
  'laps-ultra': { label: 'Laps Ultra', desc: 'nano banana 2 pro — kualitas max', chain: ['nano-banana-pro-preview', 'gemini-3-pro-image-preview'] },
};

async function gemFetch(path, opts, key) {
  const res = await fetch(`${GEM}${path}${path.includes('?') ? '&' : '?'}key=${key}`, {
    ...opts,
    signal: AbortSignal.timeout(opts.timeoutMs || 55000),
  });
  return res;
}

/* request dengan rotasi key + fallback model chain */
async function gemChain(models, buildReq) {
  const ks = keys();
  if (!ks.length) { const e = new Error('belum ada Gemini API key — set GEMINI_API_KEY / GEMINI_API_KEYS di Vercel'); e.nokey = true; throw e; }
  let lastErr = null;
  for (const model of models) {
    for (let ki = 0; ki < ks.length; ki++) {
      const key = ks[ki];
      try {
        const { path, opts } = buildReq(model, key);
        const res = await gemFetch(path, opts, key);
        const data = await res.json().catch(() => ({}));
        if (res.ok) return data;
        const msg = data?.error?.message || `http ${res.status}`;
        /* 429 = key ini habis kuota → coba key berikutnya */
        if (res.status === 429 || /RESOURCE_EXHAUSTED/i.test(msg)) { lastErr = new Error('kuota key habis: ' + msg); continue; }
        /* 404 / model gak tersedia → model berikutnya di chain */
        if (res.status === 404 || /not found|not supported/i.test(msg)) { lastErr = new Error('model gak tersedia: ' + msg); break; }
        lastErr = new Error(msg);
        /* error lain (400 dkk) → coba model lain juga */
        break;
      } catch (e) {
        if (e.name === 'TimeoutError') { lastErr = new Error('timeout ke gemini'); continue; }
        lastErr = e;
      }
    }
  }
  const m = String((lastErr && lastErr.message) || 'gemini gagal');
  if (/kuota|quota|RESOURCE_EXHAUSTED|billing/i.test(m)) {
    throw new Error('key lu belum punya kuota Veo (tier gratis = 0). aktifin billing di aistudio.google.com / tambahin key ber-kuota ke env GEMINI_API_KEYS — ATAU pake mode animasi otomatis (fallback gratis)');
  }
  throw lastErr || new Error('gemini gagal');
}

/* ── pollinations fallback image (tanpa key, gak ada limit keras) ── */
async function pollinationsImage(prompt, aspect) {
  const [w, h] = aspect === '9:16' ? [768, 1344] : aspect === '16:9' ? [1344, 768] : [1024, 1024];
  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${w}&height=${h}&nologo=true&model=flux`;
  const res = await fetch(url, { signal: AbortSignal.timeout(55000) });
  if (!res.ok) throw new Error('pollinations gagal http ' + res.status);
  return { buffer: Buffer.from(await res.arrayBuffer()), mime: 'image/jpeg', via: 'pollinations' };
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    /* ── katalog ── */
    if (req.method === 'GET') {
      return res.status(200).json({
        ok: true,
        video: Object.entries(VIDEO_MODELS).map(([key, m]) => ({ key, label: m.label, durations: m.durations, desc: m.desc })),
        image: Object.entries(IMAGE_MODELS).map(([key, m]) => ({ key, label: m.label, desc: m.desc })),
        keys: keys().length,
      });
    }
    if (req.method !== 'POST') return res.status(405).json({ error: 'pake POST' });

    const { action, model, prompt, seconds, aspect } = req.body || {};
    const p = String(prompt || '').trim();

    /* ── IMAGE ── */
    if (action === 'image') {
      if (!p) return res.status(400).json({ error: 'prompt kosong' });
      const cfg = IMAGE_MODELS[model] || IMAGE_MODELS['laps-lite'];
      try {
        const data = await gemChain(cfg.chain, (m) => ({
          path: `/models/${m}:generateContent`,
          opts: {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: p }] }],
              generationConfig: { responseModalities: ['IMAGE'], ...(aspect && aspect !== '1:1' ? { imageConfig: { aspectRatio: aspect } } : {}) },
            }),
          },
        }));
        const part = (data?.candidates?.[0]?.content?.parts || []).find((x) => x?.inlineData?.data);
        if (!part) throw new Error('gemini gak balikin gambar');
        const buf = Buffer.from(part.inlineData.data, 'base64');
        const mime = part.inlineData.mimeType || 'image/png';
        if (buf.length > 3.2 * 1024 * 1024) {
          const url = await uploadToUguu(buf, 'ifz-studio-' + Date.now() + '.png', mime);
          return res.status(200).json({ ok: true, url, mime, via: 'google' });
        }
        return res.status(200).json({ ok: true, base64: buf.toString('base64'), mime, via: 'google' });
      } catch (e) {
        /* fallback pollinations biar selalu bisa jalan */
        try {
          const r = await pollinationsImage(p, aspect);
          if (r.buffer.length > 3.2 * 1024 * 1024) {
            const url = await uploadToUguu(r.buffer, 'ifz-studio-' + Date.now() + '.jpg', r.mime);
            return res.status(200).json({ ok: true, url, mime: r.mime, via: r.via });
          }
          return res.status(200).json({ ok: true, base64: r.buffer.toString('base64'), mime: r.mime, via: r.via, note: 'gemini: ' + e.message });
        } catch (e2) {
          return res.status(502).json({ error: 'gemini (' + e.message + ') + pollinations (' + e2.message + ') dua-duanya gagal' });
        }
      }
    }

    /* ── VIDEO START ── */
    if (action === 'veo-start') {
      if (!p) return res.status(400).json({ error: 'prompt kosong' });
      const cfg = VIDEO_MODELS[model] || VIDEO_MODELS['ifz-lite'];
      let dur = Number(seconds) || cfg.durations[0];
      const buildReq = (d) => (m) => ({
        path: `/models/${m}:predictLongRunning`,
        opts: {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            instances: [{ prompt: p }],
            parameters: { aspectRatio: aspect === '9:16' ? '9:16' : '16:9', durationSeconds: d },
          }),
        },
      });
      let data = null;
      try {
        data = await gemChain(cfg.chain, buildReq(dur));
      } catch (e) {
        /* durasi 10s kadang ditolak → auto turun ke 8s */
        if (dur > 8 && /duration|second/i.test(e.message)) {
          dur = 8;
          data = await gemChain(cfg.chain, buildReq(dur));
        } else throw e;
      }
      if (!data?.name) throw new Error('gemini gak balikin operation id');
      return res.status(200).json({ ok: true, op: data.name, seconds: dur });
    }

    /* ── VIDEO POLL ── */
    if (action === 'veo-poll') {
      const op = String(req.body.op || '');
      if (!op || !/^[\w/.-]+$/.test(op)) return res.status(400).json({ error: 'op gak valid' });
      const ks = keys();
      if (!ks.length) return res.status(500).json({ error: 'belum ada Gemini API key' });
      let data = null;
      for (const key of ks) {
        const r = await gemFetch('/' + op, { method: 'GET' }, key);
        if (r.ok) { data = await r.json(); break; }
        if (r.status === 429) continue;
        const d = await r.json().catch(() => ({}));
        return res.status(502).json({ error: d?.error?.message || 'poll gagal http ' + r.status });
      }
      if (!data) return res.status(429).json({ error: 'semua key kena limit — tambah key di GEMINI_API_KEYS' });
      if (data.error) return res.status(502).json({ error: data.error.message || 'veo error' });
      if (!data.done) return res.status(200).json({ ok: true, pending: true });
      const sample = data?.response?.generateVideoResponse?.generatedSamples?.[0]
        || data?.response?.generatedSamples?.[0];
      const uri = sample?.video?.uri || sample?.video?.videoUri;
      if (!uri) return res.status(502).json({ error: 'selesai tapi video-nya gak ada (mungkin kena filter)' });
      /* download video (uri butuh key) */
      const dl = await gemFetch(uri.replace(GEM, ''), { method: 'GET', timeoutMs: 55000 }, ks[0]);
      if (!dl.ok) return res.status(502).json({ error: 'download video gagal http ' + dl.status });
      const buf = Buffer.from(await dl.arrayBuffer());
      const url = await uploadToUguu(buf, 'ifz-video-' + Date.now() + '.mp4', 'video/mp4');
      return res.status(200).json({ ok: true, url, size: buf.length });
    }

    /* ── UPLOAD: simpen hasil animasi client-side ke host file ── */
    if (action === 'upload') {
      const b64 = String(req.body.base64 || '');
      if (!b64) return res.status(400).json({ error: 'base64 kosong' });
      if (b64.length > 8 * 1024 * 1024) return res.status(413).json({ error: 'file kegedean (max ±6MB)' });
      const buf = Buffer.from(b64, 'base64');
      const url = await uploadToUguu(buf, 'ifz-anim-' + Date.now() + '.webm', 'video/webm');
      return res.status(200).json({ ok: true, url });
    }

    /* ── LIST: model apa aja yang bisa dipake key ini (debug/benerin chain) ── */
    if (action === 'list') {
      const ks = keys();
      if (!ks.length) return res.status(500).json({ error: 'belum ada key' });
      const r = await gemFetch('/models?pageSize=200', { method: 'GET' }, ks[0]);
      const d = await r.json();
      const all = (d?.models || []).map((m) => m.name.replace('models/', ''));
      return res.status(200).json({
        ok: true,
        veo: all.filter((m) => /veo/i.test(m)),
        image: all.filter((m) => /image|banana|imagen/i.test(m)),
        total: all.length,
      });
    }

    return res.status(400).json({ error: 'action gak dikenal' });
  } catch (err) {
    return res.status(500).json({ error: { message: err.message } });
  }
};
