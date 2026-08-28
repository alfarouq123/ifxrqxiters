// plugins/fun/cekkhodam.js — hasil konsisten buat nama yang sama (seeded random), murni hiburan
const { seededPercent } = require('../../lib/utils');
const KHODAMS = [
  { name: 'Harimau Putih', meaning: 'kuat dan berani, kamu mewarisi kekuatan besar dari leluhurmu.' },
  { name: 'Naga Emas', meaning: 'punya jiwa pemimpin dan aura yang bikin orang segan.' },
  { name: 'Burung Garuda', meaning: 'jiwa bebas, suka petualangan, dan pantang menyerah.' },
  { name: 'Serigala Malam', meaning: 'setia sama circle-mu, tapi waspada sama orang baru.' },
  { name: 'Kucing Oren', meaning: 'santai, gampang akrab, tapi kalau marah serem juga.' },
  { name: 'Kupu-Kupu Biru', meaning: 'lembut di luar tapi kuat banget di dalam.' },
  { name: 'Rubah Sembilan Ekor', meaning: 'cerdik, pandai membaca situasi, susah ditebak.' },
  { name: 'Beruang Madu', meaning: 'kalem tapi kalau udah niat, sat-set langsung eksekusi.' },
];
module.exports = {
  config: {
    name: 'cekkhodam', alias: ['khodam','cekhodam'], category: 'fun',
    description: 'Cek "khodam" random buat hiburan (bukan hal serius, cuma seru-seruan)',
    usage: '/cekkhodam <nama>', example: '/cekkhodam IFxrq',
    inputType: 'text', outputType: 'text',
  },
  run: async ({ text }) => {
    const nama = text.trim() || 'kamu';
    const idx = seededPercent(nama, 'khodam') % KHODAMS.length;
    const k = KHODAMS[idx];
    return { type: 'text', text: `👻 *Cek Khodam: ${nama}*\n\nKhodam: *${k.name}*\nArtinya: ${k.meaning}\n\n_Cuma buat hiburan ya, jangan dipercaya beneran 😄_` };
  },
};
