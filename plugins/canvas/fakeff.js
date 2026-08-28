// plugins/canvas/fakeff.js — port dari plugin bot WA "fakeff" (fake lobby Free Fire)
const { makeSimpleImagePlugin } = require('../../lib/engine/imageApi');

module.exports = makeSimpleImagePlugin({
  name: 'fakeff',
  alias: ['fakefreefire'],
  description: 'Membuat gambar fake lobby Free Fire dengan nama yang kamu mau',
  usage: '/fakeff <nama>',
  example: '/fakeff IFxrq',
  buildUrl: (nama) => `https://api.kyzznekoo.my.id/api/img/v2/fakeff?username=${encodeURIComponent(nama)}`,
});
