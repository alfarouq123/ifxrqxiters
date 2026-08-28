// plugins/code.js
// @code — AI coding assistant di web (Claude Code-style)
// Pake Gemini + fallback ke synoxcloud ai-coder

const CODE_SYSTEM_PROMPT = `Kamu adalah assistant coding expert. Tugasmu membantu user membuat, memperbaiki, dan menganalisis kode.

ATURAN:
1. Selalu kasih kode FULL, jangan dipotong dengan "..." atau "# sisanya sama"
2. Gunakan markdown code blocks dengan bahasa yang sesuai (\`\`\`python, \`\`\`javascript, dll)
3. Berikan penjelasan singkat sebelum kode
4. Jika user minta file lengkap, buatkan yang siap pakai
5. Untuk HTML, buat yang lengkap dengan DOCTYPE, style, script
6. Prioritaskan kode yang working dan best practices
7. Bisa baca dan analisis kode yang user attach
8. Jika ada error, jelaskan penyebab dan solusinya
9. Support berbagai bahasa: JavaScript, Python, HTML, CSS, TypeScript, Java, Go, Rust, dll
10. Jawab dalam bahasa Indonesia yang santai

Saat user attach file kode, analisis dan berikan saran perbaikan jika ada.`;

async function runCode(prompt, historyArr, attachedCode) {
  if (!prompt) {
    const err = new Error('perintah kosong');
    err.status = 400;
    throw err;
  }

  const apiKey = process.env.GEMINI_API_KEY;

  // ── Priority 1: Gemini (karena user udah punya API key) ──
  if (apiKey) {
    try {
      // Build context dari history
      let histContext = '';
      if (historyArr && historyArr.length) {
        histContext = historyArr.slice(-6).map(h => {
          const role = h.role === 'user' ? 'User' : 'Asisten';
          const txt = (h.parts && h.parts[0] && h.parts[0].text) || '';
          return `${role}: ${txt.slice(0, 500)}`;
        }).join('\n') + '\n\n';
      }

      // Attached code context
      let codeContext = '';
      if (attachedCode) {
        codeContext = `[File terlampir: ${attachedCode.filename || 'kode'}]\n\`\`\`\n${attachedCode.content.slice(0, 8000)}\n\`\`\`\n\n`;
      }

      const userText = histContext + codeContext + `Perintah: ${prompt}\n\nBuatkan kode yang lengkap dan siap pakai.`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: CODE_SYSTEM_PROMPT }] },
            contents: [{ role: 'user', parts: [{ text: userText }] }],
            generationConfig: { temperature: 0.4, maxOutputTokens: 65536 }
          }),
          signal: AbortSignal.timeout(90000)
        }
      );

      const data = await response.json();
      const text = data?.candidates?.[0]?.content?.parts?.map(p => p.text).filter(Boolean).join('') || null;

      if (text) {
        return {
          ok: true,
          answer: text,
          source: 'gemini'
        };
      }
    } catch (e) {
      console.error('[code] Gemini gagal, fallback ke synoxcloud:', e.message);
    }
  }

  // ── Priority 2: synoxcloud ai-coder ──
  try {
    const url = `https://api.synoxcloud.xyz/ai-chat/ai-coder?message=${encodeURIComponent(prompt)}`;
    const response = await fetch(url, { signal: AbortSignal.timeout(60000) });
    const data = await response.json();

    // Coba extract dari berbagai format response
    const answer = data?.result?.reply || data?.result?.text || data?.result?.message ||
                   data?.reply || data?.text || data?.message || data?.result ||
                   (typeof data === 'string' ? data : null);

    if (answer) {
      return {
        ok: true,
        answer: typeof answer === 'string' ? answer : JSON.stringify(answer),
        source: 'synoxcloud'
      };
    }

    // Fallback: coba extract dari response mentah
    const raw = JSON.stringify(data);
    return {
      ok: true,
      answer: raw,
      source: 'synoxcloud-raw'
    };
  } catch (e) {
    console.error('[code] synoxcloud juga gagal:', e.message);
  }

  // ── Priority 3: Claude Haiku via synoxcloud ──
  try {
    const url = `https://api.synoxcloud.xyz/ai-chat/claude-haiku-3?prompt=${encodeURIComponent(`Kamu adalah expert coding. Jawab dengan kode lengkap:\n\n${prompt}`)}`;
    const response = await fetch(url, { signal: AbortSignal.timeout(30000) });
    const data = await response.json();
    const answer = data?.result?.response || data?.result?.reply || data?.reply || null;

    if (answer) {
      return {
        ok: true,
        answer: typeof answer === 'string' ? answer : JSON.stringify(answer),
        source: 'haiku'
      };
    }
  } catch (e) {
    console.error('[code] haiku fallback gagal:', e.message);
  }

  throw new Error('semua backend AI coding gagal');
}

module.exports = { runCode };
