// plugins/coder.js
// logic buat fitur "bikin kode" — proxy ke synoxcloud ai-coder.
// session dipertahanin biar percakapan lanjutan (revisi kode) nyambung
// di sisi synoxcloud, bukan cuma di history lokal kita.

async function runCoder(prompt, session) {
  if (!prompt) {
    const err = new Error('prompt kosong, mau dibikinin kode apa?');
    err.status = 400;
    throw err;
  }

  const sess = session || Math.random().toString(36).slice(2, 10);
  const url = `https://api.synoxcloud.xyz/ai-chat/ai-coder?prompt=${encodeURIComponent(prompt)}&session=${encodeURIComponent(sess)}`;
  const upstream = await fetch(url);
  const data = await upstream.json();

  if (!upstream.ok) {
    const err = new Error(data?.error?.message || `upstream error ${upstream.status}`);
    err.status = upstream.status;
    err.payload = data;
    throw err;
  }

  return { data, session: sess };
}

module.exports = { runCoder };
