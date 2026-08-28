const { makeRandomAnswerPlugin } = require('../../lib/engine/randomAnswer');
module.exports = makeRandomAnswerPlugin({
  name: 'berapa', alias: ['howmany', 'howmuch'],
  description: 'Tanya bot berapa banyak/lama sesuatu (jawaban random)',
  answers: ['Sedikit banget, hampir nggak ada.', 'Lumayan banyak.', 'Banyak banget!', 'Nggak terhitung.', 'Sekitar segelintir aja.', 'Tak terbatas!', 'Cuma satu-dua.', 'Setengah dari yang kamu kira.'],
});
