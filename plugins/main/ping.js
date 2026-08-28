// plugins/main/ping.js
const START_TIME = Date.now();

function fmtUptime(ms) {
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${d}h ${h}j ${m}m ${sec}d`;
}

module.exports = {
  config: {
    name: 'ping',
    alias: ['status'],
    category: 'main',
    description: 'Cek kecepatan respons server & uptime proses',
    usage: '/ping',
    example: '/ping',
    inputType: 'none',
    outputType: 'text',
  },
  run: async () => {
    const t0 = process.hrtime.bigint();
    // simulasi kerja kecil biar ada angka yang masuk akal buat diukur
    await new Promise((r) => setTimeout(r, 1));
    const t1 = process.hrtime.bigint();
    const ms = Number(t1 - t0) / 1e6;

    const text =
      `🏓 *Pong!*\n` +
      `Kecepatan proses: ${ms.toFixed(2)} ms\n` +
      `Uptime proses: ${fmtUptime(Date.now() - START_TIME)}\n` +
      `Node.js: ${process.version}\n` +
      `Waktu server: ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB`;

    return { type: 'text', text };
  },
};
