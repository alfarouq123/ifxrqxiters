// plugins/main/menu.js
const { getManifest } = require('../../lib/pluginLoader');

module.exports = {
  config: {
    name: 'menu',
    alias: ['allmenu', 'help', 'fitur'],
    category: 'main',
    description: 'Menampilkan semua fitur/plugin yang tersedia, dikelompokkan per kategori',
    usage: '/menu',
    example: '/menu',
    inputType: 'none',
    outputType: 'text',
  },
  run: async () => {
    const manifest = getManifest();
    let txt = `✦ *IFxrq Plugin Menu*\n`;
    txt += `Total ${manifest.totalPlugins} fitur di ${manifest.totalCategories} kategori.\n\n`;

    for (const cat of manifest.categories) {
      txt += `╭─「 ${cat.emoji} ${cat.label.toUpperCase()} 」\n`;
      for (const p of cat.plugins) {
        txt += `│ • /${p.name}${p.alias.length ? ` (${p.alias.map((a) => '/' + a).join(', ')})` : ''}\n`;
        if (p.description) txt += `│   ${p.description}\n`;
      }
      txt += `╰────────────────\n\n`;
    }

    txt += `Cara pakai: ketik \`/namaplugin argumen\` di chat, atau buka panel Plugins buat browse & isi form-nya.`;
    return { type: 'text', text: txt };
  },
};
