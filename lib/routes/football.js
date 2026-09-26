// lib/routes/football.js — backend game football manager (state per akun + matchmaking + room)
//   POST {action:'state'}                          → load state akun
//   POST {action:'saveSquad', squad, indexAdd}     → simpen squad + tambah index (gak pernah ngurang)
//   POST {action:'report', mode, outcome, my, opp, oppName, stats} → hitung poin divisi + history
//   POST {action:'queueJoin'/'queueLeave'/'queuePoll', name, squad}
//   POST {action:'roomCreate'/'roomJoin'/'roomPoll'/'roomStart'/'roomLeave', roomId, name, squad}
const crypto = require('crypto');
const { readDb, withDbWrite, openToken } = require('../db');

/* ── SISTEM DIVISI ala eFootball ──
   Divisi 10-4 = POIN (win 3 / draw 1 / lose 0). Capai TARGET → PROMOSI langsung.
     Kalo musim (SEASON_MATCHES) habis tapi poin < TARGET → STAY kalo >= STAY_PT, selain itu DEGRADASI.
   Divisi 3-1 = RATING (mulai 1000). 1500 → div 2, 1800 → div 1. */
const TARGET   = { 10:12, 9:14, 8:16, 7:18, 6:20, 5:22, 4:24 }; // target poin per divisi
const STAY_PT  = { 10:6,  9:8,  8:10, 7:12, 6:14, 5:16, 4:18 }; // poin minimal biar stay
const SEASON_MATCHES = 10;
const RATE_UP  = { 3:1500, 2:1800 };        // rating buat naik dari divisi tsb
const RATE_FLOOR = { 3:1000, 2:1500, 1:1800 }; // rating dasar tiap divisi rating

