const axios = require("axios");
const cheerio = require("cheerio");

async function RedditDL(redditUrl) {
  const ts = Date.now();
  const apiUrl = `https://redvid.io/fetch?_=${ts}`;
  const headers = {
    authority: "redvid.io",
    accept: "application/json, text/plain, */*",
    "content-type": "application/json",
    origin: "https://redvid.io",
    referer: "https://redvid.io/",
    "user-agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "x-requested-with": "XMLHttpRequest",
  };

  try {
    const { data } = await axios.post(
      apiUrl,
      { url: redditUrl, lang: "en" },
      { headers },
    );

    if (data.success && data.view) {
      const $ = cheerio.load(data.view);
      const mediaResults = [];

      $(".response-cinema-gallery-item").each((i, el) => {
        const thumb = $(el).find("img.thumbnail-image").attr("src");
        const downloadBtn = $(el).find('a[href*="/download?token="]');
        const downloadUrl = downloadBtn.attr("href");
        const typeText = downloadBtn.text().trim();

        if (downloadUrl) {
          mediaResults.push({
            item: i + 1,
            type: typeText.toLowerCase().includes("video") ? "video" : "image",
            thumbnail: thumb,
            download_url: downloadUrl,
          });
        }
      });

      return {
        status: true,
        title: $(".response-cinema-title").text().trim(),
        results: mediaResults,
      };
    }

    return { status: false, error: "Gagal mengambil data" };
  } catch (e) {
    /* fallback: redvid ditolak → lewat jina reader, cari link v.redd.it */
    try {
      const jr = await axios.get("https://r.jina.ai/" + redditUrl, {
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
        timeout: 30000,
      });
      const txt = typeof jr.data === "string" ? jr.data : JSON.stringify(jr.data);
      const m = txt.match(/https:\/\/v\.redd\.it\/([a-z0-9]+)/i);
      const titleM = txt.match(/Title:\s*(.+)/i);
      if (m) {
        const id = m[1];
        const cands = ["DASH_720.mp4", "DASH_480.mp4", "DASH_360.mp4"];
        return {
          status: true,
          title: titleM ? titleM[1].trim().slice(0, 120) : "reddit video",
          results: cands.map((q, i) => ({
            item: i + 1,
            type: "video",
            download_url: `https://v.redd.it/${id}/${q}`,
          })),
        };
      }
    } catch (_e2) { /* lanjut ke error */ }
    return { status: false, error: "reddit lagi ngeblokir server — coba lagi nanti, atau pakai link post yang publik" };
  }
}



module.exports = { RedditDL };