const { ClaudeHaiku } = require('../../lib/scrapers/ai/claudehaiku');
const { makeChatModelPlugin } = require('../../lib/engine/aiChatModel');
module.exports = makeChatModelPlugin({ name: 'claudehaiku', alias: ['haiku'], label: 'Claude Haiku', fn: (p) => ClaudeHaiku(p) });
