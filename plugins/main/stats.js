// plugins/main/stats.js
const { getManifest } = require('../../lib/pluginLoader');

module.exports = {
  config: {
    name: 'stats',
    alias: ['totalfitur'],
    category: 'main',
    description: 'Statistik jumlah plugin & kategori yang aktif',
    usage: '/stats',
    example: '/stats',
    inputType: 'none',
    outputType: 'text',
  },
  run: async () => {
    const manifest = getManifest();
    let txt = `📊 *Statistik Plugin*\n\n`;
    txt += `Total fitur   : ${manifest.totalPlugins}\n`;
    txt += `Total kategori: ${manifest.totalCategories}\n\n`;
    for (const cat of manifest.categories) {
      txt += `${cat.emoji} ${cat.label}: ${cat.count} fitur\n`;
    }
    if (manifest.loadErrors.length) {
      txt += `\n⚠️ ${manifest.loadErrors.length} plugin gagal dimuat (cek log server).`;
    }
    return { type: 'text', text: txt };
  },
};
