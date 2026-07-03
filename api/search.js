// api/search.js

module.exports = async (req, res) => {
  if (!['GET', 'POST'].includes(req.method)) {
    return res.status(405).json({
      error: {
        message: 'method not allowed'
      }
    });
  }

  const message =
    req.method === 'GET'
      ? req.query.message
      : req.body?.message;

  const model =
    (req.method === 'GET'
      ? req.query.model
      : req.body?.model) || 'think-deeper';

  if (!message?.trim()) {
    return res.status(400).json({
      error: {
        message: 'query kosong'
      }
    });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => {
    controller.abort();
  }, 30000);

  try {
    const upstream = await fetch(
      `https://api.synoxcloud.xyz/ai-chat/copilot-ai?message=${encodeURIComponent(
        message
      )}&model=${encodeURIComponent(model)}`,
      {
        signal: controller.signal,
        headers: {
          Accept: 'application/json'
        }
      }
    );

    clearTimeout(timeout);

    const text = await upstream.text();

    let data;

    try {
      data = JSON.parse(text);
    } catch {
      return res.status(502).json({
        error: {
          message: 'response api bukan json'
        },
        raw: text
      });
    }

    return res
      .status(upstream.status)
      .json(data);

  } catch (err) {
    clearTimeout(timeout);

    if (err.name === 'AbortError') {
      return res.status(504).json({
        error: {
          message: 'request timeout'
        }
      });
    }

    return res.status(500).json({
      error: {
        message: err.message || 'internal error'
      }
    });
  }
};