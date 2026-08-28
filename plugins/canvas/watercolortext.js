const { makeSimpleImagePlugin } = require('../../lib/engine/imageApi');
module.exports = makeSimpleImagePlugin({
  name: 'watercolortext', alias: ['wctext'],
  description: 'Membuat gambar teks dengan efek watercolor/cat air',
  usage: '/watercolortext <teks>', example: '/watercolortext Selamat Pagi',
  buildUrl: (t) => `https://api.cuki.biz.id/api/ephoto/watercolortext?apikey=cuki&text=${encodeURIComponent(t)}`,
});
