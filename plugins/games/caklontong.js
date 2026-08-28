const { makeQuizPlugin } = require('../../lib/engine/quizGame');
module.exports = makeQuizPlugin({
  name: 'caklontong', alias: ['ctebak'], title: 'CAK LONTONG', emoji: '🤪',
  description: 'Tebak-tebakan ala Cak Lontong, jawabannya suka absurd tapi logis',
  dataFile: 'caklontong.json', questionField: 'soal', answerField: 'jawaban',
});
