module.exports = {
  config: {
    name: 'harilibur', alias: ['libur', 'holiday'], category: 'info',
    description: 'Daftar hari libur nasional Indonesia tahun ini/tahun tertentu',
    usage: '/harilibur [tahun]', example: '/harilibur 2026',
    inputType: 'text', outputType: 'text',
  },
  run: async ({ text }) => {
    const year = parseInt(text.trim()) || new Date().getFullYear();
    const res = await fetch(`https://dayoffapi.vercel.app/api?year=${year}`, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) throw new Error('gagal mengambil data hari libur');
    const data = await res.json();
    if (!data.length) throw new Error(`data hari libur ${year} tidak tersedia`);
    const out = data.map((d) => `📅 ${d.tanggal} — ${d.keterangan}${d.is_cuti ? ' (cuti bersama)' : ''}`).join('\n');
    return { type: 'text', text: `🗓️ *Hari Libur Nasional ${year}*\n\n${out}` };
  },
};
