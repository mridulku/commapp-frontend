// usageLogger.js
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../../../../../../../firebase";   // adjust path if needed

/* ────────────────────────────────────────────────────────────
   Firestore hard-limit = 1 048 576 bytes.  We keep a buffer so
   other numeric / string fields still fit comfortably.
   950 000 chars ≈ 950 000 bytes for plain-ASCII text.
   ────────────────────────────────────────────────────────── */
const MAX_FIELD_LEN = 950_000;

/** clip any over-long string and mark it as truncated */
function clip(str = "", max = MAX_FIELD_LEN) {
  if (typeof str !== "string") return str;
  return str.length > max ? str.slice(0, max) + " …(truncated)" : str;
}

/**
 * Persists one OpenAI usage event to Firestore.
 * You can call it from aiClient.js like:
 *
 *   await writeUsageEvent({
 *     kind          : "openai.chat",
 *     userId        : "...",
 *     model         : "gpt-3.5-turbo",
 *     prompt_tokens : 581,
 *     completion_tokens: 117,
 *     cost_usd      : 0.00046,
 *     latency_ms    : 978,
 *     prompt_txt    : bigPromptString,
 *     completion_txt: bigAnswerString,
 *     // …anything else you need
 *   });
 */
export async function writeUsageEvent(evt) {
  // defensive copy + size-guard
  const docData = {
    ...evt,
    prompt_txt    : clip(evt.prompt_txt),
    completion_txt: clip(evt.completion_txt),
    ts            : serverTimestamp(),          // non-spoofable server time
  };

  try {
    await addDoc(collection(db, "usage_events"), docData);

    /* Optional console for dev builds only */
    if (import.meta.env.DEV) {
      console.info("[usageLogger] event written:", {
        model : docData.model,
        usd   : docData.cost_usd,
        pTok  : docData.prompt_tokens,
        cTok  : docData.completion_tokens,
      });
    }
  } catch (err) {
    console.error("[usageLogger] Firestore write failed →", err);
  }
}