/**
 * gptRewrite.js  – v2
 * -----------------------------------------------
 * 1. Rewrites an HTML chunk into the selected style.
 * 2. Returns { html, usage } to the caller.
 * 3. Persists one Firestore doc per call, including:
 *      – token counts (prompt / completion / total)
 *      – system prompt, user prompt (HTML in), GPT reply (HTML out)  ← NEW
 *         (Each string is truncated to 12 kB to stay < 1 MB / doc.)
 */

import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../../../../../firebase"; // adjust if needed

const OPENAI_KEY = import.meta.env.VITE_OPENAI_KEY;

/* ── Firestore settings ────────────────────────────── */
const USAGE_COLL   = "gptUsageLogs";     // keep the same collection
const MAX_CHARS    = 12_000;             // safety-cap for big prompts

/* ── OpenAI settings ───────────────────────────────── */
const MODEL        = "gpt-3.5-turbo";
const MAX_TOKENS   = 600;
const TEMPERATURE  = 0.4;

/* util: truncate long strings so each doc < 1 MB */
const clip = (str = "", max = MAX_CHARS) =>
  str.length > max ? `${str.slice(0, max)}…[truncated]` : str;

/* ── helper that writes one usage record ───────────── */
async function logUsage({
  userId       = "anon",
  planId       = "none",
  subChapterId = "unknown",
  styleKey     = "original",
  usage        = {},
  systemPrompt = "",
  userPrompt   = "",
  gptReply     = "",
}) {
  try {
    const payload = {
      userId,
      planId,
      subChapterId,
      variant  : styleKey,          // "concise" | "bullets" | …
      promptTokens     : usage.prompt_tokens     ?? 0,
      completionTokens : usage.completion_tokens ?? 0,
      totalTokens      : usage.total_tokens      ?? 0,
      systemPrompt : clip(systemPrompt),
      userPrompt   : clip(userPrompt),
      gptReply     : clip(gptReply),
      createdAt    : serverTimestamp(),
    };

    await setDoc(doc(db, USAGE_COLL, crypto.randomUUID()), payload);
    /* eslint-disable-next-line no-console */
    console.log(
      "[gptRewrite] ✅ usage logged →",
      `${USAGE_COLL}/…`,
      { prompt: payload.promptTokens, completion: payload.completionTokens }
    );
  } catch (err) {
    console.error("[gptRewrite] logUsage failed:", err);
  }
}

/* ── MAIN EXPORT ───────────────────────────────────── */
export async function gptRewrite(html, styleKey, meta = {}) {
  /* 1) craft prompts */
  const systemPrompt = `
You are a pedagogy assistant. Rewrite the passage below into the
"${styleKey}" style. Keep inline math notation intact and return valid
HTML only – no markdown fences.
`.trim();

  /* 2) call OpenAI */
  const resp = await fetch("https://api.openai.com/v1/chat/completions", {
    method : "POST",
    headers: {
      "Content-Type" : "application/json",
      "Authorization": `Bearer ${OPENAI_KEY}`,
    },
    body: JSON.stringify({
      model      : MODEL,
      max_tokens : MAX_TOKENS,
      temperature: TEMPERATURE,
      messages   : [
        { role: "system", content: systemPrompt },
        { role: "user",   content: html },
      ],
    }),
  });

  if (!resp.ok) {
    const errTxt = await resp.text();
    console.error("[gptRewrite] OpenAI error:", errTxt);
    return { html, usage: {} }; // fallback to original text
  }

  const json   = await resp.json();
  const result = json.choices?.[0]?.message?.content?.trim() ?? html;
  const usage  = json.usage ?? {};

  /* 3) persist usage (fire-and-forget) */
  logUsage({
    ...meta,
    styleKey,
    usage,
    systemPrompt,
    userPrompt : html,
    gptReply   : result,
  });

  /* 4) bubble result up to caller */
  return { html: result, usage };
}