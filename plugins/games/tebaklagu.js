// plugins/games/tebaklagu.js — Tebak Lagu (kuis lagu Indo)
// Audio proxy: /api/music?id=<ytid> → redirect ke mp3 azbry
const axios = require('axios');

// ==================== BANK LAGU ====================
const SONGS = {
  'Raim Laode': ['Komang','Dunia Yang Nanti','Lesung Pipi','Bersenja Gurau','Menari-nari','Suasana Rumah','Sang Badut'],
  'Tulus': ['Hati-Hati di Jalan','Monokrom','Sepatu','Gajah','Teman Hidup','Manusia Kuat','Ruang Sendiri','Teh Hijau'],
  'Hindia': ['Secukupnya','Rumah ke Rumah','Evaluasi','Cincin','Mata Air','Membasuh'],
  'Fourtwnty': ['Zona Nyaman','Fana Merah Jambu','Aku Tenang','Hitam Putih','Kusut','Nematomorpha'],
  'Sal Priadi': ['Gala Bunga Matahari','Dari Planet Lain','Serta Mulia','Amin Paling Serius','Ada titik-titik di ujung doa','Mesra-Mesranya Kecil-Kecilan Dulu'],
  'Bernadya': ['Satu Bulan','Apa Mungkin','Masa Sepi','Lama-Lama','Kata Mereka Ini Berlebihan','Untungnya Hidup Harus Tetap Berjalan','Rabun Jauh'],
  'Nadin Amizah': ['Bertaut','Sorai','Rumpang','Rayuan Perempuan Gila','Semua Aku Dirayakan','Taruh'],
  'Mahalini': ['Sisa Rasa','Melawan Restu','Kisah Sempurna','Sial','Bawa Dia Kembali','Bohongi Hati'],
  'Pamungkas': ['To The Bone','Kenangan Manis','One Only','Closure','I Love You But Im Letting Go','Berapa Kali Kita Akan Saling Memaafkan'],
  'Juicy Luicy': ['Lantas','Tampar','Tanpa Tergesa','Lampu Kuning','Mawar Jingga','Sayangnya'],
  'Sheila On 7': ['Dan','Anugerah Terindah Yang Pernah Kumiliki','Sephia','Melompat Lebih Tinggi','Lapang Dada','Pemuja Rahasia','Hari Bersamanya'],
  'Tiara Andini': ['Merasa Indah','Usai','Janji Setia','Tega','Maafkan Aku','Menjadi Dia','Kupu-Kupu'],
  'Nadhif Basalamah': ['Penjaga Hati','kota ini tak sama tanpamu','Sesuatu','Bergema Sampai Selamanya'],
  'Dewa 19': ['Kangen','Pupus','Separuh Nafas','Risalah Hati','Roman Picisan','Arjuna','Dewi'],
  'Peterpan': ['Semua Tentang Kita','Mungkin Nanti','Bintang di Surga','Ada Apa Denganmu','Topeng','Kukatakan Dengan Indah','Yang Terdalam'],
  'Ghea Indrawari': ['Jiwa Yang Bersedih','Rasa Cinta Ini','Teramini'],
  'Lyodra': ['Pesan Terakhir','Sang Dewi','Kalau Bosan','Ego','Teganya Kau','Dibanding Dia'],
  'Raisa': ['Kali Kedua','Mantan Terindah','Jatuh Hati','Apalah Arti Menunggu','Usai Di Sini','Bahasa Kalbu','Serba Salah','Nyawa dan Harapan'],
  'Denny Caknan': ['Kartonyono Medot Janji','Los Dol','Satru','Cundamani','Wirang','Klebus','Ojo Dibandingke','Kalih Welasku'],
  'Virgoun': ['Surat Cinta Untuk Starla','Bukti','Selamat Tinggal','Orang Yang Sama','Saat Kau Telah Mengerti'],
  'Idgitaf': ['Takut','Satu-Satu','Kehilangan','Berlagak Bahagia'],
  'Tenxi': ['Garam & Madu','Sakit Dadaku'],
  'MALIQ & D\'Essentials': ['Kita Bikin Romantis','Aduh','Senja Teduh Pelita','Pilihanku'],
  'For Revenge': ['Serana','Jakarta Hari Ini','Pulang','Derana'],
  '.Feast': ['Tarot','Nina','Peradaban','Berita Kehilangan','Dalam Hitungan'],
  'Reality Club': ['Anything You Want','Alexandra','Is It The Answer'],
};

