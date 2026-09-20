// plugins/ai/deepseek.js — via engine overchat (notegpt udah mati)
const { GPT5 } = require('../../lib/scrapers/ai/gpt5');
const { makeChatModelPlugin } = require('../../lib/engine/aiChatModel');
module.exports = makeChatModelPlugin({
  name: 'deepseek', alias: ['dsthinking'], label: 'DeepSeek V3',
  description: 'Chat dengan DeepSeek V3, cocok buat soal logika & jawaban panjang',
  fn: (p) => GPT5(p, { model: 'deepseek/deepseek-chat-v3-0324' }),
});
