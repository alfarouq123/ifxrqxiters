// lib/engine/quizGame.js
// Generalisasi buat semua game "tebak-tebakan" ala WA bot (tebakbendera, tebakkata, family100, dst).
// Karena web ini request/response (gak ada session per-user built-in), soal & jawaban
// didesain STATELESS: pas mulai ronde, nomor soal dikembalikan ke user, terus user balas
// dengan format "<nomor>|<jawaban>". Datasetnya statis & memang dibundel di project ini
// (siapapun bisa baca source-nya), jadi nomor soal dikirim apa adanya tanpa perlu signing HMAC segala.

const path = require('path');
const { pick, normalizeText } = require('../utils');

function loadDataset(file) {
  return require(path.join(__dirname, '..', 'data', file));
}

function makeQuizPlugin({ name, alias = [], title, emoji, description, dataFile, questionField = 'soal', answerField = 'jawaban', hasImage = false }) {
  const dataset = loadDataset(dataFile);

  return {
    config: {
      name, alias, category: 'games', description,
      usage: `/${name} (kosongkan buat mulai ronde baru) ATAU /${name} <no_soal>|<jawabanmu>`,
      example: `/${name}`,
      inputType: 'text', outputType: hasImage ? 'image' : 'text',
    },
    run: async ({ text }) => {
      const trimmed = text.trim();

      // mode: submit jawaban -> "<index>|<jawaban>"
      const submitMatch = trimmed.match(/^(\d+)\s*\|\s*([\s\S]+)$/);
      if (submitMatch) {
        const idx = parseInt(submitMatch[1], 10);
        const guess = submitMatch[2].trim();
        const item = dataset[idx];
        if (!item) throw new Error('nomor soal tidak valid / dataset sudah berubah, mulai ronde baru dulu');

        const correctAnswers = Array.isArray(item[answerField]) ? item[answerField] : [item[answerField]];
        const isCorrect = correctAnswers.some((a) => normalizeText(a) === normalizeText(guess));
        const correctText = correctAnswers.join(' / ');

        const resultText = isCorrect
          ? `✅ *Benar!* jawabannya emang "${correctText}". Mantap!`
          : `❌ *Salah!* jawaban yang bener: "${correctText}"`;

        return { type: 'text', text: resultText };
      }

      // mode: mulai ronde baru
      const idx = Math.floor(Math.random() * dataset.length);
      const item = dataset[idx];
      const question = item[questionField] || item.soal || item.name || '(soal tidak tersedia)';
      const instruksi = `Balas dengan format:\n/${name} ${idx}|jawabanmu`;

      if (hasImage && item.img) {
        const res = await fetch(item.img, { signal: AbortSignal.timeout(20000) });
        if (!res.ok) throw new Error('gagal mengambil gambar soal, coba lagi');
        const mime = (res.headers.get('content-type') || 'image/jpeg').split(';')[0];
        const buffer = Buffer.from(await res.arrayBuffer());
        return { type: 'image', buffer, mime, caption: `${emoji} *${title}*\n\nNo: ${idx}\n${question !== item.img ? question + '\n\n' : ''}${instruksi}` };
      }

      return { type: 'text', text: `${emoji} *${title}*\n\nNo: ${idx}\nSoal: ${question}\n\n${instruksi}` };
    },
  };
}

module.exports = { makeQuizPlugin };