function trackState() { return { division: 10, points: 0, matches: 0, rating: 1000, w: 0, d: 0, l: 0 }; }
function newState() {
  return {
    ai: trackState(), pvp: trackState(),        /* divisi TERPISAH: vs AI & vs orang asli */
    division: 10, points: 0, matches: 0, w: 0, d: 0, l: 0, rating: 1000,  /* legacy compat */
    squad: null, index: [], history: []
  };
}
/* migrasi state lama (flat) ke track terpisah */
function ensureTracks(fb){
  if (!fb.ai || typeof fb.ai.division!=='number') fb.ai = Object.assign(trackState(), { division:fb.division||10, points:fb.points||0, matches:fb.matches||0, rating:fb.rating||1000, w:fb.w||0, d:fb.d||0, l:fb.l||0 });
  if (!fb.pvp || typeof fb.pvp.division!=='number') fb.pvp = Object.assign(trackState(), { division:fb.division||10, points:fb.points||0, matches:fb.matches||0, rating:fb.rating||1000, w:fb.w||0, d:fb.d||0, l:fb.l||0 });
  return fb;
}
/* info satu track (poin div 10-4 / rating div 3-1) dikirim ke frontend */
function divMeta(tr){
  if (!tr) return null;
  if (tr.division >= 4) return { type:'points', division:tr.division, points:tr.points, target:TARGET[tr.division]||20, stay:STAY_PT[tr.division]||10, matches:tr.matches, season:SEASON_MATCHES };
  return { type:'rating', division:tr.division, rating:tr.rating, upAt:RATE_UP[tr.division]||null, floor:RATE_FLOOR[tr.division]||1000 };
}
function upsertLeaderboard(fb, uid, name){
  const lb = fb; // db.football
  if (!lb._leaderboard) lb._leaderboard = [];
  const st = fb[uid]; if (!st) return;
  const ai = st.ai || trackState(), pvp = st.pvp || trackState();
  const i = lb._leaderboard.findIndex((e)=>e.uid===uid);
  const entry = { uid, name:String(name||'Player').slice(0,24),
    aiDiv:ai.division, aiPoints:ai.points||0, aiW:ai.w||0,
    pvpDiv:pvp.division, pvpRating:pvp.rating||1000, pvpW:pvp.w||0,
    w:(ai.w||0)+(pvp.w||0), ts:Date.now() };
  if (i>=0) lb._leaderboard[i]=entry; else lb._leaderboard.push(entry);
  lb._leaderboard = lb._leaderboard.slice(0, 500);
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'pake POST' });
  try {
    const body = req.body || {};
    const t = openToken(body.token);
    if (!t) return res.status(401).json({ error: 'login dulu' });
    const uid = t.uid;

    const getFb = (db) => {
      if (!db.football) db.football = {};
      if (!db.football._queue) db.football._queue = [];
      if (!db.football._rooms) db.football._rooms = {};
      if (!db.football._matches) db.football._matches = {};
      if (!db.football[uid]) db.football[uid] = newState();
      return ensureTracks(db.football[uid]);
    };

    /* ── state akun ── */
    if (body.action === 'state') {
      const { db } = await readDb();
      const fb = getFb(db); // read-only aman
      const user = Object.values(db.users || {}).find((u) => u.uid === uid);
      return res.status(200).json({ ok: true, state: fb, name: user ? user.name : 'Player', uid });
    }

    /* ── simpen squad + index ── */
    if (body.action === 'saveSquad') {
      await withDbWrite(async (db) => {
        const fb = getFb(db);
        if (body.squad) fb.squad = body.squad;
        if (Array.isArray(body.indexAdd) && body.indexAdd.length) {
          fb.index = [...new Set([...(fb.index || []), ...body.indexAdd])];
        }
        return true;
      });
      const { db } = await readDb();
      return res.status(200).json({ ok: true, state: getFb(db) });
    }

    /* ── lapor hasil match: poin divisi (ai & pvp) / history semua ── */
    if (body.action === 'report') {
      const outcome = body.outcome === 'w' || body.outcome === 'd' || body.outcome === 'l' ? body.outcome : 'd';
      let promo = null;
      await withDbWrite(async (db) => {
        const fb = ensureTracks(getFb(db));
        fb.history = (fb.history || []).concat([{
          ts: Date.now(), mode: body.mode || 'ai', outcome,
          my: Number(body.my) || 0, opp: Number(body.opp) || 0,
          oppName: String(body.oppName || 'AI').slice(0, 40),
        }]).slice(-50);
        const nm = (db.users && Object.values(db.users).find((u)=>u.uid===uid)) ? Object.values(db.users).find((u)=>u.uid===uid).name : 'Player';

        /* pilih track sesuai mode: 'pvp' lawan orang asli, selain itu 'ai' */
        const isPvp = body.mode === 'pvp';
        const track = isPvp ? fb.pvp : fb.ai;
        if (outcome === 'w') track.w++; else if (outcome === 'd') track.d++; else track.l++;

        if (track.division >= 4) {
          /* DIVISI 10-4: sistem POIN (win 3 / draw 1 / lose 0) */
          track.points += outcome === 'w' ? 3 : outcome === 'd' ? 1 : 0;
          track.matches++;
          if (track.points >= (TARGET[track.division] || 20)) {
            promo = 'up';
            track.division = Math.max(1, track.division - 1);
            track.points = 0; track.matches = 0;
            if (track.division < 4) track.rating = RATE_FLOOR[track.division] || 1000;
          } else if (track.matches >= SEASON_MATCHES) {
            if (track.points >= (STAY_PT[track.division] || 10)) promo = 'stay';
            else { promo = 'down'; track.division = Math.min(10, track.division + 1); }
            track.points = 0; track.matches = 0;
          }
        } else {
          /* DIVISI 3-1: sistem RATING (mulai 1000; 1500→div2, 1800→div1) */
          if (outcome === 'w') track.rating += 25 + Math.floor(Math.random() * 11);
          else if (outcome === 'l') track.rating -= 15 + Math.floor(Math.random() * 11);
          else track.rating += Math.floor(Math.random() * 11) - 5;
          if (track.division === 3 && track.rating >= RATE_UP[3]) { promo = 'up'; track.division = 2; }
          else if (track.division === 2 && track.rating >= RATE_UP[2]) { promo = 'up'; track.division = 1; }
          const newFloor = RATE_FLOOR[track.division] || 1000;
          if (track.rating < newFloor) track.rating = newFloor;
        }
        /* legacy flat fields ikut track AI (compat) */
        fb.division = fb.ai.division; fb.points = fb.ai.points; fb.matches = fb.ai.matches;
        fb.rating = fb.ai.rating; fb.w = fb.ai.w; fb.d = fb.ai.d; fb.l = fb.ai.l;
        upsertLeaderboard(db.football, uid, nm);
        return true;
      });
      const { db } = await readDb();
      const fb2 = ensureTracks(getFb(db));
      const isPvp = body.mode === 'pvp';
      return res.status(200).json({ ok:true, state: fb2, promo,
        meta: divMeta(isPvp? fb2.pvp : fb2.ai),
        aiMeta: divMeta(fb2.ai), pvpMeta: divMeta(fb2.pvp) });
    }

    /* ── TOP GLOBAL leaderboard ── */
    if (body.action === 'leaderboard') {
      const { db } = await readDb();
      getFb(db);
      const lb = db.football._leaderboard || [];
      /* TOP VS AI (poin) & TOP PVP (rating) & total menang. div kecil = divisi lebih tinggi */
      const topAi  = lb.filter((e)=>e.aiDiv).sort((a,b)=> (a.aiDiv-b.aiDiv) || (b.aiPoints-a.aiPoints)).slice(0,20);
      const topPvp = lb.filter((e)=>e.pvpDiv).sort((a,b)=> (a.pvpDiv-b.pvpDiv) || (b.pvpRating-a.pvpRating)).slice(0,20);
      const topWins = lb.slice().sort((a,b)=> b.w-a.w).slice(0,20);
      return res.status(200).json({ ok:true, ai:topAi, pvp:topPvp, wins:topWins });
    }

    /* ── matchmaking pvp (queue via DB, polling) ── */
    if (body.action === 'queueJoin') {
      await withDbWrite(async (db) => {
        const fb = getFb(db);
        const q = db.football._queue;
        if (!q.some((e) => e.uid === uid)) {
          q.push({ uid, name: String(body.name || 'Player').slice(0, 24), squad: body.squad || null, ts: Date.now() });
        }
        return true;
      });
      return res.status(200).json({ ok: true });
    }
    if (body.action === 'queueLeave') {
      await withDbWrite(async (db) => {
        getFb(db);
        db.football._queue = db.football._queue.filter((e) => e.uid !== uid);
        return true;
      });
      return res.status(200).json({ ok: true });
    }
    if (body.action === 'queuePoll') {
      let found = null;
      await withDbWrite(async (db) => {
        const F0 = db.football || {};
        const before = JSON.stringify([F0._queue||[], Object.keys(F0._matches||{}), F0[uid]?1:0]);
        getFb(db);
        const F = db.football;
        /* bersihin queue basi (>60 dtk) & match selesai (>10 menit) */
        F._queue = F._queue.filter((e) => Date.now() - e.ts < 60000);
        for (const k of Object.keys(F._matches)) if (Date.now() - F._matches[k].ts > 600000) delete F._matches[k];
        /* udah ada match buat gw? */
        for (const k of Object.keys(F._matches)) {
          const m = F._matches[k];
          if (m.a.uid === uid || m.b.uid === uid) { found = { mid: k, ...m }; break; }
        }
        if (!found && F._queue.length >= 2) {
          const me = F._queue.find((e) => e.uid === uid);
          const opp = F._queue.find((e) => e.uid !== uid);
          if (me && opp) {
            const mid = crypto.randomBytes(4).toString('hex');
            F._matches[mid] = {
              a: { uid: me.uid, name: me.name, squad: me.squad },
              b: { uid: opp.uid, name: opp.name, squad: opp.squad },
              seed: crypto.randomBytes(4).readUInt32BE(0),
              readyA: false, readyB: false, mode: 'pvp', ts: Date.now(),
            };
            F._queue = F._queue.filter((e) => e.uid !== uid && e.uid !== opp.uid);
            found = { mid, ...F._matches[mid] };
          }
        }
        /* ANTI SPAM DEPLOY: cuma commit kalo queue/match beneran berubah */
        return JSON.stringify([F._queue, Object.keys(F._matches), F[uid]?1:0]) !== before;
      });
      return res.status(200).json({ ok: true, match: found });
    }
    if (body.action === 'matchReady') {
      await withDbWrite(async (db) => {
        getFb(db);
        const m = db.football._matches[String(body.mid || '')];
        if (!m) return false;
        let changed = false;
        if (m.a.uid === uid && !m.readyA) { m.readyA = true; changed = true; }
        if (m.b.uid === uid && !m.readyB) { m.readyB = true; changed = true; }
        return changed; /* gak berubah → gak usah commit */
      });
      const { db } = await readDb();
      const m = getFb(db) && db.football._matches[String(body.mid || '')];
      return res.status(200).json({ ok: true, both: m ? (m.readyA && m.readyB) : false });
    }
    if (body.action === 'matchReadyPre') {
      /* siap sebelum match mulai (flag terpisah dari matchReady halftime) */
      await withDbWrite(async (db) => {
        getFb(db);
        const m = db.football._matches[String(body.mid || '')];
        if (!m) return false;
        let changed = false;
        if (m.a.uid === uid && !m.readyPreA) { m.readyPreA = true; changed = true; }
        if (m.b.uid === uid && !m.readyPreB) { m.readyPreB = true; changed = true; }
        return changed;
      });
      const { db } = await readDb();
      const m = db.football._matches[String(body.mid || '')];
      return res.status(200).json({ ok: true, both: m ? (m.readyPreA && m.readyPreB) : false });
    }
    if (body.action === 'matchSquad') {
      /* update squad hasil edit di layar pre-match */
      await withDbWrite(async (db) => {
        getFb(db);
        const m = db.football._matches[String(body.mid || '')];
        if (m && body.squad) { if (m.a.uid === uid) m.a.squad = body.squad; if (m.b.uid === uid) m.b.squad = body.squad; }
        return true;
      });
      return res.status(200).json({ ok: true });
    }
    if (body.action === 'matchDone') {
      await withDbWrite(async (db) => {
        getFb(db);
        delete db.football._matches[String(body.mid || '')];
        return true;
      });
      return res.status(200).json({ ok: true });
    }

    /* ── laga teman (room) ── */
    if (body.action === 'roomCreate') {
      const roomId = crypto.randomBytes(3).toString('hex').toUpperCase();
      await withDbWrite(async (db) => {
        getFb(db);
        db.football._rooms[roomId] = {
          host: { uid, name: String(body.name || 'Host').slice(0, 24), squad: body.squad || null },
          guest: null, status: 'waiting', seed: crypto.randomBytes(4).readUInt32BE(0),
          readyA: false, readyB: false, ts: Date.now(),
        };
        return true;
      });
      return res.status(200).json({ ok: true, roomId });
    }
    if (body.action === 'roomJoin') {
      let room = null;
      await withDbWrite(async (db) => {
        getFb(db);
        const r = db.football._rooms[String(body.roomId || '').toUpperCase()];
        if (!r || r.status !== 'waiting') return false;
        if (r.host.uid === uid) { room = 'sudah-host'; return false; }
        r.guest = { uid, name: String(body.name || 'Guest').slice(0, 24), squad: body.squad || null };
        r.status = 'ready';
        room = 'ok';
        return true;
      });
      return res.status(200).json({ ok: room === 'ok' || room === 'sudah-host', alreadyHost: room === 'sudah-host' });
    }
    if (body.action === 'roomPoll') {
      const { db } = await readDb();
      getFb(db);
      const r = db.football._rooms[String(body.roomId || '').toUpperCase()];
      if (!r || Date.now() - r.ts > 900000) return res.status(404).json({ error: 'room gak ada / udah kedaluwarsa' });
      return res.status(200).json({ ok: true, room: r });
    }
    if (body.action === 'roomStart') {
      await withDbWrite(async (db) => {
        getFb(db);
        const r = db.football._rooms[String(body.roomId || '').toUpperCase()];
        if (r && r.host.uid === uid && r.status === 'ready') r.status = 'playing';
        return true;
      });
      return res.status(200).json({ ok: true });
    }
    if (body.action === 'roomReady') {
      await withDbWrite(async (db) => {
        getFb(db);
        const r = db.football._rooms[String(body.roomId || '').toUpperCase()];
        if (!r) return false;
        let changed = false;
        if (r.host.uid === uid) { if (!r.readyA) { r.readyA = true; changed = true; } if (body.squad && JSON.stringify(r.host.squad) !== JSON.stringify(body.squad)) { r.host.squad = body.squad; changed = true; } }
        if (r.guest && r.guest.uid === uid) { if (!r.readyB) { r.readyB = true; changed = true; } if (body.squad && JSON.stringify(r.guest.squad) !== JSON.stringify(body.squad)) { r.guest.squad = body.squad; changed = true; } }
        return changed;
      });
      const { db } = await readDb();
      const r = db.football._rooms[String(body.roomId || '').toUpperCase()];
      return res.status(200).json({ ok: true, both: r ? (r.readyA && r.readyB) : false });
    }
    if (body.action === 'roomReadyHalf') {
      /* siap lanjut babak 2 (flag terpisah dari ready pre-match) */
      await withDbWrite(async (db) => {
        getFb(db);
        const r = db.football._rooms[String(body.roomId || '').toUpperCase()];
        if (!r) return false;
        let changed = false;
        if (r.host.uid === uid && !r.readyHA) { r.readyHA = true; changed = true; }
        if (r.guest && r.guest.uid === uid && !r.readyHB) { r.readyHB = true; changed = true; }
        return changed;
      });
      const { db } = await readDb();
      const r = db.football._rooms[String(body.roomId || '').toUpperCase()];
      return res.status(200).json({ ok: true, both: r ? (r.readyHA && r.readyHB) : false });
    }
    if (body.action === 'roomLeave') {
      await withDbWrite(async (db) => {
        getFb(db);
        const rid = String(body.roomId || '').toUpperCase();
        const r = db.football._rooms[rid];
        if (r && (r.host.uid === uid || (r.guest && r.guest.uid === uid))) delete db.football._rooms[rid];
        return true;
      });
      return res.status(200).json({ ok: true });
    }

    return res.status(400).json({ error: 'action gak dikenal' });
  } catch (err) {
    return res.status(500).json({ error: { message: err.message } });
  }
};
