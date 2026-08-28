module.exports = {
  config: {
    name: 'rules',
    alias: ['aturan'],
    category: 'main',
    description: 'Aturan penggunaan website & plugin',
    usage: '/rules',
    example: '/rules',
    inputType: 'none',
    outputType: 'text',
  },
  run: async () => {
    const text =
      `📜 *Aturan Pakai*\n\n` +
      `1. Semua fitur di sini dibuat buat kesenangan & kebutuhan sehari-hari, jangan disalahgunakan.\n` +
      `2. Fitur download cuma buat konten publik/milik sendiri — hormati hak cipta pemilik konten.\n` +
      `3. Fitur AI bisa aja salah, selalu cek ulang info penting.\n` +
      `4. Beberapa fitur (primbon, cek-cekan, ramalan) murni hiburan, jangan dianggap serius/ilmiah.\n` +
      `5. Jangan pakai fitur apapun buat spam, penipuan, atau merugikan orang lain.\n\n` +
      `Selamat mencoba! 🚀`;
    return { type: 'text', text };
  },
};
