const { makeQuizPlugin } = require('../../lib/engine/quizGame');
module.exports = makeQuizPlugin({
  name: 'tebakmakanan', alias: ['tmakanan'], title: 'TEBAK MAKANAN DAERAH', emoji: '🍲',
  description: 'Tebak asal daerah makanan dari gambar & deskripsinya',
  dataFile: 'tebakmakanan.json', questionField: 'deskripsi', answerField: 'jawaban', hasImage: true,
});
