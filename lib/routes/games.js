// api/games.js — endpoint semua game (stateless, sesi terenkripsi)
//   GET  ?list                → daftar game
//   POST {action:'start', game}
//   POST {action:'answer', token, answer}
//   POST {action:'hint',   token}
//   POST {action:'surrender', token}
const {
  GAME_DEFS, checkAnswerAdvanced, getProgressiveHint,
  sealSession, openSession, pickQuestion, publicQuestion,
} = require('../../lib/gameEngine');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    /* GET list */
    if (req.method === 'GET') {
      const list = Object.entries(GAME_DEFS).map(([key, d]) => ({ key, ...d }));
      return res.status(200).json({ ok: true, games: list });
    }
    if (req.method !== 'POST') return res.status(405).json({ error: 'pake POST' });

    const { action, game, token, answer } = req.body || {};

    /* ── mulai game baru ── */
    if (action === 'start') {
      if (!GAME_DEFS[game]) return res.status(404).json({ error: 'game gak ada' });
      const q = pickQuestion(game);
      if (!q) return res.status(500).json({ error: 'data game kosong' });
      const session = { g: game, q, attempts: 0, found: [], t: Date.now() };
      const sesiToken = sealSession(session);
      const pub = publicQuestion(game, q, 0);
      return res.status(200).json({ ok: true, token: sesiToken, question: pub, timeout: GAME_DEFS[game].timeout });
    }

    /* ── sisanya butuh token ── */
    const sesi = openSession(token);
    if (!sesi) return res.status(400).json({ error: 'sesi game gak valid / kedaluwarsa — mulai game baru' });
    const def = GAME_DEFS[sesi.g];
    const q = sesi.q;

    /* ── hint ── */
    if (action === 'hint') {
      if (sesi.g === 'family100') {
        const belum = q.jawaban.filter((j) => !(sesi.found || []).includes(j));
        return res.status(200).json({
          ok: true,
          hint: belum.length ? 'salah satu: "' + belum[0].slice(0, 2) + '..."' : 'semua udah kejawab',
        });
      }
      return res.status(200).json({ ok: true, hint: getProgressiveHint(q.jawaban, sesi.attempts) });
    }

    /* ── nyerah ── */
    if (action === 'surrender') {
      if (sesi.g === 'family100') {
        return res.status(200).json({ ok: true, correct: false, surrendered: true, answers: q.jawaban, found: sesi.found || [] });
      }
      return res.status(200).json({ ok: true, correct: false, surrendered: true, answer: q.jawaban, deskripsi: q.deskripsi || null });
    }

    /* ── jawab ── */
    if (action === 'answer') {
      const jawab = String(answer || '').trim();
      if (!jawab) return res.status(400).json({ error: 'jawaban kosong' });

      if (sesi.g === 'family100') {
        const found = sesi.found || [];
        const norm = (s) => s.toLowerCase().replace(/[^a-z0-9\s]/gi, '').replace(/\s+/g, ' ').trim();
        const hit = q.jawaban.find((j) => !found.includes(j) && norm(j) === norm(jawab));
        if (hit) {
          found.push(hit);
          const selesai = found.length >= q.jawaban.length;
          return res.status(200).json({
            ok: true, correct: true, family: true,
            found, total: q.jawaban.length,
            selesai,
            token: sealSession({ ...sesi, found }),
            answers: selesai ? q.jawaban : undefined,
          });
        }
        const dekat = q.jawaban.some((j) => !found.includes(j) && checkAnswerAdvanced(j, jawab).status === 'close');
        return res.status(200).json({
          ok: true, correct: false, close: dekat, found, total: q.jawaban.length,
          token: sealSession({ ...sesi, found }),
        });
      }

      sesi.attempts = (sesi.attempts || 0) + 1;
      const hasil = checkAnswerAdvanced(q.jawaban, jawab);
      if (hasil.status === 'correct') {
        return res.status(200).json({
          ok: true, correct: true, answer: q.jawaban,
          deskripsi: q.deskripsi || null,
          hintUsed: sesi.attempts > 1,
          token: sealSession(sesi),
        });
      }
      return res.status(200).json({
        ok: true, correct: false, close: hasil.status === 'close',
        hint: getProgressiveHint(q.jawaban, sesi.attempts),
        token: sealSession(sesi),
      });
    }

    return res.status(400).json({ error: 'action gak dikenal' });
  } catch (err) {
    return res.status(500).json({ error: { message: err.message } });
  }
};
