// plugins/berfikir.js

async function fetchOpus(pesan) {
  const res = await fetch(
    `https://api.synoxcloud.xyz/ai-chat/claude-opus-4.5?pesan=${encodeURIComponent(pesan)}`,
    { signal: AbortSignal.timeout(30000) }
  );
  const data = await res.json();
  return data?.result?.reply || null;
}

async function fetchSonnet(pesan) {
  const res = await fetch(
    `https://api.synoxcloud.xyz/ai-chat/claude-sonnet-4.6?pesan=${encodeURIComponent(pesan)}`,
    { signal: AbortSignal.timeout(30000) }
  );
  const data = await res.json();
  return data?.result?.reply || null;
}

async function fetchHaiku(prompt) {
  const res = await fetch(
    `https://api.synoxcloud.xyz/ai-chat/claude-haiku-3?prompt=${encodeURIComponent(prompt)}`,
    { signal: AbortSignal.timeout(30000) }
  );
  const data = await res.json();
  return data?.result?.response || data?.result?.reply || null;
}

async function fetchPowerbrain(message) {
  const res = await fetch(
    `https://api.synoxcloud.xyz/ai-chat/powerbrain-ai?message=${encodeURIComponent(message)}`,
    { signal: AbortSignal.timeout(90000) }
  );
  const data = await res.json();
  return data?.result?.answer || data?.result?.text || data?.result?.message || null;
}

async function runBerfikir(pesan) {
  if (!pesan) { const e = new Error('pertanyaan kosong'); e.status = 400; throw e; }

  const [r1, r2, r3] = await Promise.allSettled([
    fetchOpus(pesan),
    fetchSonnet(pesan),
    fetchHaiku(pesan)
  ]);

  const opus   = r1.status === 'fulfilled' && r1.value ? r1.value : '[tidak ada jawaban]';
  const sonnet = r2.status === 'fulfilled' && r2.value ? r2.value : '[tidak ada jawaban]';
  const haiku  = r3.status === 'fulfilled' && r3.value ? r3.value : '[tidak ada jawaban]';

  const analisisPrompt =
    `Pertanyaan user: "${pesan}"\n\n` +
    `Berikut jawaban dari 3 AI berbeda:\n` +
    `[Perspektif 1]: ${opus}\n` +
    `[Perspektif 2]: ${sonnet}\n` +
    `[Perspektif 3]: ${haiku}\n\n` +
    `Analisis dan gabungkan ketiga jawaban di atas menjadi satu jawaban terbaik yang paling akurat, lengkap, dan mudah dipahami. Berikan jawaban final yang komprehensif.`;

  const finalAnswer = await fetchPowerbrain(analisisPrompt);

  return {
    drafts: { opus, sonnet, haiku },
    answer: finalAnswer || 'gagal menganalisis jawaban'
  };
}

module.exports = { runBerfikir };
