const { makeRandomAnswerPlugin } = require('../../lib/engine/randomAnswer');
module.exports = makeRandomAnswerPlugin({
  name: 'apakah', alias: ['is'],
  description: 'Tanya bot iya/tidaknya sesuatu (jawaban random)',
  answers: ['Iya, benar!', 'Enggak.', 'Bisa jadi.', 'Kayaknya sih iya.', 'Big no.', 'Yakin banget, iya!', 'Ragu-ragu, tapi enggak.', 'Sepertinya begitu.', 'Nggak tau juga sih.', 'Fix iya.', 'Fix enggak.', 'Tanya lagi nanti.'],
});
