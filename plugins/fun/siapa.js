const { makeRandomAnswerPlugin } = require('../../lib/engine/randomAnswer');
module.exports = makeRandomAnswerPlugin({
  name: 'siapa', alias: ['who'],
  description: 'Tanya bot siapa pelaku/orangnya (jawaban random, buat hiburan)',
  answers: ['Kamu sendiri!', 'Orang misterius.', 'Nggak ada yang tau.', 'Mungkin tetanggamu.', 'Bukan aku, aku cuma AI 😹', 'Seseorang yang deket sama kamu.', 'Takdir yang menentukan.'],
});
