const { pick } = require('../../lib/utils');
const ratings = [
  { score: '10/10', comment: 'Sempurna! Nggak ada duanya!' }, { score: '9/10', comment: 'Hampir sempurna! Keren banget!' },
  { score: '8/10', comment: 'Bagus banget! Mantap!' }, { score: '7/10', comment: 'Cukup bagus, di atas rata-rata!' },
  { score: '6/10', comment: 'Lumayan, bisa lebih baik lagi.' }, { score: '5/10', comment: 'Biasa aja sih, standar.' },
  { score: '4/10', comment: 'Hmm, kurang sedikit.' }, { score: '100/10', comment: 'LEGEND! Beyond perfect!' },
  { score: '11/10', comment: 'Melebihi ekspektasi!' }, { score: '7.5/10', comment: 'Solid! Good job!' },
  { score: '9.5/10', comment: 'Near perfection!' }, { score: '???/10', comment: 'Error 404: Rating not found.' },
];
module.exports = {
  config: { name: 'rate', alias: ['nilai','rating'], category: 'fun', description: 'Minta bot memberi rating random buat sesuatu', usage: '/rate <sesuatu>', example: '/rate ide bisnisku', inputType: 'text', outputType: 'text' },
  run: async ({ text }) => {
    if (!text.trim()) { const e = new Error('mau di-rate apa? contoh: /rate ide bisnisku'); e.status = 400; throw e; }
    const r = pick(ratings);
    return { type: 'text', text: `Rating dari aku buat "${text.trim()}": *${r.score}*\n${r.comment}` };
  },
};
