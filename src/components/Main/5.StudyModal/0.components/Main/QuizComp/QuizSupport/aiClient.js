// aiClient.js
import OpenAI from "openai";
import { writeUsageEvent } from "./usageLogger";

/* ────────── 1.  Configure client ───────────────────────────── */
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_KEY,               // ← same as before
  // Allow browser use only in dev / preview.  In a prod build this stays false
  dangerouslyAllowBrowser: import.meta.env.DEV,          // ← key line
});

/* ────────── 2.  Cost table – update as prices change ───────── */
const USD_PER_1K = {
  "gpt-3.5-turbo": { prompt: 0.0005, completion: 0.0015 },
  // "gpt-4o-mini":   { prompt: 0.006,  completion: 0.012 },
};

/* ────────── 3.  Helper that wraps openai.chat.completions ──── */
export async function chatCompletionTracked(payload, meta = {}) {
  const started = Date.now();
  const res     = await openai.chat.completions.create(payload);

  /* ---------- usage / cost ---------- */
  const u      = res.usage ?? { prompt_tokens: 0, completion_tokens: 0 };
  const price  = USD_PER_1K[payload.model] ?? { prompt: 0, completion: 0 };
  const costUSD =
    (u.prompt_tokens      / 1000) * price.prompt +
    (u.completion_tokens   / 1000) * price.completion;

  /* ---------- write to Firestore ---------- */
  await writeUsageEvent({
    kind             : "openai.chat",
    model            : payload.model,
    prompt_tokens    : u.prompt_tokens,
    completion_tokens: u.completion_tokens,
    cost_usd         : +costUSD.toFixed(6),
    latency_ms       : Date.now() - started,
    prompt_txt       : payload.messages?.[payload.messages.length - 1]?.content ?? "",
    completion_txt   : res.choices?.[0]?.message?.content ?? "",
    ...meta,                  // userId, quizStage, concept, etc.
  });

  return res;
}