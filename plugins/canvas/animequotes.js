const { makeSimpleImagePlugin } = require('../../lib/engine/imageApi');
module.exports = makeSimpleImagePlugin({
  name: 'animequotes', alias: ['animequote'],
  description: 'Membuat gambar quotes dengan gaya aesthetic anime',
  usage: '/animequotes <teks quote>', example: '/animequotes Jangan menyerah, terus melangkah',
  buildUrl: (t) => `https://api.cuki.biz.id/api/canvas/animequotes?apikey=cuki&text=${encodeURIComponent(t)}`,
});
