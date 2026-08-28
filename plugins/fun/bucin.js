const { pick } = require('../../lib/utils');
const quotes = [
  'Kamu itu kayak wifi, walau kadang lemot tapi tetep dicariin terus.', 'Kalo cinta itu pajak, aku rela bayar tiap bulan buat kamu.',
  'Aku bukan ahli astronomi, tapi aku yakin kamu adalah bintang paling terang di hidupku.', 'Kamu pasti capek jadi orang paling aku pikirin tiap hari.',
  'Aku gak butuh kalender buat inget hari jadian kita, karena tiap hari sama kamu itu spesial.', 'Kalo rindu bisa dibawa jalan-jalan, mungkin rinduku ke kamu udah keliling dunia.',
  'Senyum kamu itu update status tiap hari di hatiku.', 'Aku sayang kamu lebih dari nasi goreng suka sama kecap.',
];
module.exports = {
  config: { name: 'bucin', alias: ['gombal','love','romantis'], category: 'fun', description: 'Random kata-kata bucin/gombal buat gebetan/pasangan', usage: '/bucin', example: '/bucin', inputType: 'none', outputType: 'text' },
  run: async () => ({ type: 'text', text: `💗 ${pick(quotes)}` }),
};
