const { DeepSeekThinking } = require('../../lib/scrapers/ai/deepseek');
const { makeChatModelPlugin } = require('../../lib/engine/aiChatModel');
module.exports = makeChatModelPlugin({
  name: 'deepseek', alias: ['dsthinking'], label: 'DeepSeek (thinking mode)',
  description: 'Chat dengan DeepSeek mode reasoning/thinking, cocok untuk soal logika & matematika',
  fn: (p) => DeepSeekThinking(p),
});
