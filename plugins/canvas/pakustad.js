const { makeSimpleImagePlugin } = require('../../lib/engine/imageApi');
module.exports = makeSimpleImagePlugin({
  name: 'pakustad', alias: ['tanyapakustad'],
  description: 'Tanya "Pak Ustad" (gambar jawaban lucu/bijak untuk hiburan)',
  usage: '/pakustad <pertanyaan>', example: '/pakustad Kenapa aku jomblo terus?',
  buildUrl: (t) => `https://api.cuki.biz.id/api/canvas/ustadz?apikey=cuki&text=${encodeURIComponent(t)}`,
});
