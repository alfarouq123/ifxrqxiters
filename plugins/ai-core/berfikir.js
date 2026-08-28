// plugins/berfikir.js
// 4 AI paralel (opus, sonnet, haiku, copilot-think-deeper)
// Gemini yang gabungin + analisis (bisa baca gambar juga)

async function fetchOpus(pesan){
  try{
    const r=await fetch(`https://api.synoxcloud.xyz/ai-chat/claude-opus-4.5?pesan=${encodeURIComponent(pesan)}`,{signal:AbortSignal.timeout(25000)});
    const d=await r.json(); return d?.result?.reply||null;
  }catch(_){ return null; }
}
async function fetchSonnet(pesan){
  try{
    const r=await fetch(`https://api.synoxcloud.xyz/ai-chat/claude-sonnet-4.6?pesan=${encodeURIComponent(pesan)}`,{signal:AbortSignal.timeout(25000)});
    const d=await r.json(); return d?.result?.reply||null;
  }catch(_){ return null; }
}
async function fetchHaiku(pesan){
  try{
    const r=await fetch(`https://api.synoxcloud.xyz/ai-chat/claude-haiku-3?prompt=${encodeURIComponent(pesan)}`,{signal:AbortSignal.timeout(25000)});
    const d=await r.json(); return d?.result?.response||d?.result?.reply||null;
  }catch(_){ return null; }
}
async function fetchCopilot(pesan){
  try{
    const r=await fetch(`https://api.synoxcloud.xyz/ai-chat/copilot-ai?message=${encodeURIComponent(pesan)}&model=think-deeper`,{signal:AbortSignal.timeout(40000)});
    const d=await r.json(); return d?.result?.text||d?.result?.message||null;
  }catch(_){ return null; }
}

async function runBerfikir(pesan, historyArr, imageUrl){
  if(!pesan){ const e=new Error('pertanyaan kosong'); e.status=400; throw e; }

  const apiKey = process.env.GEMINI_API_KEY;
  if(!apiKey) throw new Error('GEMINI_API_KEY belum di-set');

  // 1. tanya 4 AI paralel
  const [r1,r2,r3,r4] = await Promise.allSettled([
    fetchOpus(pesan), fetchSonnet(pesan), fetchHaiku(pesan), fetchCopilot(pesan)
  ]);

  const answers = [r1,r2,r3,r4].map(r=>r.status==='fulfilled'&&r.value?r.value:null).filter(Boolean);

  // 2. konteks history
  let histContext = '';
  if(historyArr&&historyArr.length){
    histContext = 'Konteks percakapan sebelumnya:\n' +
      historyArr.slice(-8).map(h=>{
        const role = h.role==='user'?'User':'Asisten';
        const txt  = (h.parts&&h.parts[0]&&h.parts[0].text)||'';
        return `${role}: ${txt.slice(0,400)}`;
      }).join('\n') + '\n\n';
  }

  // 3. minta Gemini analisis + gabungkan
  const systemPrompt = 'Kamu adalah asisten analis cerdas. Tugasmu adalah menganalisis berbagai perspektif yang diberikan, mencari kebenaran, menyempurnakan dengan pengetahuanmu sendiri, dan memberikan jawaban akhir yang paling akurat, lengkap, dan berguna. Jangan sebutkan bahwa kamu menggabungkan jawaban dari beberapa sumber. Berikan jawaban langsung seperti jawaban AI tunggal yang komprehensif. Jawab dalam bahasa yang sama dengan pertanyaan. Jangan potong jawaban.';

  const userText = histContext +
    `Pertanyaan: ${pesan}\n\n` +
    (answers.length ? `Berbagai perspektif yang perlu dianalisis dan disempurnakan:\n${answers.map((a,i)=>`[${i+1}] ${a}`).join('\n\n')}\n\n` : '') +
    'Berikan jawaban final yang terbaik dan paling komprehensif.';

  // build Gemini parts — bisa include gambar
  const parts = [{text: userText}];
  if(imageUrl){
    // fetch gambar dari URL, kirim ke Gemini sebagai inlineData
    try{
      const imgRes = await fetch(imageUrl, {signal:AbortSignal.timeout(15000)});
      const imgBuf = await imgRes.arrayBuffer();
      const ct     = imgRes.headers.get('content-type')||'image/jpeg';
      const b64    = Buffer.from(imgBuf).toString('base64');
      parts.push({inlineData:{mimeType:ct.split(';')[0],data:b64}});
    }catch(e){ /* gambar gagal fetch, lanjut tanpa gambar */ }
  }

  const geminiRes = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${apiKey}`,
    {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({
        systemInstruction:{parts:[{text:systemPrompt}]},
        contents:[{role:'user',parts}],
        generationConfig:{temperature:0.7,maxOutputTokens:8192}
      }),
      signal:AbortSignal.timeout(60000)
    }
  );

  const geminiData = await geminiRes.json();
  const finalAnswer = geminiData?.candidates?.[0]?.content?.parts?.map(p=>p.text).filter(Boolean).join('')
    || 'gagal mendapatkan jawaban';

  return {
    drafts:{ opus:r1.value||null, sonnet:r2.value||null, haiku:r3.value||null, copilot:r4.value||null },
    answer:finalAnswer
  };
}

module.exports={runBerfikir};
