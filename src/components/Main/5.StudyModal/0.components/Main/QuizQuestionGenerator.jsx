// File: QuizQuestionGenerator.js
import axios from "axios";
import { doc, getDoc } from "firebase/firestore";

/**
 * generateQuestions
 *  - db: Firestore instance
 *  - subChapterId: string
 *  - openAiKey: string
 *  - selectedTypeName: string
 *  - questionTypeDoc: from Firestore (containing expectedJsonStructure, etc.)
 *  - numberOfQuestions: number
 *
 * Returns an object like:
 *  {
 *    success: boolean,
 *    subchapterSummary: string,
 *    questionsData: { questions: [...] } or null,
 *    error: string (if any)
 *  }
 */
export async function generateQuestions({
  db,
  subChapterId,
  openAiKey,
  selectedTypeName,
  questionTypeDoc,
  numberOfQuestions,
}) {
  if (!db || !subChapterId || !openAiKey || !selectedTypeName || !questionTypeDoc) {
    return {
      success: false,
      subchapterSummary: "",
      questionsData: null,
      error: "Missing required parameters.",
    };
  }

  // 1) Fetch the subchapter doc => get "summary"
  let subchapterSummary = "";
  try {
    const ref = doc(db, "subchapters_demo", subChapterId);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      return {
        success: false,
        subchapterSummary: "",
        questionsData: null,
        error: `No subchapter with ID = ${subChapterId}`,
      };
    }
    const data = snap.data();
    subchapterSummary = data.summary || "";
    if (!subchapterSummary) {
      return {
        success: false,
        subchapterSummary: "",
        questionsData: null,
        error: "Subchapter has no summary text.",
      };
    }
  } catch (err) {
    return {
      success: false,
      subchapterSummary: "",
      questionsData: null,
      error: `Error fetching subchapter: ${err.message}`,
    };
  }

  // ----------------------------------------------------------------
  // 2) Build the GPT prompt in a more "modular" style:
  //    We define a few "blocks" (or instructions) and then combine them.
  //    For now, we only use the same pieces as before — subchapterSummary, questionType, numberOfQuestions, etc.
  //    In the future, we can add more blocks with their own instructions (customInstruction1, etc.).
  // ----------------------------------------------------------------

  // Example array of blocks — each block can hold data + a snippet of instructions
  const blocks = [
    {
      // base or "context" block
      name: "baseContext",
      text: `You are a question generator. I have a subchapter summary below.`,
    },
    {
      // customInstruction1 (placeholder):
      //   e.g. "Focus on reading speed" or "Use advanced difficulty"
      //   Right now it's empty, but you can see how you'd add instructions here
      name: "customInstruction1",
      text: "",
    },
    {
      // main instruction block: how many questions, which type
      name: "mainInstruction",
      text: `I want you to produce ${numberOfQuestions} questions of type "${questionTypeDoc.name}".`,
    },
    {
      // subchapter summary block
      name: "subchapterSummary",
      text: `Subchapter Summary:\n${subchapterSummary}`,
    },
    {
      // question type definition block
      name: "questionTypeDefinition",
      text: `
Question Type Definition:
Name: ${questionTypeDoc.name}
Expected JSON structure for each question:
${JSON.stringify(questionTypeDoc.expectedJsonStructure, null, 2)}
      `.trim(),
    },
    {
      // customInstruction2 (placeholder):
      //   e.g. "Use scenario-based approach" if scenarioFocus = ...
      name: "customInstruction2",
      text: "",
    },
    {
      // final format instruction
      name: "returnFormat",
      text: `
Return valid JSON in the format:
{
  "questions": [
    // objects that match the expectedJsonStructure
  ]
}

No extra commentary, only the JSON object.
      `.trim(),
    },
  ];

  // We combine them into one final prompt string
  const prompt = blocks
    .map((block) => block.text.trim())
    .filter(Boolean) // remove any empty lines if a block is empty
    .join("\n\n")
    .trim();

  // ----------------------------------------------------------------
  // 3) Call OpenAI with our assembled prompt
  // ----------------------------------------------------------------
  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "You are a helpful question generator." },
          { role: "user", content: prompt },
        ],
        max_tokens: 1000,
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
    const cleaned = gptMessage
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch (err) {
      return {
        success: false,
        subchapterSummary,
        questionsData: {
          error: "Invalid JSON from GPT",
          raw: gptMessage,
        },
        error: `Error parsing GPT JSON: ${err.message}`,
      };
    }

    // Return success
    return {
      success: true,
      subchapterSummary,
      questionsData: parsed, // { questions: [...] }
      error: "",
    };
  } catch (err) {
    return {
      success: false,
      subchapterSummary,
      questionsData: null,
      error: `Error generating questions (OpenAI): ${err.message}`,
    };
  }
}