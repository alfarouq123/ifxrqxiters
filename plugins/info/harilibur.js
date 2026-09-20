// plugins/info/harilibur.js — data dari Nager.Date (dayoffapi vercel udah mati)
module.exports = {
  config: {
    name: 'harilibur', alias: ['libur', 'holiday'], category: 'info',
    description: 'Daftar hari libur nasional Indonesia tahun ini/tahun tertentu',
    usage: '/harilibur [tahun]', example: '/harilibur 2026',
    inputType: 'text', outputType: 'text',
  },
  run: async ({ text }) => {
    const now = new Date();
    const year = parseInt(String(text).trim()) || now.getFullYear();
    if (year < 2020 || year > now.getFullYear() + 2) {
      const e = new Error('tahun gak valid, contoh: /harilibur 2026'); e.status = 400; throw e;
    }
    const res = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/ID`, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) throw new Error('gagal mengambil data hari libur (coba lagi nanti)');
    const data = await res.json();
    if (!Array.isArray(data) || !data.length) throw new Error(`data hari libur ${year} tidak tersedia`);
    const bulan = ['', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const out = data.map((d) => {
      const [y, m, dd] = d.date.split('-');
      return `📅 ${dd} ${bulan[+m]} ${y} — ${d.localName || d.name}`;
    }).join('\n');
    return { type: 'text', text: `🗓️ *Hari Libur Nasional ${year}*\n\n${out}` };
  },
};
