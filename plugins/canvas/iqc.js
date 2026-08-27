const { makeSimpleImagePlugin } = require('../../lib/engine/imageApi');
module.exports = makeSimpleImagePlugin({
  name: 'iqc', alias: ['iosquote'],
  description: 'Membuat gambar fake quote bergaya notifikasi iOS (untuk konten hiburan/meme)',
  usage: '/iqc <teks>', example: '/iqc Hidup itu indah kalau gak ada tugas',
  buildUrl: (t) => `https://api.nexray.eu.cc/maker/v1/iqc?text=${encodeURIComponent(t)}`,
});
