// lib/arcade/blockblast.js — port dari plugins/game/blockblast.js bot WA (IFxrqBotzV4)
// plugins/blockblast.js
// Block Blast! langsung di chat — GenAI HTML Player
'use strict'

const { randomUUID } = require('crypto');

const pluginConfig = {
    name: 'blockblast',
    alias: ['bb', 'blast', 'block'],
    category: 'game',
    description: 'Mainkan Block Blast! langsung di chat lewat GenAI HTML Player',
    usage: '.blockblast',
    example: '.blockblast',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    energi: 1,
    isEnabled: true
}

/* =========================================================
 * GAME BUILDER
 * ========================================================= */

function createBlockBlastGame({ playerName }) {

    const safe = String(playerName || 'Sensei').replace(/&/g, '&amp;')
        .replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#039;')

    return `
<style>
:root {
    --ink:#fff;
    --muted:#9d94c6;
    --accent:#7d6bff;
    --gold:#ffcf4d;
    --sys:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;
}
* { margin:0; padding:0; box-sizing:border-box; -webkit-tap-highlight-color:transparent; user-select:none; }
html, body { background:transparent; color:var(--ink); font-family:var(--sys); min-height:100vh; -webkit-font-smoothing:antialiased; }
.wrap { min-height:100vh; display:flex; align-items:center; justify-content:center; padding:12px 8px; }
.shell { width:100%; max-width:360px; border-radius:18px; overflow:hidden;
    background:linear-gradient(180deg,#171233,#0c0920 75%); box-shadow:0 18px 40px rgba(0,0,0,.55);
    padding:12px 12px 14px; }
.head { display:flex; align-items:center; justify-content:space-between; margin-bottom:6px; }
.head__title { font-size:14px; font-weight:800; letter-spacing:.03em; }
.head__title span { color:var(--gold); }
.head__player { font-size:10px; color:var(--muted); max-width:50%; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.scores { display:flex; gap:8px; margin-bottom:8px; }
.sc { flex:1; background:rgba(255,255,255,.06); border-radius:10px; padding:5px 8px; text-align:center; min-width:0; }
.sc__label { font-size:8.5px; letter-spacing:.12em; text-transform:uppercase; color:var(--muted); }
.sc__value { font-size:15px; font-weight:800; margin-top:1px; font-variant-numeric:tabular-nums; white-space:nowrap; }

.board-zone { position:relative; }
#board { display:grid; grid-template-columns:repeat(8,1fr); width:100%; border-radius:12px;
    background:#0d0a22; padding:4px; gap:3px; box-shadow:inset 0 0 0 1px rgba(255,255,255,.07);
    touch-action:none; }
.cell { position:relative; aspect-ratio:1/1; width:100%; border-radius:4px;
    background:#1b1740; touch-action:none; }
.cell.pv { background:#2b2361; box-shadow:inset 0 0 0 1.5px rgba(255,207,77,.55); }
.cell.pop { animation:pop .28s ease-out forwards; }
@keyframes pop { 0%{transform:scale(1)} 40%{transform:scale(1.25); filter:brightness(1.7)} 100%{transform:scale(0); opacity:0} }
.blk { position:absolute; inset:5%; border-radius:4px; pointer-events:none; }
.blk.ghost { opacity:.45; }
.c0 { background:linear-gradient(160deg,#5ac8fa,#2a86e0); box-shadow:inset 0 2px 0 rgba(255,255,255,.45), inset 0 -2px 0 rgba(0,0,0,.25); }
.c1 { background:linear-gradient(160deg,#63dd6e,#2f9e4f); box-shadow:inset 0 2px 0 rgba(255,255,255,.45), inset 0 -2px 0 rgba(0,0,0,.25); }
.c2 { background:linear-gradient(160deg,#ffd34d,#f5a623); box-shadow:inset 0 2px 0 rgba(255,255,255,.5), inset 0 -2px 0 rgba(0,0,0,.25); }
.c3 { background:linear-gradient(160deg,#ff7a85,#e5484d); box-shadow:inset 0 2px 0 rgba(255,255,255,.45), inset 0 -2px 0 rgba(0,0,0,.25); }
.c4 { background:linear-gradient(160deg,#c58bff,#8b5cf6); box-shadow:inset 0 2px 0 rgba(255,255,255,.45), inset 0 -2px 0 rgba(0,0,0,.25); }
.c5 { background:linear-gradient(160deg,#5eead4,#14b8a6); box-shadow:inset 0 2px 0 rgba(255,255,255,.45), inset 0 -2px 0 rgba(0,0,0,.25); }
.c6 { background:linear-gradient(160deg,#ffa657,#f97316); box-shadow:inset 0 2px 0 rgba(255,255,255,.45), inset 0 -2px 0 rgba(0,0,0,.25); }
/* warna ledakan SERAGAM (satu warna semua) */
.cblast { background:linear-gradient(160deg,#fff6d8,#ffd75e); box-shadow:0 0 14px rgba(255,215,94,.9), inset 0 2px 0 rgba(255,255,255,.8); }

.tray { display:flex; gap:6px; margin-top:10px; min-height:86px; align-items:center; justify-content:space-around;
    padding-bottom:4px; }
.slot { background:rgba(255,255,255,.05); border-radius:12px; padding:9px; cursor:grab; touch-action:none;
    border:2px solid transparent; transition:transform .12s ease; }
.slot.sel { border-color:var(--gold); transform:scale(1.06); background:rgba(255,207,77,.08); }
.slot.dead { opacity:.32; }
.slot .mini { display:grid; gap:2px; }
.slot .mini i { display:block; width:17px; height:17px; border-radius:3px; }

#dragGhost { position:fixed; z-index:99; pointer-events:none; opacity:.92; display:none;
    filter:drop-shadow(0 6px 14px rgba(0,0,0,.5)); }
#dragGhost .dg { display:grid; gap:3px; }
#dragGhost .dg i { display:block; border-radius:4px; }

.splash { position:absolute; left:0; right:0; top:38%; text-align:center; pointer-events:none;
    font-size:26px; font-weight:900; letter-spacing:.02em; opacity:0; z-index:9;
    text-shadow:0 2px 12px rgba(0,0,0,.6); }
.splash.go { animation:splash 1s ease-out forwards; }
@keyframes splash { 0%{opacity:0; transform:scale(.5)} 25%{opacity:1; transform:scale(1.15)} 60%{opacity:1; transform:scale(1)} 100%{opacity:0; transform:scale(1.05) translateY(-14px)} }
.sp-good { color:#7dd87d; } .sp-great { color:#5ac8fa; } .sp-amazing { color:#ffa657; } .sp-unbel { color:#ff5f7a; } .sp-blast { color:var(--gold); }
.combo-pill { position:absolute; right:10px; top:8px; background:rgba(255,207,77,.15); color:var(--gold);
    border-radius:20px; padding:3px 10px; font-size:10px; font-weight:800; opacity:0; transition:opacity .2s; }
.combo-pill.go { opacity:1; }
.overlay { position:absolute; inset:0; display:none; align-items:center; justify-content:center; flex-direction:column;
    gap:10px; background:rgba(8,5,20,.88); border-radius:12px; text-align:center; padding:16px; z-index:10; }
.overlay.is-show { display:flex; }
.overlay__title { font-size:20px; font-weight:900; }
.overlay__desc { font-size:11.5px; color:var(--muted); line-height:1.6; }
.ovbtns { display:flex; flex-direction:column; gap:8px; width:100%; max-width:200px; margin-top:4px; }
.btn { border:none; border-radius:12px; padding:11px 16px; font-size:13px; font-weight:800; cursor:pointer;
    background:linear-gradient(135deg,#7d6bff,#5a8bff); color:#fff; touch-action:manipulation; }
.note { margin-top:8px; text-align:center; font-size:9.5px; color:var(--muted); line-height:1.6; }
</style>

<div class="wrap">
<div class="shell">

    <div class="head">
        <div class="head__title">BLOCK <span>BLAST!</span></div>
        <div class="head__player">${safe}</div>
    </div>

    <div class="scores">
        <div class="sc"><div class="sc__label">Skor</div><div class="sc__value" id="score">0</div></div>
        <div class="sc"><div class="sc__label">Best</div><div class="sc__value" id="best">0</div></div>
        <div class="sc"><div class="sc__label">Combo</div><div class="sc__value" id="combo">-</div></div>
    </div>

    <div class="board-zone">
        <div id="board"></div>
        <div class="splash" id="splash"></div>
        <div class="combo-pill" id="comboPill"></div>
        <div class="overlay is-show" id="overlay">
            <div class="overlay__title">BLOCK BLAST!</div>
            <div class="overlay__desc" id="ovDesc">Susun balok di papan 8×8.<br>Penuhi satu baris atau kolom buat meledakin!</div>
            <div class="ovbtns"><button class="btn" id="btnStart">▶ Mulai Main</button></div>
        </div>
    </div>

    <div class="tray" id="tray">
        <div class="slot" id="slot0"></div>
        <div class="slot" id="slot1"></div>
        <div class="slot" id="slot2"></div>
    </div>

    <div class="note">Geser balok ke papan buat naruh (bisa tap juga). Baris/kolom penuh = ledak 💥</div>

</div>
</div>
<div id="dragGhost"><div class="dg"></div></div>

<script>
(function(){

var N = 8;
var boardEl = document.getElementById('board');
var scoreEl = document.getElementById('score');
var bestEl = document.getElementById('best');
var comboEl = document.getElementById('combo');
var splashEl = document.getElementById('splash');
var comboPill = document.getElementById('comboPill');
var overlay = document.getElementById('overlay');
var ovDesc = document.getElementById('ovDesc');
var ghostEl = document.getElementById('dragGhost');
var ghostGrid = ghostEl.querySelector('.dg');
var slots = [ document.getElementById('slot0'), document.getElementById('slot1'), document.getElementById('slot2') ];

var SHAPES = [
    [[1]], [[1,1]], [[1],[1]],
    [[1,1,1]], [[1],[1],[1]],
    [[1,1,1,1]], [[1],[1],[1],[1]],
    [[1,1],[1,1]],
    [[1,1,1],[1,1,1]], [[1,1,1],[1],[1]],
    [[1,1,1],[0,1],[0,1]], [[1,0,0],[1,1,1]], [[1,1],[0,1],[0,1]], [[1,0],[1,1],[1,0]],
    [[0,1,1],[1,1,0]], [[1,1,0],[0,1,1]]
];
var NCOLOR = 7;

var grid, tray, sel, score, best, combo, running, splashTimer, pillTimer;
var justDragged = false;

function emptyGrid(){
    var g = [];
    for (var r = 0; r < N; r++){
        var row = [];
        for (var c = 0; c < N; c++) row.push(null);
        g.push(row);
    }
    return g;
}

function loadBest(){
    try { var v = localStorage.getItem('bb_best'); return v ? parseInt(v, 10) || 0 : 0; } catch (e) { return 0; }
}
function saveBest(v){
    try { localStorage.setItem('bb_best', String(v)); } catch (e) {}
}

var cells = [];
(function build(){
    for (var r = 0; r < N; r++){
        var row = [];
        for (var c = 0; c < N; c++){
            var d = document.createElement('div');
            d.className = 'cell';
            d.dataset.r = r;
            d.dataset.c = c;
            (function(r, c){
                d.addEventListener('click', function(){ tapCell(r, c); });
            })(r, c);
            boardEl.appendChild(d);
            row.push(d);
        }
        cells.push(row);
    }
})();

function newPiece(){
    var shape = SHAPES[Math.floor(Math.random() * SHAPES.length)]
        .map(function(row){ return row.slice(); });
    return { shape: shape, color: Math.floor(Math.random() * NCOLOR) };
}

function trayPlaceable(){
    for (var i = 0; i < 3; i++){
        if (tray[i] && canPlaceAnywhere(tray[i].shape)) return true;
    }
    return false;
}

function refill(){
    for (var tries = 0; tries < 12; tries++){
        tray = [newPiece(), newPiece(), newPiece()];
        if (tries === 11 || canPlaceAnywhere(tray[0].shape) ||
            canPlaceAnywhere(tray[1].shape) || canPlaceAnywhere(tray[2].shape)) break;
    }
    sel = -1;
}

function canPlace(shape, R, C){
    for (var r = 0; r < shape.length; r++){
        for (var c = 0; c < shape[r].length; c++){
            if (!shape[r][c]) continue;
            var rr = R + r, cc = C + c;
            if (rr < 0 || rr >= N || cc < 0 || cc >= N) return false;
            if (grid[rr][cc] !== null) return false;
        }
    }
    return true;
}

function canPlaceAnywhere(shape){
    for (var r = 0; r < N; r++)
        for (var c = 0; c < N; c++)
            if (canPlace(shape, r, c)) return true;
    return false;
}

var SPLASH = [
    { n: 1, txt: 'Good!', cls: 'sp-good' },
    { n: 2, txt: 'Great!', cls: 'sp-great' },
    { n: 3, txt: 'Amazing!', cls: 'sp-amazing' },
    { n: 4, txt: 'Unbelievable!', cls: 'sp-unbel' }
];

function showSplash(lines, comboN){
    var s;
    if (lines >= 4) s = SPLASH[3];
    else s = SPLASH[Math.max(0, lines - 1)];
    var txt = s.txt, cls = s.cls;
    if (comboN >= 3){ txt = 'Unbelievable!'; cls = 'sp-unbel'; }
    if (lines >= 2 && comboN >= 2){ txt = 'BLOCK BLAST!'; cls = 'sp-blast'; }
    splashEl.textContent = txt;
    splashEl.className = 'splash ' + cls;
    void splashEl.offsetWidth;
    splashEl.classList.add('go');
    clearTimeout(splashTimer);
    splashTimer = setTimeout(function(){ splashEl.classList.remove('go'); }, 1000);

    if (comboN >= 2){
        comboPill.textContent = 'COMBO x' + comboN;
        comboPill.classList.add('go');
        clearTimeout(pillTimer);
        pillTimer = setTimeout(function(){ comboPill.classList.remove('go'); }, 1600);
    }
}

function findFull(){
    var rows = [], cols = [];
    for (var r = 0; r < N; r++){
        var full = true;
        for (var c = 0; c < N; c++) if (grid[r][c] === null){ full = false; break; }
        if (full) rows.push(r);
    }
    for (var c = 0; c < N; c++){
        var full2 = true;
        for (var r = 0; r < N; r++) if (grid[r][c] === null){ full2 = false; break; }
        if (full2) cols.push(c);
    }
    return { rows: rows, cols: cols };
}

function place(slotIdx, R, C){
    var piece = tray[slotIdx];
    if (!piece) return false;
    var shape = piece.shape;
    if (!canPlace(shape, R, C)) return false;

    for (var r = 0; r < shape.length; r++){
        for (var c = 0; c < shape[r].length; c++){
            if (shape[r][c]) grid[R + r][C + c] = piece.color;
        }
    }
    var cellsN = 0;
    for (var i = 0; i < shape.length; i++)
        for (var j = 0; j < shape[i].length; j++)
            if (shape[i][j]) cellsN++;
    score += cellsN;
    tray[slotIdx] = null;
    sel = -1;

    var full = findFull();
    var lines = full.rows.length + full.cols.length;
    if (lines > 0){
        combo += 1;
        score += lines * 10 * lines + (combo - 1) * 5;
        var rr, cc;
        for (var i = 0; i < full.rows.length; i++){
            rr = full.rows[i];
            for (cc = 0; cc < N; cc++) boom(rr, cc);
        }
        for (var j = 0; j < full.cols.length; j++){
            cc = full.cols[j];
            for (rr = 0; rr < N; rr++) boom(rr, cc);
        }
        showSplash(lines, combo);

        var isEmpty = true;
        outer:
        for (var r2 = 0; r2 < N; r2++)
            for (var c2 = 0; c2 < N; c2++)
                if (grid[r2][c2] !== null){ isEmpty = false; break outer; }
        if (isEmpty){
            score += 300;
            splashEl.textContent = 'ALL CLEAR! +300';
            splashEl.className = 'splash sp-blast go';
        }
    } else {
        combo = 0;
    }

    if (best < score){ best = score; saveBest(best); }

    if (!tray[0] && !tray[1] && !tray[2]) refill();

    render();
    return true;
}

function endGame(){
    if (!running) return;
    running = false;
    setTimeout(function(){
        ovDesc.innerHTML = 'Skor kamu: <b>' + score + '</b><br>Best: ' + best + '<br><br>Papan penuh — gak ada balok yang muat!';
        overlay.classList.add('is-show');
        document.getElementById('btnStart').textContent = '▶ Main Lagi';
    }, 700);
}

function boom(r, c){
    grid[r][c] = null;
    var el = cells[r][c];
    var b = el.querySelector('.blk');
    if (b){
        b.className = 'blk cblast';
        void b.offsetWidth;
        b.classList.add('pop');
        (function(b){ setTimeout(function(){ if (b.parentNode) b.parentNode.removeChild(b); }, 300); })(b);
    }
}

function tapCell(r, c){
    if (!running) return;
    if (sel < 0 || !tray[sel]) return;
    place(sel, r, c);
}

function tapSlot(i){
    if (!running) return;
    if (!tray[i]) return;
    sel = (sel === i) ? -1 : i;
    render();
}

/* ─────────── DRAG & DROP ─────────── */

var drag = null;   // { i, R, C, valid, moved }
var pvEls = [];    // elemen preview (cell + ghost blk)

function cellSize(){
    return (cells[0][0].clientWidth || 36);
}

function clearPreview(){
    for (var i = 0; i < pvEls.length; i++){
        var it = pvEls[i];
        it.cell.classList.remove('pv');
        if (it.ghost && it.ghost.parentNode) it.ghost.parentNode.removeChild(it.ghost);
    }
    pvEls = [];
}

function anchorFor(shape, r, c){
    var cols = 0;
    for (var x = 0; x < shape.length; x++) cols = Math.max(cols, shape[x].length);
    return {
        r: r - Math.floor((shape.length - 1) / 2),
        c: c - Math.floor((cols - 1) / 2)
    };
}

function showPreview(piece, R, C){
    clearPreview();
    var sh = piece.shape;
    for (var r = 0; r < sh.length; r++){
        for (var c = 0; c < sh[r].length; c++){
            if (!sh[r][c]) continue;
            var rr = R + r, cc = C + c;
            if (rr < 0 || rr >= N || cc < 0 || cc >= N) continue;
            var cell = cells[rr][cc];
            cell.classList.add('pv');
            var g = document.createElement('div');
            g.className = 'blk ghost c' + piece.color;
            cell.appendChild(g);
            pvEls.push({ cell: cell, ghost: g });
        }
    }
}

function buildGhost(piece, size){
    ghostGrid.innerHTML = '';
    ghostGrid.style.gridTemplateColumns = 'repeat(' + size + ', 1fr)';
    ghostGrid.style.gap = '3px';
    var sh = piece.shape;
    var cols = 0;
    for (var x = 0; x < sh.length; x++) cols = Math.max(cols, sh[x].length);
    for (var r = 0; r < sh.length; r++){
        for (var c = 0; c < cols; c++){
            var it = document.createElement('i');
            var s = size + 'px';
            it.style.width = s; it.style.height = s;
            if (sh[r][c]) it.className = 'c' + piece.color;
            else it.style.background = 'transparent';
            ghostGrid.appendChild(it);
        }
    }
    ghostEl.style.display = 'block';
}

function dragStart(i, x, y){
    if (!running || !tray[i]) return;
    drag = { i: i, R: -1, C: -1, valid: false, moved: false };
    buildGhost(tray[i], cellSize());
    dragMove(x, y);
}

function dragMove(x, y){
    if (!drag) return;
    ghostEl.style.left = (x - cellSize() / 2) + 'px';
    ghostEl.style.top = (y - cellSize() / 2 - 20) + 'px';

    var el = document.elementFromPoint(x, y);
    if (!el || !el.classList || !el.classList.contains('cell')){
        clearPreview();
        drag.R = -1; drag.valid = false;
        ghostEl.style.display = 'block';
        return;
    }
    var r = parseInt(el.dataset.r, 10);
    var c = parseInt(el.dataset.c, 10);
    var piece = tray[drag.i];
    if (!piece){ dragEnd(false); return; }
    var a = anchorFor(piece.shape, r, c);
    var ok2 = canPlace(piece.shape, a.r, a.c);
    drag.R = a.r; drag.C = a.c; drag.valid = ok2; drag.moved = true;
    if (ok2){
        showPreview(piece, a.r, a.c);
        ghostEl.style.display = 'none';
    } else {
        clearPreview();
        ghostEl.style.display = 'block';
    }
}

function dragEnd(){
    if (!drag) return;
    var d = drag;
    drag = null;
    ghostEl.style.display = 'none';
    clearPreview();
    if (d.valid && d.R >= 0){
        justDragged = true;
        setTimeout(function(){ justDragged = false; }, 60);
        place(d.i, d.R, d.C);
    }
}

(function bindDrag(){
    for (var i = 0; i < 3; i++){
        (function(i){
            slots[i].addEventListener('pointerdown', function(e){
                if (!running || !tray[i]) return;
                e.preventDefault();
                dragStart(i, e.clientX, e.clientY);
            });
        })(i);
    }
    document.addEventListener('pointermove', function(e){
        if (drag) dragMove(e.clientX, e.clientY);
    }, { passive: false });
    document.addEventListener('pointerup', function(){ dragEnd(); });
    document.addEventListener('pointercancel', function(){ dragEnd(); });
})();

/* ─────────── RENDER ─────────── */

function render(){
    for (var r = 0; r < N; r++){
        for (var c = 0; c < N; c++){
            var el = cells[r][c];
            var v = grid[r][c];
            var b = el.querySelector('.blk:not(.ghost):not(.pop)');
            if (v === null){
                if (b) el.removeChild(b);
            } else if (!b || b.dataset.c != v){
                if (b) el.removeChild(b);
                b = document.createElement('div');
                b.className = 'blk c' + v;
                b.dataset.c = v;
                el.appendChild(b);
            }
            if (!drag) el.className = 'cell';
        }
    }
    for (var i = 0; i < 3; i++){
        var slot = slots[i];
        slot.innerHTML = '';
        slot.className = 'slot' + (i === sel ? ' sel' : '') +
            (tray[i] && !canPlaceAnywhere(tray[i].shape) ? ' dead' : '');
        if (tray[i]){
            var sh2 = tray[i].shape;
            var cols = 0;
            for (var x = 0; x < sh2.length; x++) cols = Math.max(cols, sh2[x].length);
            var mini = document.createElement('div');
            mini.className = 'mini';
            mini.style.gridTemplateColumns = 'repeat(' + cols + ', 1fr)';
            for (var a = 0; a < sh2.length; a++){
                for (var b2 = 0; b2 < cols; b2++){
                    var it = document.createElement('i');
                    if (sh2[a][b2]) it.className = 'c' + tray[i].color;
                    else it.style.background = 'transparent';
                    mini.appendChild(it);
                }
            }
            slot.appendChild(mini);
        }
        (function(i){
            slot.onclick = (function(k){ return function(){
                if (justDragged) return;
                tapSlot(k);
            }; })(i);
        })(i);
    }
    scoreEl.textContent = score;
    bestEl.textContent = best;
    comboEl.textContent = combo > 0 ? 'x' + combo : '-';

    if (running && tray && (tray[0] || tray[1] || tray[2]) && !trayPlaceable()){
        endGame();
    }
}

function start(){
    grid = emptyGrid();
    score = 0; combo = 0; sel = -1;
    best = Math.max(best || 0, loadBest());
    running = true;
    refill();
    overlay.classList.remove('is-show');
    render();
}

document.getElementById('btnStart').addEventListener('click', function(){
    document.getElementById('btnStart').textContent = '▶ Mulai Main';
    start();
});

grid = emptyGrid();
tray = [null, null, null];
best = loadBest();
bestEl.textContent = best;
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
                                messageText: 'Block Blast Game'
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

    await m.react('🧱')

    try {

        const playerName = m.pushName || m.name || 'Sensei'

        const html = createBlockBlastGame({ playerName })

        await sendGamePlayer(sock, m, html)

        await m.react('✅')

    } catch (error) {

        console.error('[BLOCKBLAST ERROR]', error)

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
  config: { key: "blockblast", name: "Block Blast!", emoji: "🧱", desc: "susun blok puzzle ala block blast" },
  build: (opts) => createBlockBlastGame(opts || { playerName: "Player" }),
};
