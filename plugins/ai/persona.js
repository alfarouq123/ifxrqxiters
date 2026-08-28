// plugins/ai/persona.js — chat dengan berbagai karakter AI fiksi (bukan tokoh nyata)
const { UnlimitedAI, CHARACTERS } = require('../../lib/scrapers/ai/unlimitedai');

module.exports = {
  config: {
    name: 'persona', alias: ['rolechat', 'karakterai'],
    category: 'ai',
    description: `Chat dengan karakter AI fiksi. Karakter tersedia: ${Object.keys(CHARACTERS).join(', ')}`,
    usage: '/persona <nama_karakter>|<pesan>',
    example: '/persona default-ai|Halo, kamu siapa?',
    inputType: 'text', outputType: 'text',
  },
  run: async ({ text }) => {
    if (!text.includes('|')) {
      const list = Object.entries(CHARACTERS).map(([k, v]) => `• ${k} — ${v.name}`).join('\n');
      return { type: 'text', text: `Pilih karakter dulu, format: /persona <nama_karakter>|<pesan>\n\nKarakter tersedia:\n${list}` };
    }
    const [charKey, ...rest] = text.split('|');
    const message = rest.join('|').trim();
    if (!message) { const e = new Error('pesan kosong'); e.status = 400; throw e; }
    const character = CHARACTERS[charKey.trim()] ? charKey.trim() : 'default-ai';
    const result = await UnlimitedAI(message, character);
    if (!result || !result.answer) throw new Error('karakter AI sedang tidak merespons');
    return { type: 'text', text: result.answer };
  },
};
