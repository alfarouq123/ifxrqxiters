// plugins/coder.js
// logic buat fitur "bikin kode" — proxy ke synoxcloud ai-coder.

async function runCoder(prompt, session) {
  if (!prompt) {
    const err = new Error('prompt kosong, mau dibikinin kode apa?');
    err.status = 400;
    throw err;
  }

  const sess = session || Math.random().toString(36).slice(2, 10);
  const url = `https://api.synoxcloud.xyz/ai-chat/ai-coder?prompt=${encodeURIComponent(prompt)}&session=${encodeURIComponent(sess)}`;

  let upstream;
  try {
    upstream = await fetch(url, { signal: AbortSignal.timeout(55000) });
  } catch (fetchErr) {
    const err = new Error('gagal koneksi ke coder API: ' + fetchErr.message);
    err.status = 502;
    throw err;
  }

  // baca sebagai text dulu biar aman, baru parse JSON kalau bisa
  const rawText = await upstream.text();

  let data;
  try {
    data = JSON.parse(rawText);
  } catch (_) {
    // API balikin teks biasa / markdown langsung (bukan JSON)
    data = { message: rawText };
  }

  if (!upstream.ok) {
    const err = new Error(
      (data && data.error && data.error.message) ||
      (data && data.message) ||
      `upstream error ${upstream.status}`
    );
    err.status = upstream.status;
    err.payload = data;
    throw err;
  }

  return { data, session: sess };
}

module.exports = { runCoder };
