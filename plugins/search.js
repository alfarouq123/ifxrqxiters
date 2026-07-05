// plugins/search.js
// logic buat plugin @search — proxy ke synoxcloud copilot-ai.

async function runSearch(message, model = 'think-deeper') {
  if (!message) {
    const err = new Error('query kosong, gak ada yang mau dicari');
    err.status = 400;
    throw err;
  }

  const url = `https://api.synoxcloud.xyz/ai-chat/copilot-ai?message=${encodeURIComponent(message)}&model=${encodeURIComponent(model)}`;
  const upstream = await fetch(url);
  const data = await upstream.json();

  if (!upstream.ok) {
    const err = new Error(data?.error?.message || `upstream error ${upstream.status}`);
    err.status = upstream.status;
    err.payload = data;
    throw err;
  }
  return data;
}

module.exports = { runSearch };
