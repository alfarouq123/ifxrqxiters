// plugins/random/anime.js — random foto anime (waifu/neko/shinobu)
const { getImage } = require('../../lib/engine/imageApi');

const TYPES = ['waifu', 'neko', 'shinobu'];

module.exports = {
  config: {
    name: 'anime', alias: ['waifu', 'neko', 'shinobu', 'animepic'],
    category: 'random',
    description: 'Random foto anime (waifu / neko / shinobu)',
    usage: '@anime [waifu/neko/shinobu]', example: '@anime waifu',
    inputType: 'text', outputType: 'image',
  },
  run: async ({ text }) => {
    const t = (text.trim().toLowerCase() || 'waifu');
    const type = TYPES.includes(t) ? t : 'waifu';
    const { buffer, mime } = await getImage(`https://api.nexray.eu.cc/random/anime?type=${type}`, { timeoutMs: 30000 });
    return { type: 'image', buffer, mime, caption: `anime: ${type} 🎲` };
  },
};
