const { makeRandomAnswerPlugin } = require('../../lib/engine/randomAnswer');
module.exports = makeRandomAnswerPlugin({
  name: 'kapan', alias: ['when'],
  description: 'Tanya bot kapan sesuatu akan terjadi (jawaban random)',
  answers: ['Besok!', 'Minggu depan.', 'Bulan depan kayaknya.', 'Tahun depan deh.', 'Sebentar lagi, sabar.', 'Nanti kalau waktunya tepat.', 'Sekarang juga bisa!', 'Entahlah, masih lama.'],
});
