// lib/engine/aiChatModel.js — generalisasi plugin "ai/xxx" (semua polanya: fn(prompt) -> {answer})
function makeChatModelPlugin({ name, alias = [], label, fn, description }) {
  return {
    config: {
      name, alias, category: 'ai',
      description: description || `Chat dengan model AI ${label} (gratis, tanpa API key)`,
      usage: `/${name} <pertanyaan>`,
      example: `/${name} Jelaskan apa itu lubang hitam`,
      inputType: 'text', outputType: 'text',
    },
    run: async ({ text }) => {
      if (!text.trim()) { const e = new Error(`pertanyaan kosong. usage: /${name} <pertanyaan>`); e.status = 400; throw e; }
      const result = await fn(text.trim());
      if (!result || result.status === false || !result.answer) {
        throw new Error(`model ${label} sedang tidak merespons, coba lagi nanti`);
      }
      return { type: 'text', text: result.answer };
    },
  };
}
module.exports = { makeChatModelPlugin };
