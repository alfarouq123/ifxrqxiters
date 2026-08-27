const { makeSimpleImagePlugin } = require('../../lib/engine/imageApi');
module.exports = makeSimpleImagePlugin({
  name: 'balogo', alias: ['bluearchivelogo'],
  description: 'Membuat logo teks bergaya Blue Archive',
  usage: '/balogo <teks>', example: '/balogo IFxrq',
  buildUrl: (t) => `https://api.nexray.web.id/maker/balogo?text=${encodeURIComponent(t)}`,
});
