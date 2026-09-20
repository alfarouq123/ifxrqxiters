// plugins/tools/dnslookup.js — lookup DNS record domain
module.exports = {
  config: {
    name: 'dnslookup', alias: ['dns'],
    category: 'tools',
    description: 'Lihat record DNS suatu domain (A, MX, TXT, dll)',
    usage: '@dnslookup <domain>', example: '@dnslookup google.com',
    inputType: 'text', outputType: 'text',
  },
  run: async ({ text }) => {
    const domain = text.trim().replace(/^https?:\/\//, '').split('/')[0];
    if (!domain || !/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(domain)) {
      const e = new Error('domain gak valid, contoh: @dnslookup google.com'); e.status = 400; throw e;
    }
    const res = await fetch(`https://api.hackertarget.com/dnslookup/?q=${encodeURIComponent(domain)}`, { signal: AbortSignal.timeout(15000) });
    const out = (await res.text()).trim();
    if (!out || /error/i.test(out)) throw new Error('lookup gagal — domainnya bener gak?');
    return { type: 'text', text: `🔍 *DNS ${domain}*\n\n\`\`\`\n${out.slice(0, 1800)}\n\`\`\`` };
  },
};
