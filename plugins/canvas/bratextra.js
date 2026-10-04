// plugins/canvas/bratextra.js — variant brat tambahan via API (cewek, anime, gojo, vermeil, vid, dll)
const axios = require('axios');

const VARIANTS = {
  // === API-based (karakter / video / cewek) ===
  cewek: {
    label: 'Brat Cewek',
    url: (t) => `https://api.deline.web.id/maker/cewekbrat?text=${encodeURIComponent(t)}`,
    type: 'image',
  },
  anime: {
    label: 'Brat Anime',
    url: (t) => `https://api.nexray.web.id/maker/bratanime?text=${encodeURIComponent(t)}`,
    type: 'image',
  },
  bratvideo: {
    label: 'Brat Video',
    url: (t) => `https://api.nexray.eu.cc/maker/bratvid?text=${encodeURIComponent(t)}`,
    type: 'video',
  },
  bratvideo2: {
    label: 'Brat Video V2',
    url: (t) => `https://api.nexray.eu.cc/maker/bratvid2?text=${encodeURIComponent(t)}`,
    type: 'video',
  },
  // === Lokal (canvas @napi-rs) ===
  red:    { label:'Brat Merah',   local:true, bg:'#ff3d5a', text:'#FFFFFF' },
  orange: { label:'Brat Orange',  local:true, bg:'#ff8c3d', text:'#000000' },
  yellow: { label:'Brat Kuning',  local:true, bg:'#ffd93d', text:'#000000' },
  purple: { label:'Brat Ungu',    local:true, bg:'#b58cff', text:'#000000' },
  tosca:  { label:'Brat Tosca',   local:true, bg:'#4fe3c1', text:'#000000' },
  navy:   { label:'Brat Navy',    local:true, bg:'#1e2a5e', text:'#FFFFFF' },
  cream:  { label:'Brat Cream',   local:true, bg:'#f3e4c7', text:'#000000' },
  dark:   { label:'Brat Dark',    local:true, bg:'#0c0c0c', text:'#FFFFFF' },
};

const { createCanvas } = require('@napi-rs/canvas');

function tokenize(text){
  const emojiRegex=/\p{Emoji_Presentation}|\p{Extended_Pictographic}/gu;
  const raw=[];let li=0,m;
  while((m=emojiRegex.exec(text))){if(m.index>li)raw.push({type:'text',value:text.slice(li,m.index)});raw.push({type:'emoji',value:m[0]});li=m.index+m[0].length;}
  if(li<text.length)raw.push({type:'text',value:text.slice(li)});
  const toks=[];
  for(const s of raw){
    if(s.type==='emoji'){if(toks.length)toks.push({type:'space'});toks.push({type:'emoji',value:s.value});}
    else{s.value.split(/\s+/).filter(w=>w.length).forEach(w=>{if(toks.length)toks.push({type:'space'});toks.push({type:'text',value:w});});}
  }
  return toks;
}
function tokW(ctx,tok,fs){if(tok.type==='space')return ctx.measureText(' ').width;if(tok.type==='emoji')return fs*1.15;return ctx.measureText(tok.value||'').width;}
function buildLines(ctx,tokens,fs,mw){
  ctx.font=`bold ${fs}px sans-serif`;const lines=[];let line=[],lw=0;
  for(const tk of tokens){
    const w=tokW(ctx,tk,fs);
    if(tk.type==='space'){if(line.length){line.push({...tk,w});lw+=w;}continue;}
    if(line.length&&lw+w>mw){while(line.length&&line[line.length-1].type==='space'){lw-=line[line.length-1].w;line.pop();}lines.push({items:line,width:lw});line=[{...tk,w}];lw=w;}
    else{line.push({...tk,w});lw+=w;}
  }
  if(line.length){while(line.length&&line[line.length-1].type==='space'){lw-=line[line.length-1].w;line.pop();}lines.push({items:line,width:lw});}
  return lines;
}
function drawLocal(text,bg,tc){
  const W=512,H=512,mw=450,mh=450,cx=256,cy=256;
  const cv=createCanvas(W,H),ctx=cv.getContext('2d');ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);
  const tokens=tokenize(text);let fs=130;let lines=buildLines(ctx,tokens,fs,mw);
  while(fs>10){lines=buildLines(ctx,tokens,fs,mw);const th=lines.length*fs*1.1;if(th<=mh)break;fs-=5;}
  const lh=fs*1.1,th=lines.length*lh;ctx.save();ctx.translate(cx,cy);ctx.fillStyle=tc;ctx.textBaseline='middle';
  const sy=-th/2+lh/2;ctx.font=`bold ${fs}px sans-serif`;
  for(let i=0;i<lines.length;i++){const ln=lines[i];const y=sy+i*lh;let x=-ln.width/2;for(const tk of ln.items){if(tk.type==='text'){ctx.fillText(tk.value,x,y);x+=tk.w;}else if(tk.type==='space')x+=tk.w;}}
  ctx.restore();return cv.toBuffer('image/png');
}

