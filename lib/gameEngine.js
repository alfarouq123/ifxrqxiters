// lib/gameEngine.js — port persis dari src/lib/ourin-game-data.js punya bot WA
// (normalizeAnswer, levenshtein, checkAnswerAdvanced, getProgressiveHint, getHint)
const crypto = require('crypto');

/* ── konfigurasi game (mirror plugins/game/*.js bot) ── */
const GAME_DEFS = {
  asahotak:    { emoji: '🧠', title: 'Asah Otak', desc: 'Teka-teki asah otak', timeout: 60000 },
  caklontong:  { emoji: '🥸', title: 'Cak Lontong', desc: 'Soal receh + jawaban receh', timeout: 60000, descField: 'deskripsi' },
  family100:   { emoji: '💯', title: 'Family 100', desc: 'Tebak jawaban survei terpopuler', timeout: 120000, multi: true },
  kataacak:    { emoji: '🔀', title: 'Kata Acak', desc: 'Susun huruf jadi kata bener', timeout: 60000 },
  riddle:      { emoji: '🧩', title: 'Riddle', desc: 'Teka-teki logika', timeout: 60000 },
  siapakahaku: { emoji: '👤', title: 'Siapakah Aku', desc: 'Tebak dari deskripsinya', timeout: 60000 },
  susunkata:   { emoji: '📝', title: 'Susun Kata', desc: 'Tebak kata dari petunjuk + huruf acak', timeout: 60000 },
  tebakbendera:{ emoji: '🏳️', title: 'Tebak Bendera', desc: 'Tebak negara dari benderanya', timeout: 60000, image: true },
  tebakdrakor: { emoji: '🇰🇷', title: 'Tebak Drakor', desc: 'Tebak drama korea', timeout: 60000 },
  tebakfilm:   { emoji: '🎬', title: 'Tebak Film', desc: 'Tebak judul film', timeout: 60000 },
  tebakgambar: { emoji: '🖼️', title: 'Tebak Gambar', desc: 'Tebak gambar receh', timeout: 60000, image: true, descField: 'deskripsi' },
  tebakhewan:  { emoji: '🐾', title: 'Tebak Hewan', desc: 'Tebak nama hewan', timeout: 60000 },
  tebakkabupaten: { emoji: '🗺️', title: 'Tebak Kabupaten', desc: 'Tebak kabupaten Indonesia', timeout: 60000 },
  tebakkalimat:{ emoji: '💬', title: 'Tebak Kalimat', desc: 'Lengkapi kalimatnya', timeout: 60000 },
  tebakkata:   { emoji: '🔤', title: 'Tebak Kata', desc: 'Tebak kata dari petunjuk', timeout: 60000 },
  tebakkimia:  { emoji: '⚗️', title: 'Tebak Kimia', desc: 'Tebak unsur/tabel kimia', timeout: 60000 },
  tebaklagu:   { emoji: '🎵', title: 'Tebak Lagu', desc: 'Tebak judul lagu', timeout: 60000 },
  tebaklirik:  { emoji: '🎶', title: 'Tebak Lirik', desc: 'Lengkapi lirik lagunya', timeout: 60000 },
  tebakmakanan:{ emoji: '🍜', title: 'Tebak Makanan', desc: 'Tebak makanan khas', timeout: 60000 },
  tebaknegara: { emoji: '🌍', title: 'Tebak Negara', desc: 'Tebak nama negara', timeout: 60000 },
  tebakprofesi:{ emoji: '💼', title: 'Tebak Profesi', desc: 'Tebak pekerjaannya', timeout: 60000 },
  tebaktebakan:{ emoji: '❓', title: 'Tebak-Tebakan', desc: 'Tebak-tebakan seru', timeout: 60000 },
};

/* ── algoritma persis bot ── */
function normalizeAnswer(answer) {
  if (!answer) return '';
  return String(answer).toLowerCase().replace(/[^a-z0-9\s]/gi, '').replace(/\s+/g, ' ').trim();
}

