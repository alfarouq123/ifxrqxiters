const { makeQuizPlugin } = require('../../lib/engine/quizGame');
module.exports = makeQuizPlugin({
  name: 'tebakkata', alias: ['tkata'], title: 'TEBAK KATA', emoji: '🔤',
  description: 'Tebak satu kata dari kumpulan kata petunjuk',
  dataFile: 'tebakkata.json', questionField: 'soal', answerField: 'jawaban',
});
