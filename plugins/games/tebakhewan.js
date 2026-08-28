const { makeQuizPlugin } = require('../../lib/engine/quizGame');
module.exports = makeQuizPlugin({
  name: 'tebakhewan', alias: ['thewan'], title: 'TEBAK HEWAN', emoji: '🐾',
  description: 'Tebak nama hewan dari deskripsi/fakta uniknya',
  dataFile: 'tebakhewan.json', questionField: 'soal', answerField: 'jawaban',
});