function levenshteinDistance(str1, str2) {
  const m = str1.length;
  const n = str2.length;
  if (m === 0) return n;
  if (n === 0) return m;
  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  for (let i = 1; i <= m; i++) {
    const curr = [i];
    for (let j = 1; j <= n; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    prev = curr;
  }
  return prev[n];
}

function getSimilarity(str1, str2) {
  const maxLen = Math.max(str1.length, str2.length);
  if (maxLen === 0) return 1;
  return (maxLen - levenshteinDistance(str1, str2)) / maxLen;
}

function checkAnswerAdvanced(correctAnswer, userAnswer) {
  const n1 = normalizeAnswer(correctAnswer);
  const n2 = normalizeAnswer(userAnswer);
  if (n1 === n2) return { status: 'correct', similarity: 1 };
  if (n1.includes(n2) || n2.includes(n1)) {
    if (n2.length >= n1.length * 0.8) return { status: 'correct', similarity: 0.95 };
  }
  const similarity = getSimilarity(n1, n2);
  if (similarity >= 0.85) return { status: 'correct', similarity };
  if (similarity >= 0.6) return { status: 'close', similarity };
  return { status: 'wrong', similarity };
}

function getProgressiveHint(answer, attempts) {
  if (!answer) return '';
  const chars = String(answer).split('');
  const totalChars = chars.filter((c) => c !== ' ').length;
  const reveal = Math.min(totalChars, 2 + Math.floor(attempts / 2));
  let revealed = 0;
  return chars.map((char) => {
    if (char === ' ') return ' ';
    if (revealed < reveal) { revealed++; return char; }
    return '_';
  }).join('');
}

/* ── data ── */
const ALL_GAMES = require('./data/games/index.js');
function loadGame(game) {
  return ALL_GAMES[game] || null;
}

/* ── sesi stateless: payload di-ENCRYPT (bukan cuma signed) — client gak bisa intip jawaban ── */
const SECRET = process.env.GAME_SECRET || 'ifxrq-games-2026-ungu-secret-v1';
const KEY = crypto.createHash('sha256').update(SECRET).digest();

function sealSession(obj) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', KEY, iv);
  const enc = Buffer.concat([cipher.update(JSON.stringify(obj), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString('base64url');
}

function openSession(token) {
  try {
    const raw = Buffer.from(String(token), 'base64url');
    const iv = raw.slice(0, 12);
    const tag = raw.slice(12, 28);
    const data = raw.slice(28);
    const decipher = crypto.createDecipheriv('aes-256-gcm', KEY, iv);
    decipher.setAuthTag(tag);
    return JSON.parse(Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8'));
  } catch {
    return null;
  }
}

/* ── ambil soal acak (TANPA nomor soal, TANPA jawaban) ── */
function pickQuestion(game) {
  const data = loadGame(game);
  if (!data || !data.length) return null;
  return data[Math.floor(Math.random() * data.length)];
}

function publicQuestion(game, q, attempts) {
  const def = GAME_DEFS[game];
  const out = { game, emoji: def.emoji, title: def.title };
  if (def.image) out.img = q.img || q.url || null;
  if (game === 'family100') {
    out.soal = q.soal;
    out.total = q.jawaban.length;
  } else {
    out.soal = q.soal || (game === 'tebakbendera' ? 'Bendera negara apa ini?' : '...');
    if (def.descField && q[def.descField] && game === 'tebakgambar') out.deskripsi = q[def.descField];
    if (game === 'susunkata' || game === 'kataacak') {
      out.tipe = q.tipe || null;
    }
  }
  return out;
}

module.exports = {
  GAME_DEFS, normalizeAnswer, checkAnswerAdvanced, getProgressiveHint,
  sealSession, openSession, pickQuestion, publicQuestion, loadGame,
};
