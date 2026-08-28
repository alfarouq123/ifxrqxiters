const { makeQuizPlugin } = require('../../lib/engine/quizGame');
module.exports = makeQuizPlugin({
  name: 'tebaknegara', alias: ['tnegara'], title: 'TEBAK NEGARA', emoji: '🌍',
  description: 'Tebak nama negara dari deskripsi/fakta uniknya',
  dataFile: 'tebaknegara.json', questionField: 'soal', answerField: 'jawaban',
});
