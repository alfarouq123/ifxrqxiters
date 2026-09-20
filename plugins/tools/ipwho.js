// plugins/tools/ipwho.js — info IP address / cek IP sendiri
module.exports = {
  config: {
    name: 'ipwho', alias: ['ip', 'cekip', 'ipinfo'],
    category: 'tools',
    description: 'Info lokasi & ISP dari IP address (kosongin buat cek IP server)',
    usage: '@ipwho [ip]', example: '@ipwho 8.8.8.8',
    inputType: 'text', outputType: 'text',
  },
  run: async ({ text }) => {
    const ip = text.trim();
    if (ip && !/^[0-9a-fA-F.:]{3,45}$/.test(ip)) { const e = new Error('format IP aneh, contoh: @ipwho 8.8.8.8'); e.status = 400; throw e; }
    const res = await fetch('https://ipwho.is/' + encodeURIComponent(ip), { signal: AbortSignal.timeout(15000) });
    const d = await res.json();
    if (d.success === false) throw new Error(d.message || 'IP gak ketemu');
    const txt = `🌐 *IP ${d.ip}*
├─ Negara : ${d.country || '-'} (${d.country_code || '-'}) ${d.flag ? d.flag.emoji : ''}
├─ Region : ${d.region || '-'} , ${d.city || '-'}
├─ Zona   : ${d.timezone ? d.timezone.id : '-'} (UTC${d.timezone ? d.timezone.utc : '-'})
├─ ISP    : ${d.connection ? d.connection.isp : '-'}
├─ AS     : ${d.connection ? d.connection.asn : '-'} ${d.connection ? d.connection.org || '' : ''}
├─ Tipe   : ${d.type}
└─ Koord  : ${d.latitude}, ${d.longitude}`;
    return { type: 'text', text: txt };
  },
};
