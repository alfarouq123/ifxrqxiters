const { makeQuizPlugin } = require('../../lib/engine/quizGame');
module.exports = makeQuizPlugin({
  name: 'tebakbendera', alias: ['tbendera', 'flag'], title: 'TEBAK BENDERA', emoji: '🏳️',
  description: 'Tebak nama negara dari gambar benderanya',
  dataFile: 'tebakbendera.json', questionField: 'name', answerField: 'name', hasImage: true,
});