const ALIASES = Object.keys(VARIANTS);

module.exports = {
  config: {
    name: 'bratextra',
    alias: ['bratv', ...ALIASES, 'bratmerah','bratorange','bratkuning','bratungu','brattosca','bratnavy','bratcream','bratdark'],
    category: 'canvas',
    description: 'Variant brat cewek, anime, gojo, vermeil, video, + warna tambahan (merah/orange/kuning/ungu/tosca/navy/cream/dark)',
    usage: '@bratcewek <teks> | @bratanime <teks> | @bratungu <teks> | @bratvideo <teks>',
    example: '@bratcewek hai kack',
    inputType: 'text',
    outputType: 'image',
    tags: ['brat','sticker','maker','cewek','anime','video','warna'],
  },
  run: async ({ text, command }) => {
    const cmd = String(command || '').toLowerCase();
    const keyMap = {
      bratcewek:'cewek',cewekbrat:'cewek',bratperempuan:'cewek',bratgirl:'cewek',cewek:'cewek',
      bratanime:'anime',animebrat:'anime',anime:'anime',
      bratvid:'bratvideo',bratgif:'bratvideo',bratvideo:'bratvideo',bratanimated:'bratvideo',
      bratvid2:'bratvideo2',bratvideo2:'bratvideo2',
      bratred:'red',bratmerah:'red',merah:'red',red:'red',
      bratorange:'orange',orange:'orange',
      bratyellow:'yellow',bratkuning:'yellow',kuning:'yellow',yellow:'yellow',
      bratungu:'purple',purple:'purple',ungu:'purple',
      brattosca:'tosca',tosca:'tosca',
      bratnavy:'navy',navy:'navy',
      bratcream:'cream',cream:'cream',
      bratdark:'dark',dark:'dark',brathitam:'dark',
    };
    const key = keyMap[cmd];
    if (!key || !VARIANTS[key]) {
      const list = Object.entries(VARIANTS).map(([k,v])=>`${v.label}: @${k} <teks>`).join('\n');
      return { type:'text', caption:'🎀 Daftar variant brat extra:\n\n'+list+'\n\n(brat default/hijau/putih/hitam/pink/biru pake @brat biasa)' };
    }
    const v = VARIANTS[key];
    const content = (text||'').trim();
    if (!content) {
      const e = new Error(`teks kosong, contoh: @${cmd} teks lu`); e.status=400; throw e;
    }
    if (v.local) {
      const buf = drawLocal(content, v.bg, v.text);
      return { type:'image', buffer:buf, mime:'image/png', caption:`🎀 ${v.label}: "${content}"` };
    }
    // API-based
    const mtype = v.type === 'video' ? 'video' : 'image';
    try {
      const r = await axios.get(v.url(content), { responseType:'arraybuffer', timeout:25000 });
      const mime = r.headers['content-type'] || (v.type==='video'?'video/mp4':'image/png');
      const buf = Buffer.from(r.data);
      return { type: mtype, buffer: buf, mime, filename: `bratextra-${key}-${Date.now()}.${mtype==='video'?'mp4':'png'}`, caption: `🎀 ${v.label}: "${content}"` };
    } catch (e) {
      const err = new Error(`Gagal generate ${v.label}: ${e.message}`); err.status=502; throw err;
    }
  },
};