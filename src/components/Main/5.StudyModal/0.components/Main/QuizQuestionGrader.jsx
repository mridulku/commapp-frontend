// File: QuizQuestionGrader.js

import axios from "axios";

/**
 * (OLD) gradeQuestion (kept for reference)
 *  Single question, single GPT call
 */
export async function gradeQuestion({
  openAiKey,
  subchapterSummary,
  questionObj,
  userAnswer,
}) {
  const answerGuidance = questionObj.answerGuidance || "";
  const questionText = questionObj.question || "(No question text)";
  const questionType = questionObj.type || "(No type)";

  const gradingPrompt = `
You are a grading assistant. Context: 
"${subchapterSummary}"

We have one question:
Type: ${questionType}
Question: ${questionText}
Answer Guidance (if any): ${answerGuidance}

User's Answer: ${userAnswer}

Please:
1. Rate correctness on a scale of 0 to 5 (integer).
2. Provide 1-2 sentences of feedback.
3. Return only valid JSON in the format:
{
  "score": 3,
  "feedback": "..."
}

No extra commentary.
`.trim();

  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a strict grading assistant. Return JSON only.",
          },
          {
            role: "user",
            content: gradingPrompt,
          },
        ],
        max_tokens: 300,
        temperature: 0.0,
      },
      {
        headers: {
          Authorization: `Bearer ${openAiKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    const gptOutput = response.data.choices[0].message.content.trim();
    let parsed = { score: 0, feedback: "No feedback" };
    try {
      const cleaned = gptOutput.replace(/```json/g, "").replace(/```/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch (err) {
      console.error("Error parsing grading JSON:", err);
    }

    return {
      score: parsed.score ?? 0,
      feedback: parsed.feedback ?? "No feedback provided",
    };
  } catch (err) {
    console.error("Error calling GPT for grading:", err);
    return { score: 0, feedback: "Grading failed: " + err.message };
  }
}

/**
 * (NEW) gradeQuestionsOfType
 *  - openAiKey
 *  - subchapterSummary
 *  - questionType: e.g. "fillInBlank"
 *  - questionsAndAnswers: array of { questionObj, userAnswer }
 *
 * Returns { success, gradingArray: [ {score, feedback}, ... ], error }
 * gradingArray[] matches the order of `questionsAndAnswers`.
 *
 * This does ONE GPT call for all questions of a given type.
 * GPT returns an array of {score, feedback} objects, in the same order.
 */
export async function gradeQuestionsOfType({
  openAiKey,
  subchapterSummary,
  questionType,
  questionsAndAnswers,
}) {
  if (!openAiKey) {
    return { success: false, gradingArray: [], error: "No openAiKey provided." };
  }
  if (!questionsAndAnswers?.length) {
    return { success: true, gradingArray: [], error: "" }; // no questions => nothing to grade
  }

  // Build a big prompt describing each question + user answer
  let questionListPrompt = "";
  questionsAndAnswers.forEach((item, i) => {
    const qObj = item.questionObj;
    const userAns = item.userAnswer || "";
    const questionText = qObj.question || "(No question text)";
    const ansGuide = qObj.answerGuidance || "";
    questionListPrompt += `
  Q#${i + 1}:
  Question: ${questionText}
  Answer Guidance: ${ansGuide}
  User's Answer: ${userAns}
  `;
  });

  const gradingPrompt = `
You are a grading assistant. You have the following subchapter text:
"${subchapterSummary}"

All questions below have type: ${questionType}.
I will provide multiple questions, each with user answers.
Please grade each question from 0 to 5 (integer), and provide 1-2 sentences of feedback.

Here are the questions:
${questionListPrompt}

Return one valid JSON object in this exact format:
{
  "results": [
    {
      "score": 3,
      "feedback": "some short feedback..."
    },
    {
      "score": 2,
      "feedback": "some short feedback for question #2..."
    },
    ...
  ]
}

Where the i-th array element corresponds to Q#i in the same order.

No extra commentary—only that JSON structure.
`.trim();

  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a strict grading assistant. Return JSON only.",
          },
          {
            role: "user",
            content: gradingPrompt,
          },
        ],
        max_tokens: 1200,
        temperature: 0.0,
      },
      {
        headers: {
          Authorization: `Bearer ${openAiKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    const gptOutput = response.data.choices[0].message.content.trim();
    let parsed = null;

    try {
      const cleaned = gptOutput.replace(/```json/g, "").replace(/```/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch (err) {
      console.error("Error parsing grading JSON:", err);
      return {
        success: false,
        gradingArray: [],
        error: "Invalid JSON from GPT. Raw: " + gptOutput,
      };
    }

    if (!parsed.results || !Array.isArray(parsed.results)) {
      return {
        success: false,
        gradingArray: [],
        error: "No 'results' array found in GPT response.",
      };
    }

    // Should be an array of { score, feedback }
    const gradingArray = parsed.results.map((r) => ({
      score: r.score ?? 0,
      feedback: r.feedback ?? "No feedback",
    }));

    return { success: true, gradingArray, error: "" };
  } catch (err) {
    console.error("Error calling GPT for grading (multi-type):", err);
    return {
      success: false,
      gradingArray: [],
      error: "Grading failed: " + err.message,
    };
  }
}