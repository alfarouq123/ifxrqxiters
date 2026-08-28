const { makeRandomAnswerPlugin } = require('../../lib/engine/randomAnswer');
module.exports = makeRandomAnswerPlugin({
  name: 'haruskah', alias: ['should'],
  description: 'Tanya bot perlu/haruskah kamu melakukan sesuatu (jawaban random)',
  answers: ['Iya, harus banget!', 'Nggak usah, santai aja.', 'Terserah kamu sih.', 'Coba pikirkan matang-matang dulu.', 'Ya, jangan ditunda lagi!', 'Nggak wajib kok.', 'Kalau ada waktu, boleh.', 'Sebaiknya iya.'],
});
