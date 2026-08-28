const { makeQuizPlugin } = require('../../lib/engine/quizGame');
module.exports = makeQuizPlugin({
  name: 'tebaktebakan', alias: ['ttebak', 'riddle'], title: 'TEBAK-TEBAKAN', emoji: '❓',
  description: 'Tebak-tebakan receh klasik',
  dataFile: 'tebaktebakan.json', questionField: 'soal', answerField: 'jawaban',
});
