// lib/engine/randomAnswer.js — generalisasi plugin "fun" ala magic-8-ball (akankah, apakah, dst)
const { pick } = require('../utils');

function makeRandomAnswerPlugin({ name, alias = [], description, answers }) {
  return {
    config: {
      name, alias, category: 'fun', description,
      usage: `@${name} <pertanyaan>`, example: `@${name} aku bakal sukses?`,
      inputType: 'text', outputType: 'text',
    },
    run: async ({ text }) => {
      if (!text.trim()) {
        const e = new Error(`pertanyaan kosong. contoh: @${name} aku bakal sukses?`);
        e.status = 400; throw e;
      }
      return { type: 'text', text: `${text.trim()}?\n*${pick(answers)}*` };
    },
  };
}
module.exports = { makeRandomAnswerPlugin };