function pickSong(){
  const artists = Object.keys(SONGS);
  const art = artists[Math.floor(Math.random()*artists.length)];
  const list = SONGS[art];
  const title = list[Math.floor(Math.random()*list.length)];
  return { artist: art, title };
}

async function findYtId(q){
  try {
    const r = await axios.get(`https://api.piped.private.coffee/search?q=${encodeURIComponent(q)}&filter=videos`, { timeout: 15000 });
    const items = (r.data && r.data.items) || [];
    const v = items.find(x => x.type === 'stream' && x.url);
    if (!v) return null;
    return String(v.url).split('v=')[1] || null;
  } catch(e){ return null; }
}

// Sesi per chat (in-memory, reset kalo serverless cold start — gapapa)
const sessions = {};

module.exports = {
  config: {
    name: 'tebaklagu',
    alias: ['tlagu','guesssong','songquiz','tebaklaguindonesia','kuislagu'],
    category: 'games',
    description: 'Tebak judul lagu Indonesia dari cuplikan audio. Audio diambil dari YouTube via proxy.',
    usage: '@tebaklagu — mulai / jawab | @tebaklagu nyerah — lihat jawaban',
    example: '@tebaklagu',
    inputType: 'text',
    outputType: 'audio',
    tags: ['game','kuis','lagu','tebak','musik','indonesia'],
  },
  run: async (ctx) => {
    const { text='', chatId='default' } = ctx;
    const cmd = String(text||'').trim().toLowerCase();

    if (cmd === 'nyerah' || cmd === 'surender' || cmd === 'giveup' || cmd === 'jawaban') {
      const cur = sessions[chatId];
      if (!cur) return { type:'text', caption:'Belum ada ronde yang aktif. Ketik @tebaklagu buat mulai 🎵' };
      const msg = `😢 Nyeraahh! Jawabannya adalah: *${cur.title}* — ${cur.artist}\n🔗 https://www.youtube.com/watch?v=${cur.vid}\nKetik @tebaklagu buat main lagi 🎶`;
      delete sessions[chatId];
      return { type:'text', caption: msg };
    }

    if (sessions[chatId]) {
      const cur = sessions[chatId];
      const norm = s => String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
      const guess = norm(cmd);
      const ans = norm(cur.title);
      if (guess && (guess === ans || guess.includes(ans) || ans.includes(guess))) {
        const msg = `🎉 BENER KAMUU! Jawabannya *${cur.title}* — ${cur.artist} 👏\n${cur.vid?'🔗 https://www.youtube.com/watch?v='+cur.vid:''}\nSkor +1! Ketik @tebaklagu buat ronde berikutnya 🎵`;
        delete sessions[chatId];
        return { type:'text', caption: msg };
      }
      return { type:'text', caption: `❌ Salah! Coba lagi atau ketik @tebaklagu nyerah buat lihat jawaban.` };
    }

    // Mulai ronde baru
    const { artist, title } = pickSong();
    let vid = null;
    try { vid = await findYtId(`${artist} - ${title}`); } catch(e){}

    sessions[chatId] = { artist, title, vid, startedAt: Date.now() };
    const audUrl = vid ? `/api/music?id=${encodeURIComponent(vid)}` : null;
    const caption = `🎵 *TEBAK LAGU!*\n\n🎙️ Artis: *${artist}*\n⏱️ Dengerin cuplikannya di audio player di bawah (play dulu ya!)\n\nKetik judul lagunya untuk jawab!\nKetik @tebaklagu nyerah buat menyerah.`;
    if (!audUrl) {
      return { type:'text', caption: caption + `\n\n(⚠️ Audio gagal di-load — coba tebak dari artisnya atau ketik @tebaklagu nyerah)` };
    }
    return {
      type: 'audio',
      audioUrl: audUrl,
      mime: 'audio/mpeg',
      caption,
      meta: { game:'tebaklagu', artist, title, vid },
    };
  },
};
