// lib/utils.js — helper kecil yang dipakai berbagai plugin.
const crypto = require('crypto');

/** fetch dengan timeout bawaan, biar serverless function gak nyangkut lama */
async function fetchJson(url, opts = {}, timeoutMs = 20000) {
  const res = await fetch(url, { ...opts, signal: AbortSignal.timeout(timeoutMs) });
  const raw = await res.text();
  let data;
  try { data = JSON.parse(raw); } catch (_) { data = { raw }; }
  if (!res.ok) {
    const err = new Error(data?.message || data?.error || `upstream error ${res.status}`);
    err.status = res.status;
    err.payload = data;
    throw err;
  }
  return data;
}

/** ambil gambar/binary dari url publik, balikin {buffer, mime} */
async function fetchBuffer(url, timeoutMs = 30000) {
  const res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
  if (!res.ok) throw new Error(`gagal ambil file: ${res.status}`);
  const mime = (res.headers.get('content-type') || 'application/octet-stream').split(';')[0].trim();
  const buf = Buffer.from(await res.arrayBuffer());
  return { buffer: buf, mime };
}

function bufferToDataUrl(buffer, mime) {
  return `data:${mime};base64,${buffer.toString('base64')}`;
}

function dataUrlToBuffer(dataUrl) {
  const m = /^data:([^;]+);base64,(.+)$/.exec(dataUrl || '');
  if (!m) throw new Error('format dataUrl tidak valid');
  return { mime: m[1], buffer: Buffer.from(m[2], 'base64') };
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** hash deterministik dari string -> integer 0..99, dipakai plugin "cek xxx" biar hasil konsisten buat nama yang sama */
function seededPercent(seedText, salt = '') {
  const hash = crypto.createHash('md5').update(String(seedText || '') + '::' + salt).digest('hex');
  const num = parseInt(hash.slice(0, 8), 16);
  return num % 101; // 0 - 100
}

/** signing token buat game tebak-tebakan stateless (gak perlu database/session) */
const QUIZ_SECRET = process.env.QUIZ_SECRET || 'ifxrq-default-quiz-secret-ganti-di-env';

function signQuizToken(payload) {
  const json = JSON.stringify(payload);
  const b64 = Buffer.from(json).toString('base64url');
  const sig = crypto.createHmac('sha256', QUIZ_SECRET).update(b64).digest('hex').slice(0, 24);
  return `${b64}.${sig}`;
}

function verifyQuizToken(token) {
  if (!token || typeof token !== 'string' || !token.includes('.')) return null;
  const [b64, sig] = token.split('.');
  const expected = crypto.createHmac('sha256', QUIZ_SECRET).update(b64).digest('hex').slice(0, 24);
  if (expected !== sig) return null;
  try {
    return JSON.parse(Buffer.from(b64, 'base64url').toString('utf8'));
  } catch (_) {
    return null;
  }
}

function normalizeText(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // hilangkan diakritik
    .replace(/[^a-z0-9 ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

module.exports = {
  fetchJson, fetchBuffer, bufferToDataUrl, dataUrlToBuffer,
  pick, randomInt, seededPercent,
  signQuizToken, verifyQuizToken, normalizeText,
};
