// plugins/berfikir.js

async function fetchOpus(pesan){
  const r=await fetch(`https://api.synoxcloud.xyz/ai-chat/claude-opus-4.5?pesan=${encodeURIComponent(pesan)}`,
    {signal:AbortSignal.timeout(30000)});
  const d=await r.json(); return d?.result?.reply||null;
}
async function fetchSonnet(pesan){
  const r=await fetch(`https://api.synoxcloud.xyz/ai-chat/claude-sonnet-4.6?pesan=${encodeURIComponent(pesan)}`,
    {signal:AbortSignal.timeout(30000)});
  const d=await r.json(); return d?.result?.reply||null;
}
async function fetchHaiku(prompt){
  const r=await fetch(`https://api.synoxcloud.xyz/ai-chat/claude-haiku-3?prompt=${encodeURIComponent(prompt)}`,
    {signal:AbortSignal.timeout(30000)});
  const d=await r.json(); return d?.result?.response||d?.result?.reply||null;
}
async function fetchPowerbrain(message){
  const r=await fetch(`https://api.synoxcloud.xyz/ai-chat/powerbrain-ai?message=${encodeURIComponent(message)}`,
    {signal:AbortSignal.timeout(120000)});
  const d=await r.json(); return d?.result?.answer||d?.result?.text||d?.result?.message||null;
}

async function runBerfikir(pesan, history){
  if(!pesan){ const e=new Error('pertanyaan kosong'); e.status=400; throw e; }

  const [r1,r2,r3]=await Promise.allSettled([
    fetchOpus(pesan), fetchSonnet(pesan), fetchHaiku(pesan)
  ]);

  const opus   = r1.status==='fulfilled'&&r1.value ? r1.value : null;
  const sonnet = r2.status==='fulfilled'&&r2.value ? r2.value : null;
  const haiku  = r3.status==='fulfilled'&&r3.value ? r3.value : null;

  // kumpulin jawaban yang valid
  const validAnswers = [opus,sonnet,haiku].filter(Boolean);

  // konteks history percakapan sebelumnya (max 6 pesan terakhir)
  let historyContext = '';
  if(history && history.length > 0){
    const recent = history.slice(-6);
    historyContext = '\n\nKonteks percakapan sebelumnya:\n' +
      recent.map(function(h){
        const role = h.role==='user' ? 'User' : 'Asisten';
        const text = (h.parts&&h.parts[0]&&h.parts[0].text)||'';
        return `${role}: ${text.slice(0,300)}`;
      }).join('\n') + '\n\n';
  }

  // prompt ke powerbrain — jangan nyebut "3 AI", dia punya sumber sendiri
  const prompt =
    `${historyContext}` +
    `Pertanyaan: "${pesan}"\n\n` +
    (validAnswers.length > 0
      ? `Berikut beberapa perspektif awal yang bisa dijadikan referensi:\n${validAnswers.map((a,i)=>`- ${a}`).join('\n')}\n\n`
      : '') +
    `Berikan jawaban yang komprehensif, akurat, dan lengkap. Gunakan pengetahuan dan sumber yang kamu miliki untuk menyempurnakan dan memberikan jawaban terbaik. Jangan potong jawaban, jelaskan selengkap mungkin. Jawab dalam bahasa yang sama dengan pertanyaan.`;

  const finalAnswer = await fetchPowerbrain(prompt);

  return {
    drafts: {
      opus:   opus   || '[tidak ada jawaban]',
      sonnet: sonnet || '[tidak ada jawaban]',
      haiku:  haiku  || '[tidak ada jawaban]'
    },
    answer: finalAnswer || 'gagal mendapatkan jawaban'
  };
}

module.exports={runBerfikir};
