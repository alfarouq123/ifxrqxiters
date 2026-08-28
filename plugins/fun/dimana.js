const { makeRandomAnswerPlugin } = require('../../lib/engine/randomAnswer');
module.exports = makeRandomAnswerPlugin({
  name: 'dimana', alias: ['where'],
  description: 'Tanya bot di mana sesuatu berada (jawaban random)',
  answers: ['Ada di dekat sini kok.', 'Jauh banget, di ujung dunia.', 'Coba cek di kamar.', 'Di tempat yang nggak kamu duga.', 'Masih misteri sampai sekarang.', 'Ada di hatimu :)', 'Sedang dalam perjalanan.', 'Di internet, cari aja.'],
});
