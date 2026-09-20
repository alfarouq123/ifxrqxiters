// api/run.js — SATU endpoint generik buat jalanin semua plugin di /plugins/<kategori>
// Dipanggil frontend: POST { command, text, imageBase64, imageMime }
// Kontrak plugin: config { name, alias, category, description, usage, example, inputType, outputType }
// run({ text, args, imageBuffer, imageMime }) -> { type:'text', text }
//    | { type:'image'|'audio'|'file', buffer, mime, filename?, caption? }
const { loadAll } = require('../lib/pluginLoader');

const MAX_BODY = 4 * 1024 * 1024;      // base64 gambar dari user (limit body vercel ±4.5mb)
const MAX_OUT = 4 * 1024 * 1024;       // hasil buffer keluar (response serverless vercel ±4.5mb)

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'pake POST' });

  try {
    const body = req.body || {};
    const rawCommand = String(body.command || '').trim().toLowerCase();
    const command = rawCommand.replace(/^[@/]+/, '');
    if (!command) return res.status(400).json({ error: 'command kosong. buka ⚙️ buat liat daftar plugin' });

    const registry = loadAll();
    const plugin = registry.byCommand.get(command);
    if (!plugin) {
      return res.status(404).json({ error: `plugin "@${command}" gak ketemu. ketik @menu atau pencet ⚙️ buat liat daftar` });
    }

    /* ── siapin context ── */
    const text = String(body.text || '').trim();
    const args = text ? text.split(/\s+/).filter(Boolean) : [];

    let imageBuffer = null;
    if (body.imageBase64) {
      if (String(body.imageBase64).length > MAX_BODY) {
        return res.status(413).json({ error: 'gambarnya kegedean (max ±3mb). kompres dulu' });
      }
      imageBuffer = Buffer.from(body.imageBase64, 'base64');
    }

    const cfg = plugin.config;
    const inputType = cfg.inputType || 'text';
    if ((inputType === 'text' || inputType === 'text+image') && !text && inputType !== 'none') {
      if (inputType === 'text') {
        return res.status(400).json({ error: `teksnya kosong. format: ${cfg.usage || '@' + cfg.name + ' <teks>'} — contoh: ${cfg.example || ''}` });
      }
    }
    if ((inputType === 'image' || inputType === 'text+image') && !imageBuffer) {
      return res.status(400).json({ error: `plugin ini butuh gambar — attach/pilih foto dulu. format: ${cfg.usage || '@' + cfg.name}` });
    }

    const ctx = { text, args, imageBuffer, imageMime: body.imageMime || null };

    /* ── jalanin ── */
    const result = await plugin.run(ctx);
    if (!result || !result.type) throw new Error('plugin gak balikin hasil yang valid');

    /* ── hasil buffer (image/audio/file) ── */
    if (result.buffer) {
      const buf = Buffer.isBuffer(result.buffer) ? result.buffer : Buffer.from(result.buffer);
      if (buf.length > MAX_OUT) {
        return res.status(413).json({
          error: `hasilnya ${Math.round(buf.length / 1024 / 1024)}mb — kegedean buat dikirim via serverless. coba input yang lebih kecil`,
        });
      }
      return res.status(200).json({
        type: result.type,
        mime: result.mime || 'application/octet-stream',
        filename: result.filename || null,
        caption: result.caption || null,
        base64: buf.toString('base64'),
      });
    }

    /* ── hasil teks ── */
    const out = result.text ?? result.result ?? result.message ?? result.data;
    if (out === undefined || out === null || out === '') {
      return res.status(500).json({ error: 'plugin jalan tapi balasannya kosong' });
    }
    return res.status(200).json({
      type: 'text',
      text: typeof out === 'string' ? out : JSON.stringify(out, null, 2),
      caption: result.caption || null,
    });
  } catch (err) {
    return res.status(err.status || 500).json({ error: { message: err.message } });
  }
};
