// lib/arcade/chess.js — port dari plugins/game/chess.js bot WA (IFxrqBotzV4)
// plugins/chess.js
// Catur langsung di chat — GenAI HTML Player
'use strict'

const { randomUUID } = require('crypto');

const pluginConfig = {
    name: 'chess',
    alias: ['catur'],
    category: 'game',
    description: 'Mainkan Catur langsung di chat lewat GenAI HTML Player',
    usage: '.chess',
    example: '.chess',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    energi: 1,
    isEnabled: true
}

/* =========================================================
 * HTML ESCAPE
 * ========================================================= */

function escapeHtml(text = '') {
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')
}

/* =========================================================
 * GAME BUILDER
 * ========================================================= */

function createChessGame({ playerName }) {

    const safeName = escapeHtml(playerName || 'Sensei')

    return `
<style>
:root {
    --ink:#fff;
    --muted:#b9b1c6;
    --accent:#a992ff;
    --sys:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;
}
* { margin:0; padding:0; box-sizing:border-box; -webkit-tap-highlight-color:transparent; user-select:none; }
html, body { background:transparent; color:var(--ink); font-family:var(--sys); min-height:100vh; -webkit-font-smoothing:antialiased; }
.wrap { min-height:100vh; display:flex; align-items:center; justify-content:center; padding:14px 10px; }
.shell { position:relative; width:100%; max-width:380px; border-radius:18px; overflow:hidden;
    background:linear-gradient(180deg,#140b22,#0b0614 70%); box-shadow:0 18px 40px rgba(0,0,0,.55); padding:14px 14px 16px; }
.head { display:flex; align-items:center; justify-content:space-between; margin-bottom:10px; }
.head__title { font-size:14px; font-weight:700; letter-spacing:.04em; }
.head__title span { color:var(--accent); }
.head__player { font-size:10px; color:var(--muted); max-width:55%; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.status { display:flex; gap:8px; margin-bottom:10px; }
.stat { flex:1; background:rgba(255,255,255,.06); border-radius:10px; padding:6px 8px; text-align:center; min-width:0; }
.stat__label { font-size:9px; letter-spacing:.1em; text-transform:uppercase; color:var(--muted); }
.stat__value { font-size:13px; font-weight:700; margin-top:2px; white-space:nowrap; }
.board-wrap { position:relative; }
#board { display:grid; grid-template-columns:repeat(8,1fr); width:100%;
    border-radius:10px; overflow:hidden; box-shadow:inset 0 0 0 1px rgba(255,255,255,.08); }
.sq { position:relative; display:flex; align-items:center; justify-content:center;
    aspect-ratio:1/1; width:100%; cursor:pointer; touch-action:manipulation; line-height:1; }
.sq.light { background:#2a2140; }
.sq.dark { background:#191228; }
.sq .pc { display:block; font-size:1em; pointer-events:none; }
.pc-w { color:#f4f1ff; text-shadow:0 2px 4px rgba(0,0,0,.6); }
.pc-b { color:#120c20; text-shadow:0 0 2px rgba(244,241,255,.28); }
.sq.sel { box-shadow:inset 0 0 0 2.5px var(--accent); }
.sq.lastmv { box-shadow:inset 0 0 0 2px rgba(169,146,255,.45); }
.sq.chk { box-shadow:inset 0 0 0 2.5px #ff6b6b; }
.sq .dot { position:absolute; width:26%; height:26%; border-radius:50%; background:rgba(169,146,255,.55); pointer-events:none; }
.sq .ring { position:absolute; inset:7%; border-radius:50%; border:2.5px solid rgba(169,146,255,.7); pointer-events:none; }
.controls { margin-top:12px; display:flex; gap:8px; }
.btn { flex:1; border:none; border-radius:10px; padding:9px 12px; font-size:12px; font-weight:700;
    background:var(--accent); color:#140b22; cursor:pointer; touch-action:manipulation; }
.btn.ghost { background:rgba(255,255,255,.08); color:var(--ink); }
.overlay { position:absolute; inset:0; display:none; align-items:center; justify-content:center; flex-direction:column;
    gap:10px; background:rgba(6,3,12,.86); border-radius:10px; text-align:center; padding:14px; z-index:5; }
.overlay.is-show { display:flex; }
.overlay__title { font-size:16px; font-weight:700; }
.overlay__desc { font-size:11px; color:var(--muted); line-height:1.5; }
.ovbtns { display:flex; flex-direction:column; gap:8px; width:100%; max-width:220px; }
.note { margin-top:10px; text-align:center; font-size:9.5px; color:var(--muted); line-height:1.6; }
.hist { margin-top:8px; max-height:64px; overflow-y:auto; font-size:10px; color:var(--muted);
    line-height:1.7; text-align:center; font-variant-numeric:tabular-nums; }
.hist b { color:var(--ink); font-weight:600; }
</style>

<div class="wrap">
<div class="shell">

    <div class="head">
        <div class="head__title">CHE<span>SS</span></div>
        <div class="head__player">${safeName}</div>
    </div>

    <div class="status">
        <div class="stat"><div class="stat__label">Giliran</div><div class="stat__value" id="turn">Putih</div></div>
        <div class="stat"><div class="stat__label">Langkah</div><div class="stat__value" id="moveNo">1</div></div>
        <div class="stat"><div class="stat__label">Mode</div><div class="stat__value" id="modeLbl">-</div></div>
    </div>

    <div class="board-wrap">
        <div id="board"></div>
        <div class="overlay is-show" id="overlay">
            <div class="overlay__title" id="ovTitle">Pilih Mode</div>
            <div class="overlay__desc">Catur vs teman satu HP, atau lawan AI.</div>
            <div class="ovbtns">
                <button class="btn" id="btnAi">🤖 Lawan AI (hitam)</button>
                <button class="btn ghost" id="btnPvp">👥 Dua Pemain</button>
            </div>
    </div>

    <div class="controls">
        <button class="btn ghost" id="btnRestart">↺ Ulang</button>
        <button class="btn ghost" id="btnFlip">⇅ Putar</button>
    </div>

    <div class="hist" id="hist"></div>

    <div class="note">Ketuk bidak lalu ketuk kotak tujuan. Skak = kotak merah.</div>

</div>
</div>

<script>
(function(){

var boardEl = document.getElementById('board');
var turnEl = document.getElementById('turn');
var moveNoEl = document.getElementById('moveNo');
var modeLbl = document.getElementById('modeLbl');
var histEl = document.getElementById('hist');
var overlay = document.getElementById('overlay');
var ovTitle = document.getElementById('ovTitle');

/* \\uFE0E = paksa tampilan TEKS — tanpa ini Android suka ngerender
   glyph catur jadi emoji warna (merusak warna bidak) */
var GLYPH = {
    wK:'\\u2654\\uFE0E', wQ:'\\u2655\\uFE0E', wR:'\\u2656\\uFE0E', wB:'\\u2657\\uFE0E', wN:'\\u2658\\uFE0E', wP:'\\u2659\\uFE0E',
    bK:'\\u265A\\uFE0E', bQ:'\\u265B\\uFE0E', bR:'\\u265C\\uFE0E', bB:'\\u265D\\uFE0E', bN:'\\u265E\\uFE0E', bP:'\\u265F\\uFE0E'
};
var VAL = { P:1, N:3, B:3, R:5, Q:9, K:100 };

var board, turn, mode, sel, legal, lastMove, flipped, gameOver;
var history = [];   // notasi per half-move
var sanLog = [];    // pasangan utk tampilan

/* ── DOM persisten: 64 kotak dibuat SEKALI, render cuma update
   isi/kelas → gak ada flicker / goyang tiap langkah ── */
var sqEls = [];
(function buildBoard(){
    for (var r = 0; r < 8; r++){
        var row = [];
        for (var c = 0; c < 8; c++){
            var sq = document.createElement('div');
            sq.className = 'sq ' + (((r + c) % 2 === 0) ? 'dark' : 'light');
            var pc = document.createElement('span');
            pc.className = 'pc';
            sq.appendChild(pc);
            var mark = document.createElement('div');
            mark.className = 'dot';
            mark.style.display = 'none';
            sq.appendChild(mark);
            (function(r, c){
                sq.addEventListener('click', function(){ tap(r, c); });
            })(r, c);
            row.push({ sq: sq, pc: pc, mark: mark });
        }
        sqEls.push(row);
    }
})();

function layoutSquares(){
    boardEl.innerHTML = '';
    for (var rr = 0; rr < 8; rr++){
        for (var cc = 0; cc < 8; cc++){
            var r = flipped ? 7 - rr : rr;
            var c = flipped ? 7 - cc : cc;
            boardEl.appendChild(sqEls[r][c].sq);
        }
    }
    fitPieces();
}

/* ukuran font bidak ngikutin lebar kotak asli (stabil di semua layar) */
function fitPieces(){
    var w = sqEls[0][0].sq.clientWidth || 0;
    if (w) boardEl.style.fontSize = Math.floor(w * 0.78) + 'px';
}

function startBoard(){
    board = [];
    var back = ['R','N','B','Q','K','B','N','R'];
    for (var r = 0; r < 8; r++){
        var row = [];
        for (var c = 0; c < 8; c++) row.push(null);
        board.push(row);
    }
    for (var i = 0; i < 8; i++){
        board[0][i] = { t: back[i], c: 'b' };
        board[1][i] = { t: 'P', c: 'b' };
        board[6][i] = { t: 'P', c: 'w' };
        board[7][i] = { t: back[i], c: 'w' };
    }
    turn = 'w'; sel = null; legal = []; lastMove = null; flipped = false; gameOver = false;
    history = []; sanLog = [];
}

function inside(r, c){ return r >= 0 && r < 8 && c >= 0 && c < 8; }
function pk(r, c){ return inside(r,c) ? board[r][c] : undefined; }

function attacked(r, c, by){
    var dr = by === 'w' ? 1 : -1;
    if (pk(r+dr, c-1) && pk(r+dr,c-1).c === by && pk(r+dr,c-1).t === 'P') return true;
    if (pk(r+dr, c+1) && pk(r+dr,c+1).c === by && pk(r+dr,c+1).t === 'P') return true;
    var kn = [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
    for (var i = 0; i < 8; i++){
        var p = pk(r+kn[i][0], c+kn[i][1]);
        if (p && p.c === by && p.t === 'N') return true;
    }
    for (var a = -1; a <= 1; a++) for (var b = -1; b <= 1; b++){
        if (!a && !b) continue;
        var q = pk(r+a, c+b);
        if (q && q.c === by && q.t === 'K') return true;
    }
    var lin = [[1,0],[-1,0],[0,1],[0,-1]];
    for (var i = 0; i < 4; i++){
        var rr = r + lin[i][0], cc = c + lin[i][1];
        while (inside(rr,cc)){
            var p2 = board[rr][cc];
            if (p2){ if (p2.c === by && (p2.t === 'R' || p2.t === 'Q')) return true; break; }
            rr += lin[i][0]; cc += lin[i][1];
        }
    }
    var dg = [[1,1],[1,-1],[-1,1],[-1,-1]];
    for (var i = 0; i < 4; i++){
        var rr = r + dg[i][0], cc = c + dg[i][1];
        while (inside(rr,cc)){
            var p3 = board[rr][cc];
            if (p3){ if (p3.c === by && (p3.t === 'B' || p3.t === 'Q')) return true; break; }
            rr += dg[i][0]; cc += dg[i][1];
        }
    }
    return false;
}

function kingPos(color){
    for (var r = 0; r < 8; r++) for (var c = 0; c < 8; c++){
        var p = board[r][c];
        if (p && p.c === color && p.t === 'K') return [r, c];
    }
    return null;
}

function inCheck(color){
    var k = kingPos(color);
    return k ? attacked(k[0], k[1], color === 'w' ? 'b' : 'w') : false;
}

function pseudo(r, c){
    var p = board[r][c], out = [], col = p.c, e = col === 'w' ? 'b' : 'w';
    var fwd = col === 'w' ? -1 : 1;
    var add = function(rr, cc){ if (inside(rr,cc)) out.push([rr,cc]); };
    if (p.t === 'P'){
        if (inside(r+fwd,c) && !board[r+fwd][c]){
            add(r+fwd, c);
            var startr = col === 'w' ? 6 : 1;
            if (r === startr && !board[r+2*fwd][c]) add(r+2*fwd, c);
        }
        for (var d = -1; d <= 1; d += 2){
            var t = pk(r+fwd, c+d);
            if (t && t.c === e) add(r+fwd, c+d);
        }
    } else if (p.t === 'N'){
        var kn = [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
        for (var i = 0; i < 8; i++){
            var t2 = pk(r+kn[i][0], c+kn[i][1]);
            if (t2 === undefined) continue;
            if (!t2 || t2.c === e) add(r+kn[i][0], c+kn[i][1]);
        }
    } else if (p.t === 'K'){
        for (var a = -1; a <= 1; a++) for (var b = -1; b <= 1; b++){
            if (!a && !b) continue;
            var t3 = pk(r+a, c+b);
            if (t3 === undefined) continue;
            if (!t3 || t3.c === e) add(r+a, c+b);
        }
    } else {
        var dirs = [];
        if (p.t === 'R' || p.t === 'Q') dirs.push([1,0],[-1,0],[0,1],[0,-1]);
        if (p.t === 'B' || p.t === 'Q') dirs.push([1,1],[1,-1],[-1,1],[-1,-1]);
        for (var i = 0; i < dirs.length; i++){
            var rr = r + dirs[i][0], cc = c + dirs[i][1];
            while (inside(rr,cc)){
                var t4 = board[rr][cc];
                if (t4){ if (t4.c === e) add(rr,cc); break; }
                add(rr,cc); rr += dirs[i][0]; cc += dirs[i][1];
            }
        }
    }
    return out;
}

function movesFor(r, c){
    var p = board[r][c];
    if (!p) return [];
    var out = [];
    var cand = pseudo(r, c);
    for (var i = 0; i < cand.length; i++){
        var rr = cand[i][0], cc = cand[i][1];
        var cap = board[rr][cc];
        board[rr][cc] = p; board[r][c] = null;
        var promo = p.t === 'P' && (rr === 0 || rr === 7);
        if (promo) board[rr][cc] = { t:'Q', c:p.c };
        if (!inCheck(p.c)) out.push([rr, cc]);
        board[r][c] = p; board[rr][cc] = cap;
    }
    return out;
}

function allMoves(color){
    var out = [];
    for (var r = 0; r < 8; r++) for (var c = 0; c < 8; c++){
        var p = board[r][c];
        if (p && p.c === color){
            var ms = movesFor(r, c);
            for (var i = 0; i < ms.length; i++) out.push([r, c, ms[i][0], ms[i][1]]);
        }
    }
    return out;
}

/* notasi ala algebraic: pion tanpa huruf, promosi =Q, skak +, skakmat # */
function doMove(r1, c1, r2, c2){
    var p = board[r1][c1];
    var origT = p.t;
    var cap = board[r2][c2];
    board[r2][c2] = p; board[r1][c1] = null;
    var promo = '';
    if (p.t === 'P' && (r2 === 0 || r2 === 7)){ p.t = 'Q'; promo = '=Q'; }
    lastMove = [r1, c1, r2, c2];
    turn = turn === 'w' ? 'b' : 'w';

    var dest = String.fromCharCode(97 + c2) + (8 - r2);
    var pieceLetter = origT === 'P' ? '' : origT;
    var san = pieceLetter + (cap ? 'x' : '') + dest + promo;

    if (inCheck(turn)) san += allMoves(turn).length ? '+' : '#';
    history.push(san);
    return san;
}

function aiMove(){
    var ms = allMoves('b');
    if (!ms.length) return null;
    var best = null, bestScore = -99;
    for (var i = 0; i < ms.length; i++){
        var m = ms[i];
        var cap = board[m[2]][m[3]];
        var sc = 0;
        if (cap) sc = VAL[cap.t] || 0;
        sc += (Math.random() * 0.6);
        sc -= 0.05 * (Math.abs(3.5 - m[2]) + Math.abs(3.5 - m[3]));
        var mover = board[m[0]][m[1]];
        board[m[2]][m[3]] = mover; board[m[0]][m[1]] = null;
        if (attacked(m[2], m[3], 'w')) sc -= (VAL[mover.t] || 1) * 0.8;
        board[m[0]][m[1]] = mover; board[m[2]][m[3]] = cap;
        if (sc > bestScore){ bestScore = sc; best = m; }
    }
    return doMove(best[0], best[1], best[2], best[3]);
}

/* ── render: update doang, gak bangun ulang ── */
function render(){
    var chkK = null;
    if (inCheck(turn)) chkK = kingPos(turn);
    var legalSet = {};
    for (var i = 0; i < legal.length; i++) legalSet[legal[i][0] + ',' + legal[i][1]] = true;

    for (var r = 0; r < 8; r++){
        for (var c = 0; c < 8; c++){
            var cell = sqEls[r][c];
            var p = board[r][c];
            var want = p ? GLYPH[p.c + p.t] : '';
            if (cell.pc.textContent !== want) cell.pc.textContent = want;
            var cls = 'pc ' + (p ? (p.c === 'w' ? 'pc-w' : 'pc-b') : '');
            if (cell.pc.className !== cls) cell.pc.className = cls;

            var k = 'sq ' + (((r + c) % 2 === 0) ? 'dark' : 'light');
            if (sel && sel[0] === r && sel[1] === c) k += ' sel';
            if (lastMove && ((lastMove[0] === r && lastMove[1] === c) || (lastMove[2] === r && lastMove[3] === c))) k += ' lastmv';
            if (chkK && chkK[0] === r && chkK[1] === c) k += ' chk';
            if (cell.sq.className !== k) cell.sq.className = k;

            var showMark = legalSet[r + ',' + c] ? (p ? 'ring' : 'dot') : '';
            cell.mark.className = showMark || 'dot';
            cell.mark.style.display = showMark ? 'block' : 'none';
        }
    }
    turnEl.textContent = gameOver ? 'Selesai' : (turn === 'w' ? 'Putih' : 'Hitam');
    moveNoEl.textContent = Math.floor(history.length / 2) + 1;

    /* riwayat per pasangan: "1. e4 e5  2. Nf3 Nc6" */
    var out = [];
    for (var j = 0; j < history.length; j += 2){
        out.push('<b>' + (j / 2 + 1) + '.</b> ' + history[j] + ' ' + (history[j + 1] || ''));
    }
    histEl.innerHTML = out.slice(-4).join('&nbsp;&nbsp;');
}

function tap(r, c){
    if (gameOver) return;
    if (mode === 'ai' && turn === 'b') return;
    if (sel){
        var ok = false;
        for (var i = 0; i < legal.length; i++) if (legal[i][0] === r && legal[i][1] === c) ok = true;
        if (ok){
            doMove(sel[0], sel[1], r, c);
            sel = null; legal = [];
            render();
            finishCheck();
            if (!gameOver && mode === 'ai'){
                setTimeout(function(){
                    aiMove();
                    render();
                    finishCheck();
                }, 350);
            }
            return;
        }
    }
    var p = board[r][c];
    if (p && p.c === turn){
        sel = [r, c];
        legal = movesFor(r, c);
    } else {
        sel = null; legal = [];
    }
    render();
}

function finishCheck(){
    var ms = allMoves(turn);
    if (!ms.length){
        gameOver = true;
        if (inCheck(turn)){
            ovTitle.textContent = 'Skakmat! ' + (turn === 'w' ? 'Hitam' : 'Putih') + ' menang';
        } else {
            ovTitle.textContent = 'Seri — pat (stalemate)';
        }
        document.getElementById('btnAi').style.display = 'none';
        document.getElementById('btnPvp').style.display = 'none';
        overlay.classList.add('is-show');
        render();
        return;
    }
}

document.getElementById('btnAi').addEventListener('click', function(){
    mode = 'ai'; modeLbl.textContent = 'vs AI';
    startBoard();
    document.getElementById('btnAi').style.display = 'block';
    document.getElementById('btnPvp').style.display = 'block';
    overlay.classList.remove('is-show');
    layoutSquares();
    render();
});
document.getElementById('btnPvp').addEventListener('click', function(){
    mode = 'pvp'; modeLbl.textContent = '2 Pemain';
    startBoard();
    document.getElementById('btnAi').style.display = 'block';
    document.getElementById('btnPvp').style.display = 'block';
    overlay.classList.remove('is-show');
    layoutSquares();
    render();
});
document.getElementById('btnRestart').addEventListener('click', function(){
    overlay.classList.add('is-show');
    ovTitle.textContent = 'Pilih Mode';
    document.getElementById('btnAi').style.display = 'block';
    document.getElementById('btnPvp').style.display = 'block';
});
document.getElementById('btnFlip').addEventListener('click', function(){
    flipped = !flipped;
    layoutSquares();
});
window.addEventListener('resize', fitPieces);

startBoard();
layoutSquares();
render();

})();
</script>
`
}

