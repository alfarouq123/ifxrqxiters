const { GPT5 } = require('../../lib/scrapers/ai/gpt5');
const { makeChatModelPlugin } = require('../../lib/engine/aiChatModel');
module.exports = makeChatModelPlugin({ name: 'gpt5', label: 'GPT-5', fn: (p) => GPT5(p) });
