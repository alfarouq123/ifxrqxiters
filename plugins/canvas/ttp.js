// plugins/canvas/ttp.js — text to picture (stiker teks, via nexray)
const { makeSimpleImagePlugin } = require('../../lib/engine/imageApi');

module.exports = makeSimpleImagePlugin({
  name: 'ttp',
  alias: ['texttopicture', 'stikerteks'],
  description: 'Bikin gambar teks putih background hitam (gaya stiker teks WA)',
  usage: '@ttp <teks>', example: '@ttp halo sayang',
  buildUrl: (t) => `https://api.nexray.eu.cc/maker/ttp?text=${encodeURIComponent(t)}`,
});
