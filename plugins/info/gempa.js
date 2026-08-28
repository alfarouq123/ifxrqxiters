module.exports = {
  config: {
    name: 'gempa', alias: ['earthquake'], category: 'info',
    description: 'Info gempa bumi terkini di Indonesia (data BMKG)',
    usage: '/gempa', example: '/gempa', inputType: 'none', outputType: 'text',
  },
  run: async () => {
    const res = await fetch('https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json', { signal: AbortSignal.timeout(15000) });
    if (!res.ok) throw new Error('gagal mengambil data BMKG');
    const data = (await res.json()).Infogempa.gempa;
    const out =
      `🌋 *Info Gempa Terkini (BMKG)*\n\n` +
      `Waktu    : ${data.Tanggal}, ${data.Jam}\n` +
      `Magnitudo: ${data.Magnitude} SR\n` +
      `Kedalaman: ${data.Kedalaman}\n` +
      `Lokasi   : ${data.Wilayah}\n` +
      `Koordinat: ${data.Coordinates}\n` +
      `Dirasakan: ${data.Dirasakan || '-'}\n` +
      `Potensi  : ${data.Potensi || '-'}`;
    return { type: 'text', text: out };
  },
};
