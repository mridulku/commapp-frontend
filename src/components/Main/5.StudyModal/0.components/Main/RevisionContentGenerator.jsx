// File: RevisionContentGenerator.js
import axios from "axios";
import { doc, getDoc } from "firebase/firestore";

/**
 * generateRevisionContent
 * @param {object} db - Firestore instance
 * @param {string} subChapterId
 * @param {string} openAiKey
 * @param {object} revisionConfig - Firestore doc data from "revisionConfigs/<docId>"
 * @param {Array} quizAttempts - Array of quiz attempts so GPT can tailor revision
 *
 * Returns { success, revisionData, error }
 * where `revisionData` is the parsed JSON from GPT
 */
export async function generateRevisionContent({
  db,
  subChapterId,
  openAiKey,
  revisionConfig,
  quizAttempts = [],
}) {
  if (!db || !subChapterId || !openAiKey) {
    return {
      success: false,
      revisionData: null,
      error: "Missing required parameters for generateRevisionContent.",
    };
  }

  // 1) Fetch subchapter doc => summary
  let subchapterSummary = "";
  try {
    const ref = doc(db, "subchapters_demo", subChapterId);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      return {
        success: false,
        revisionData: null,
        error: `No subchapter with ID = ${subChapterId}`,
      };
    }
    const data = snap.data();
    subchapterSummary = data.summary || "";
    if (!subchapterSummary) {
      return {
        success: false,
        revisionData: null,
        error: "Subchapter has no summary text.",
      };
    }
  } catch (err) {
    return {
      success: false,
      revisionData: null,
      error: `Error fetching subchapter: ${err.message}`,
    };
  }

  // 2) Build the prompt from these pieces
  // For demonstration, assume revisionConfig has e.g. "instructions" or "topics" 
  // you want GPT to cover. Then incorporate quizAttempts in some way.
  const blocks = [
    {
      name: "context",
      text: `You are a helpful tutor. The user needs a revision for the following subchapter.`,
    },
    {
      name: "subchapterSummary",
      text: `Subchapter Summary:\n${subchapterSummary}`,
    },
    {
      name: "quizAttempts",
      text: `Here is the user's recent quiz attempt data (for context):\n${JSON.stringify(
        quizAttempts,
        null,
        2
      )}`,
    },
    {
      name: "revisionConfig",
      text: `Revision instructions from config:\n${JSON.stringify(
        revisionConfig,
        null,
        2
      )}`,
    },
    {
      name: "finalFormat",
      text: `
Please return valid JSON in the format:
{
  "title": "Short Title of Revision",
  "bulletPoints": [...],
  "exampleSummary": "..."
}
No extra commentary—only valid JSON. 
      `.trim(),
    },
  ];

  const prompt = blocks
    .map((b) => b.text.trim())
    .filter(Boolean)
    .join("\n\n");

  // 3) Call OpenAI
  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "You are a helpful tutor. Return JSON only." },
          { role: "user", content: prompt },
        ],
        max_tokens: 1200,
        temperature: 0.7,
      },
      {
        headers: {
          Authorization: `Bearer ${openAiKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    const gptMessage = response.data.choices[0].message.content.trim();
    const cleaned = gptMessage.replace(/```json/g, "").replace(/```/g, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch (err) {
      return {
        success: false,
        revisionData: null,
        error: `Error parsing GPT JSON: ${err.message}`,
      };
    }

    return {
      success: true,
      revisionData: parsed, // e.g. { title, bulletPoints, exampleSummary, ... }
      error: "",
    };
  } catch (err) {
    return {
      success: false,
      revisionData: null,
      error: `Error calling GPT for revision: ${err.message}`,
    };
  }
}