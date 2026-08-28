// plugins/games/susunkata.js — susun huruf acak jadi kata yang benar (stateless, index dikirim balik)
const path = require('path');
const { normalizeText } = require('../../lib/utils');
const dataset = require(path.join(__dirname, '..', '..', 'lib', 'data', 'tebakkata.json'));

function scramble(word) {
  const letters = word.split('');
  let scrambled = word;
  let attempts = 0;
  while (scrambled === word && attempts < 10) {
    for (let i = letters.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [letters[i], letters[j]] = [letters[j], letters[i]];
    }
    scrambled = letters.join('');
    attempts++;
  }
  return scrambled;
}

module.exports = {
  config: {
    name: 'susunkata', alias: ['susun', 'scramble'], category: 'games',
    description: 'Susun huruf acak jadi kata yang benar',
    usage: '/susunkata (kosongkan buat mulai) ATAU /susunkata <no_soal>|<jawabanmu>',
    example: '/susunkata',
    inputType: 'text', outputType: 'text',
  },
  run: async ({ text }) => {
    const trimmed = text.trim();
    const submitMatch = trimmed.match(/^(\d+)\s*\|\s*([\s\S]+)$/);
    if (submitMatch) {
      const idx = parseInt(submitMatch[1], 10);
      const item = dataset[idx];
      if (!item) throw new Error('nomor soal tidak valid, mulai ronde baru dulu');
      const isCorrect = normalizeText(submitMatch[2]) === normalizeText(item.jawaban);
      return { type: 'text', text: isCorrect ? `✅ *Benar!* kata aslinya "${item.jawaban}"` : `❌ *Salah!* kata aslinya "${item.jawaban}"` };
    }
    const idx = Math.floor(Math.random() * dataset.length);
    const item = dataset[idx];
    const acak = scramble(item.jawaban.toUpperCase());
    return { type: 'text', text: `🔠 *SUSUN KATA*\n\nNo: ${idx}\nSusun huruf ini: *${acak.split('').join(' ')}*\n\nBalas dengan format:\n/susunkata ${idx}|jawabanmu` };
  },
};
