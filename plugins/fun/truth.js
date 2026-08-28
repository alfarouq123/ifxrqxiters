const { pick } = require('../../lib/utils');
const questions = [
  'Siapa crush pertamamu?', 'Hal paling memalukan yang pernah kamu lakukan?', 'Kebohongan terbesar yang pernah kamu bilang ke orang tua?',
  'Pernah naksir sahabat sendiri?', 'Rahasia yang belum pernah kamu ceritakan ke siapapun?', 'Hal yang paling kamu sesali tahun ini?',
  'Pernah nge-stalk mantan sampai jam berapa?', 'Julukan aneh yang pernah kamu punya?', 'Hal paling gila yang pernah kamu lakukan demi seseorang?',
  'Kapan terakhir kali kamu nangis dan kenapa?', 'Aplikasi apa yang paling sering kamu buka diam-diam?', 'Pernah nyontek pas ujian?',
];
module.exports = {
  config: { name: 'truth', alias: ['truthq'], category: 'fun', description: 'Random pertanyaan truth buat main truth or dare', usage: '/truth', example: '/truth', inputType: 'none', outputType: 'text' },
  run: async () => ({ type: 'text', text: `🎯 *Truth:*\n\n${pick(questions)}` }),
};