/* =========================================================
 * SEND GAME PLAYER (GenAI HTML Player)
 * ========================================================= */

async function sendGamePlayer(sock, m, html) {

    if (typeof html !== 'string' || !html.length) {
        throw new Error('HTML game kosong')
    }

    const responseId = randomUUID()

    await sock.relayMessage(
        m.chat,
        {
            messageContextInfo: {
                deviceListMetadata: {},
                deviceListMetadataVersion: 2,

                botMetadata: {
                    messageDisclaimerText: '',
                    botResponseId: responseId
                }
            },

            botForwardedMessage: {

                message: {

                    richResponseMessage: {

                        messageType: 1,

                        submessages: [
                            {
                                messageType: 2,
                                messageText: 'Chess Game'
                            }
                        ],

                        unifiedResponse: {

                            data: Buffer.from(
                                JSON.stringify({
                                    response_id: responseId,

                                    sections: [
                                        {
                            view_model: {

                                primitive: {
                                    __typename: 'GenAIaeacdsnwHtmlPrimitive',
                                    payload: html,
                                    trusted_sources: []
                                },

                                __typename: 'GenAISingleLayoutViewModel'
                            }
                                        }
                                    ]
                                })
                            ).toString('base64')
                        },

                        contextInfo: {
                            forwardingScore: 1,
                            isForwarded: true,

                            forwardedAiBotMessageInfo: {
                                botJid: '867051314767696@bot'
                            },

                            forwardOrigin: 4
                        }
                    }
                }
            }
        },
        {
            messageId: responseId
        }
    )
}

/* =========================================================
 * HANDLER
 * ========================================================= */

async function handler(m, { sock }) {

    await m.react('♟️')

    try {

        const playerName =
            m.pushName ||
            m.name ||
            'Sensei'

        const html = createChessGame({ playerName })

        await sendGamePlayer(sock, m, html)

        await m.react('✅')

    } catch (error) {

        console.error('[CHESS ERROR]', error)

        await m.react('❌')

        const message = error?.message || 'Unknown error'

        await m.reply(
            '❌ Game gagal dijalankan, coba lagi ya.\n\n' +
            `> ${message}`
        )
    }
}

/* =========================================================
 * EXPORT
 * ========================================================= */


module.exports = {
  config: { key: "chess", name: "Catur 2 Pemain", emoji: "♟️", desc: "catur klasik drag & drop" },
  build: (opts) => createChessGame(opts || { playerName: "Player" }),
};
