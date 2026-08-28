const { makeRandomAnswerPlugin } = require('../../lib/engine/randomAnswer');
module.exports = makeRandomAnswerPlugin({
  name: 'bisakah', alias: ['can'],
  description: 'Tanya bot bisa/tidaknya sesuatu dilakukan (jawaban random)',
  answers: ['Bisa banget!', 'Sayangnya enggak bisa.', 'Bisa, asal mau usaha.', 'Coba dulu aja.', '100% bisa!', 'Kemungkinan kecil.', 'Pasti bisa kalau niat.', 'Enggak bisa, cari cara lain.'],
});
