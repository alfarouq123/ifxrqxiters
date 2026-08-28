const { makeQuizPlugin } = require('../../lib/engine/quizGame');
module.exports = makeQuizPlugin({
  name: 'family100', alias: ['f100'], title: 'FAMILY 100', emoji: '👨‍👩‍👧‍👦',
  description: 'Jawab survey ala Family 100 (jawaban bisa lebih dari satu, jawab salah satu aja)',
  dataFile: 'family100.json', questionField: 'soal', answerField: 'jawaban',
});
