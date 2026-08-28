const { makeRandomAnswerPlugin } = require('../../lib/engine/randomAnswer');
module.exports = makeRandomAnswerPlugin({
  name: 'mengapa', alias: ['kenapa', 'why'],
  description: 'Tanya bot alasan kenapa sesuatu terjadi (jawaban random)',
  answers: ['Karena udah takdirnya begitu.', 'Nggak ada alasan khusus.', 'Karena kamu pantas mendapatkannya.', 'Itu rahasia alam semesta.', 'Karena hidup emang begitu adanya.', 'Karena kamu kurang usaha (bercanda).', 'Karena waktunya belum tepat.'],
});
