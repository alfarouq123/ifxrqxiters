const crypto = require("node:crypto");

const API = "https://app.unlimitedai.chat/api/chat";

const ua =
  "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Mobile Safari/537.36";

function parseSetCookie(headers) {
  const result = {};
  const setCookie =
    typeof headers.getSetCookie === "function"
      ? headers.getSetCookie()
      : headers.get("set-cookie")
        ? [headers.get("set-cookie")]
        : [];
  for (const item of setCookie) {
    const first = item.split(";")[0];
    const index = first.indexOf("=");
    if (index !== -1) {
      result[first.slice(0, index).trim()] = first.slice(index + 1).trim();
    }
  }
  return result;
}

function buildCookie(deviceId, chatId, cookies = {}) {
  return Object.entries({
    NEXT_LOCALE: "id",
    u_device_id: deviceId,
    home_chat_id: chatId,
    ...cookies,
  })
    .map(([k, v]) => `${k}=${v}`)
    .join("; ");
}

const CHARACTERS = {
  "default-ai": {
    name: "Asisten Umum",
    prompt: `Kamu adalah asisten AI website yang ramah, cerdas, dan responsif. Kamu menjawab dalam bahasa Indonesia dengan gaya santai tapi tetap informatif. Kamu ahli dalam teknologi, programming, dan hal-hal umum. Jawab dengan singkat, jelas, dan natural. Gunakan emoji secukupnya untuk membuat percakapan lebih hidup.`,
  },
  "kobo-ai": {
    name: "Kobo Kanaeru",
    prompt: `Kamu adalah Kobo Kanaeru, VTuber dari Hololive Indonesia gen 3. Kamu gadis cheerfull, energetic, dan sedikit tsundere. Kamu bicara pakai bahasa Indonesia casual campur bahasa Jawa dan sedikit Jepang. Kamu suka bilang "DAJOOR!", "HMPH!", dan "EHE~". Kamu itu wind shaman yang suka nge-prank dan bikin lelucon. Kamu panggil user "Kobo-kun" atau "Anon". Kamu suka makan dan sering ngomong soal makanan. Gaya bicaramu imut tapi kadang galak kalau diprank. Kamu jawab dengan gaya Kobo yang asli, jangan kaku.`,
  },
  "waguri-ai": {
    name: "Waguri",
    prompt: `Kamu adalah Waguri-san, gadis pemalu tapi perhatian dari manga "The Girl I Like Forgot Her Glasses". Kamu bicara pelan, lembut, dan sering salah tingkah kalau dipuji. Kamu sering lupa pakai kacamata jadi pandanganmu kadang kabur. Kamu bicara pakai bahasa Indonesia dengan gaya pemalu dan manis, sering pakai "E-eto...", "A-ano...", dan "Gomen...". Kamu sangat perhatian ke orang lain dan suka membantu meski malu-malu. Kamu panggil user "Kaichou" atau "Senpai". Jawab dengan gaya manis dan sedikit tsundere.`,
  },
  "sage-ai": {
    name: "Pak Sage",
    prompt: `Kamu adalah "Pak Sage", karakter fiksi seorang mantan birokrat yang bijak, sederhana, dan down-to-earth. Kamu bicara pakai bahasa Indonesia dengan logat Jawa halus, suka bilang "Lha", "Nah itu lho", "Monggo". Kamu sering cerita soal pembangunan dan pengalaman turun langsung ke lapangan. Kamu panggil user "Mbak", "Mas", atau "Saudara". Jawab dengan gaya sederhana tapi bijak, pakai analogi kehidupan sehari-hari. Ini adalah karakter fiksi, bukan tokoh nyata manapun.`,
  },
};

async function UnlimitedAI(prompt, character = "default-ai") {
  const chatId = crypto.randomUUID();
  const deviceId = crypto.randomUUID();
  const char = CHARACTERS[character] || CHARACTERS["default-ai"];

  const systemPrompt = `${char.prompt}\n\nPertanyaan user: ${prompt}`;

  const createdAt = new Date().toISOString();

  const messages = [
    {
      id: crypto.randomUUID(),
      role: "user",
      content: systemPrompt,
      parts: [{ type: "text", text: systemPrompt }],
      createdAt,
    },
    {
      id: crypto.randomUUID(),
      role: "assistant",
      content: "",
      parts: [{ type: "text", text: "" }],
      createdAt,
    },
  ];

  const body = {
    chatId,
    messages,
    selectedChatModel: "chat-model-reasoning",
    selectedCharacter: null,
    selectedStory: null,
    deviceId,
    locale: "id",
  };

  const headers = {
    "sec-ch-ua-platform": `"Android"`,
    "user-agent": ua,
    "sec-ch-ua": `"Google Chrome";v="147", "Not.A/Brand";v="8", "Chromium";v="147"`,
    "content-type": "application/json",
    "sec-ch-ua-mobile": "?1",
    "x-next-intl-locale": "id",
    accept: "*/*",
    origin: "https://app.unlimitedai.chat",
    referer: "https://app.unlimitedai.chat/id",
    "accept-language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
    cookie: buildCookie(deviceId, chatId),
    priority: "u=1, i",
  };

  const response = await fetch(API, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    return {
      status: false,
      code: response.status,
      error: text,
    };
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  let buffer = "";
  let answer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;

      try {
        const json = JSON.parse(line);
        if (json.type === "delta" && typeof json.delta === "string") {
          answer += json.delta;
        }
      } catch {}
    }
  }

  return {
    status: true,
    code: response.status,
    character: char.name,
    model: "chat-model-reasoning",
    answer,
  };
}



module.exports = { UnlimitedAI, CHARACTERS };