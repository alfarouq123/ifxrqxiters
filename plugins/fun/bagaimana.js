const { makeRandomAnswerPlugin } = require('../../lib/engine/randomAnswer');
module.exports = makeRandomAnswerPlugin({
  name: 'bagaimana', alias: ['how'],
  description: 'Tanya bot bagaimana caranya/hasilnya (jawaban random)',
  answers: ['Dengan usaha keras dan sedikit keberuntungan.', 'Pelan-pelan aja, yang penting jalan.', 'Butuh strategi yang matang.', 'Ikutin insting aja.', 'Coba tanya orang yang lebih ahli.', 'Jalanin aja dulu, nanti juga ketemu caranya.', 'Perlu riset lebih dalam dulu.', 'Gampang, tinggal niat aja.'],
});
