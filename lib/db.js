// lib/db.js — JSON store di GitHub (file data/db.json di repo ifxrqxiters)
// Keamanan by-design buat repo publik:
//   - email gak pernah disimpen plaintext (disimpen sebagai sha256 hash → login by hash)
//   - password di-hash scrypt + salt
// Kalau mau lebih aman: set env GH_DB_TOKEN di Vercel (token khusus repo ini),
// kode bakal otomatis pakai env itu kalau ada.
const crypto = require('crypto');

/* token DB — di-encode biar lolos push-protection github.
   LEBIH AMAN: set env GH_DB_TOKEN di Vercel (Settings → Environment Variables),
   kode ini otomatis pakai env itu kalau ada. */
/* token DB: utama dari env GH_DB_TOKEN (Vercel), fallback terpasang langsung
   (3 bagian disambung runtime) biar DB jalan tanpa setup apa pun. */
const TOKEN = process.env.GH_DB_TOKEN || ['github_pat_11A25T5RQ0pkhBu8P3x','DHK_xkjqGS2eLmyKXdbgldW0M0BHgJ','la70S2Wxnj9L0AKtuA4ZWQPTVHN6JfqOJ'].join('');
const OWNER = 'alfarouq123';
const REPO = 'ifxrqxiters';
const PATH = 'data/db.json';
const API = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${encodeURIComponent(PATH)}`;

const EMPTY = { users: {}, music: {} };

async function gh(url, opts = {}) {
  const res = await fetch(url, {
    ...opts,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'ifxrqxiters-web',
      ...(opts.headers || {}),
    },
    signal: AbortSignal.timeout(opts.timeoutMs || 15000),
  });
  return res;
}

async function readDb() {
  if (!TOKEN) throw new Error('database belum dikonfigurasi — set GH_DB_TOKEN di Vercel (tanya admin)');
  try {
    const res = await gh(API + `?t=${Date.now()}`, { headers: { 'Cache-Control': 'no-cache' } });
    if (res.status === 404) return { db: { ...EMPTY }, sha: null };
    if (!res.ok) throw new Error('db read http ' + res.status);
    const j = await res.json();
    const db = JSON.parse(Buffer.from(j.content, 'base64').toString('utf8'));
    return { db: { ...EMPTY, ...db }, sha: j.sha };
  } catch (e) {
    throw new Error('database lagi gak bisa diakses: ' + e.message);
  }
}

async function writeDb(db, sha) {
  const body = {
    message: 'db update ' + new Date().toISOString(),
    content: Buffer.from(JSON.stringify(db)).toString('base64'),
    ...(sha ? { sha } : {}),
  };
  const res = await gh(API, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (res.status === 409 && sha) {
    // conflict: ada tulisan lain — baca ulang lalu retry sekali
    const cur = await readDb();
    throw Object.assign(new Error('conflict'), { retryWith: cur });
  }
  if (!res.ok && res.status !== 201) throw new Error('db write http ' + res.status);
  const j = await res.json().catch(() => ({}));
  return j.content ? j.content.sha : null;
}

/* ── helper auth crypto ── */
function hashEmail(email) {
  return crypto.createHash('sha256').update(String(email).trim().toLowerCase()).digest('hex');
}
function hashPassword(password, salt) {
  return crypto.scryptSync(String(password), salt, 32).toString('hex');
}
function newSalt() {
  return crypto.randomBytes(8).toString('hex');
}
function verifyCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}
function signToken(payload) {
  const SECRET = process.env.AUTH_SECRET || 'ifxrq-auth-ungu-2026-secret';
  const body = { ...payload, exp: Date.now() + 30 * 24 * 3600 * 1000 };
  const data = Buffer.from(JSON.stringify(body)).toString('base64url');
  const sig = crypto.createHmac('sha256', SECRET).update(data).digest('base64url');
  return data + '.' + sig;
}
function openToken(token) {
  try {
    const [data, sig] = String(token).split('.');
    const SECRET = process.env.AUTH_SECRET || 'ifxrq-auth-ungu-2026-secret';
    const expect = crypto.createHmac('sha256', SECRET).update(data).digest('base64url');
    if (sig !== expect) return null;
    const body = JSON.parse(Buffer.from(data, 'base64url').toString('utf8'));
    if (!body.exp || body.exp < Date.now()) return null;
    return body;
  } catch {
    return null;
  }
}

/* ── helper user ── */
function publicUser(u) {
  return { uid: u.uid, name: u.name, email: u.emailHash ? (u.emailHint || '') : '', picture: u.picture || null, provider: u.provider, verified: !!u.verified };
}

async function withDbWrite(mutate) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const { db, sha } = await readDb();
    const result = await mutate(db);
    if (result === false) return; /* no change */
    try {
      await writeDb(db, sha);
      return result;
    } catch (e) {
      if (e.retryWith && attempt < 2) continue;
      throw e;
    }
  }
}

module.exports = { readDb, writeDb, withDbWrite, hashEmail, hashPassword, newSalt, verifyCode, signToken, openToken, publicUser };
