// Serverless endpoint (Vercel). Keeps the Anthropic API key on the server.
const buckets = new Map();

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ error: "method" });

  const origin = req.headers.origin || "";
  const allowed = (process.env.ALLOWED_ORIGINS || "").split(",").map(s => s.trim()).filter(Boolean);
  if (allowed.length && origin && !allowed.includes(origin)) return res.status(403).json({ error: "origin" });

  const need = process.env.ACCESS_CODE;
  if (need && req.headers["x-access-code"] !== need) return res.status(401).json({ error: "code" });

  const ip = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "unknown";
  const now = Date.now(), limit = Number(process.env.RATE_LIMIT_PER_HOUR) || 60;
  const hits = (buckets.get(ip) || []).filter(t => now - t < 3600000);
  if (hits.length >= limit) return res.status(429).json({ error: "rate" });
  hits.push(now); buckets.set(ip, hits);
  if (buckets.size > 5000) buckets.clear();

  const { prompt, web, tier } = req.body || {};
  if (typeof prompt !== "string" || !prompt.trim() || prompt.length > 70000) return res.status(400).json({ error: "prompt" });
  if (!process.env.ANTHROPIC_API_KEY) return res.status(500).json({ error: "not_configured" });

  const fast = tier === "fast";
  const body = {
    model: fast ? (process.env.MODEL_FAST || "claude-haiku-5-5") : (process.env.MODEL_SMART || "claude-sonnet-5-5"),
    max_tokens: fast ? 8000 : 2000,
    system: "You are the study engine of DentBoard, a dental education app. Only help with dental and medical education tasks based on the material provided. Politely decline anything unrelated.",
    messages: [{ role: "user", content: prompt }],
  };
  if (web && !fast) body.tools = [{ type: "web_search_20250305", name: "web_search", max_uses: 3 }];

  let r, j;
  try {
    r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
      body: JSON.stringify(body),
    });
    j = await r.json();
  } catch (e) { return res.status(502).json({ error: "upstream" }); }
  if (!r.ok) return res.status(502).json({ error: "upstream" });

  let text = "";
  const src = [];
  for (const c of j.content || []) {
    if (c.type === "text") {
      text += c.text;
      for (const ci of c.citations || []) if (ci.url && !src.some(s => s.url === ci.url)) src.push({ title: ci.title || ci.url, url: ci.url });
    }
  }
  if (src.length) text += "\n" + src.slice(0, 4).map(s => `Source: ${String(s.title).replace(/\|/g, "-")} | ${s.url}`).join("\n");
  return res.status(200).json({ text });
}
