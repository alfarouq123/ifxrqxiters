// api/auth.js — login/daftar/verifikasi/google/logout/me
//   POST {action:'register', email, password, name}
//   POST {action:'verify',   userId, code}
//   POST {action:'login',    email, password}
//   POST {action:'google',   credential}   ← JWT dari Google Identity Services (account picker)
//   POST {action:'me',       token}
//   POST {action:'logout'}                 ← token dibuang client-side
const {
  readDb, withDbWrite, hashEmail, hashPassword, newSalt,
  verifyCode, signToken, openToken, publicUser,
} = require('../../lib/db');
const crypto = require('crypto');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'pake POST' });

  try {
    const { action, email, password, name, userId, code, credential, token } = req.body || {};

    /* ── REGISTER (email + password) ── */
    if (action === 'register') {
      const mail = String(email || '').trim().toLowerCase();
      const pass = String(password || '');
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(mail)) return res.status(400).json({ error: 'format email gak valid' });
      if (pass.length < 6) return res.status(400).json({ error: 'password minimal 6 karakter' });
      const emailHash = hashEmail(mail);

      const result = await withDbWrite(async (db) => {
        if (db.users[emailHash]) {
          if (db.users[emailHash].verified) return { dup: true };
          /* belum verifikasi → regenerasi kode */
          db.users[emailHash].kode = verifyCode();
          db.users[emailHash].salt = newSalt();
          db.users[emailHash].passHash = hashPassword(pass, db.users[emailHash].salt);
          db.users[emailHash].name = String(name || mail.split('@')[0]).slice(0, 40);
          return { uid: db.users[emailHash].uid, kode: db.users[emailHash].kode };
        }
        const uid = crypto.randomUUID();
        const salt = newSalt();
        db.users[emailHash] = {
          uid, emailHash, emailHint: mail.slice(0, 2) + '***' + mail.slice(-10),
          salt, passHash: hashPassword(pass, salt),
          name: String(name || mail.split('@')[0]).slice(0, 40),
          provider: 'email', verified: false, kode: verifyCode(),
          createdAt: Date.now(),
        };
        return { uid, kode: db.users[emailHash].kode };
      });
      if (result && result.dup) return res.status(409).json({ error: 'email udah terdaftar — langsung login aja' });
      /* NOTE: gak ada SMTP di serverless ini — kode verifikasi ditampilin di layar
         (flow tetap: daftar → halaman verifikasi → input kode). pasang email API
         asli nanti kalau mau kode-nya dikirim ke email beneran. */
      return res.status(200).json({ ok: true, userId: result.uid, kode: result.kode });
    }

    /* ── VERIFY (kode 6 digit) ── */
    if (action === 'verify') {
      const hasil = await withDbWrite(async (db) => {
        const u = Object.values(db.users).find((x) => x.uid === userId && x.provider === 'email');
        if (!u) return { err: 'akun gak ketemu — daftar ulang', code: 404 };
        if (u.verified) return { done: u };
        if (String(u.kode) !== String(code).trim()) return { err: 'kode verifikasi salah', code: 400 };
        u.verified = true;
        delete u.kode;
        return { done: u };
      });
      if (hasil && hasil.err) return res.status(hasil.code).json({ error: hasil.err });
      return res.status(200).json({ ok: true, token: signToken({ uid: hasil.done.uid }), user: publicUser(hasil.done) });
    }

    /* ── LOGIN ── */
    if (action === 'login') {
      const mail = String(email || '').trim().toLowerCase();
      const emailHash = hashEmail(mail);
      const { db } = await readDb();
      const u = db.users[emailHash];
      if (!u || u.provider !== 'email') return res.status(404).json({ error: 'email belum terdaftar — daftar dulu' });
      if (hashPassword(String(password || ''), u.salt) !== u.passHash) return res.status(401).json({ error: 'password salah' });
      if (!u.verified) return res.status(403).json({ error: 'akun belum diverifikasi', needVerify: true, userId: u.uid });
      return res.status(200).json({ ok: true, token: signToken({ uid: u.uid }), user: publicUser(u) });
    }

    /* ── GOOGLE (credential JWT dari GIS account picker) ── */
    if (action === 'google') {
      if (!credential) return res.status(400).json({ error: 'credential google kosong' });
      const ti = await fetch('https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(credential), { signal: AbortSignal.timeout(15000) });
      if (!ti.ok) return res.status(401).json({ error: 'token google gak valid' });
      const g = await ti.json();
      if (!g.sub || !g.email) return res.status(401).json({ error: 'token google gak lengkap' });
      const emailHash = hashEmail(g.email);

      const hasil = await withDbWrite(async (db) => {
        let u = db.users[emailHash];
        if (!u) {
          const uid = crypto.randomUUID();
          u = db.users[emailHash] = {
            uid, emailHash, emailHint: g.email.slice(0, 2) + '***' + g.email.slice(-10),
            salt: newSalt(), passHash: null,
            name: g.name || g.email.split('@')[0], picture: g.picture || null,
            provider: 'google', verified: true, createdAt: Date.now(),
          };
        } else if (u.provider !== 'google') {
          return { err: 'email ini udah dipake akun biasa — login pakai password', code: 409 };
        } else {
          u.name = g.name || u.name;
          u.picture = g.picture || u.picture;
        }
        return { done: u };
      });
      if (hasil && hasil.err) return res.status(hasil.code).json({ error: hasil.err });
      return res.status(200).json({ ok: true, token: signToken({ uid: hasil.done.uid }), user: publicUser(hasil.done) });
    }

    /* ── ME ── */
    if (action === 'me') {
      const t = openToken(token);
      if (!t) return res.status(401).json({ error: 'token gak valid / kedaluwarsa — login ulang' });
      const { db } = await readDb();
      const u = Object.values(db.users).find((x) => x.uid === t.uid);
      if (!u) return res.status(401).json({ error: 'akun udah gak ada' });
      return res.status(200).json({ ok: true, user: publicUser(u) });
    }

    if (action === 'logout') return res.status(200).json({ ok: true }); /* token dibuang client */

    return res.status(400).json({ error: 'action gak dikenal' });
  } catch (err) {
    return res.status(500).json({ error: { message: err.message } });
  }
};
