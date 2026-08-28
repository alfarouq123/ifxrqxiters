const { makeRandomAnswerPlugin } = require('../../lib/engine/randomAnswer');
module.exports = makeRandomAnswerPlugin({
  name: 'akankah', alias: ['akan', 'will'],
  description: 'Tanya bot akankah sesuatu terjadi (jawaban random ala magic 8-ball)',
  answers: ['Ya, pasti akan terjadi!', 'Tidak, sepertinya tidak akan.', 'Mungkin akan, mungkin tidak.', 'Insyaallah akan terjadi!', 'Hmm, sulit diprediksi.', 'Pasti! Yakin aja!', 'Kayaknya nggak deh.', 'Akan terjadi kalau kamu mau berusaha.', 'Suatu saat nanti, pasti.', 'Nggak akan, maaf.', 'Tentu akan! Tunggu aja!', 'Hmm, aku ragu.', 'Akan! Percaya sama proses!', 'Kemungkinannya kecil.', 'Pasti akan, aku yakin!', 'Akan, tapi butuh waktu.', 'Kalau jodoh, pasti akan.', 'Akan terjadi di saat yang tepat!'],
});
