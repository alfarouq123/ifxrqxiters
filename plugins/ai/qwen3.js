const { Qwen3 } = require('../../lib/scrapers/ai/qwen3');
const { makeChatModelPlugin } = require('../../lib/engine/aiChatModel');
module.exports = makeChatModelPlugin({ name: 'qwen3', label: 'Qwen3', fn: (p) => Qwen3(p) });
