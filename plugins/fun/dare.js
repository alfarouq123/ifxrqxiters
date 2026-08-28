const { pick } = require('../../lib/utils');
const challenges = [
  'Kirim pesan random ke kontak paling atas dengan isi "aku kangen kamu"', 'Nyanyi 1 lagu penuh tanpa henti', 'Telepon orang tua dan bilang kamu sayang mereka',
  'Ganti foto profil jadi foto paling jelek selama 1 jam', 'Ceritain crush kamu sekarang ke grup', 'Tirukan suara hewan selama 30 detik',
  'Post story dengan caption paling receh yang kamu bisa pikirkan', 'Coba ngomong pakai logat daerah lain selama 5 menit', 'Kirim voice note nyanyi ke sahabat',
  'Sebutkan 3 hal yang kamu suka dari diri sendiri', 'Joget TikTok random selama 15 detik',
];
module.exports = {
  config: { name: 'dare', alias: ['dareq','tantang'], category: 'fun', description: 'Random tantangan dare buat main truth or dare', usage: '/dare', example: '/dare', inputType: 'none', outputType: 'text' },
  run: async () => ({ type: 'text', text: `🔥 *Dare:*\n\n${pick(challenges)}` }),
};
