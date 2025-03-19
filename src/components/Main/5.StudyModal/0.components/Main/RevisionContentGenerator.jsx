/**
 * File: RevisionContentGenerator.js
 * Description:
 *   - Self-contained logic for building revision content from GPT
 *   - Automatically determines which concepts the user failed in their latest quiz attempt
 *   - Returns a concept-by-concept breakdown
 */

import axios from "axios";
import {
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  where,
  orderBy,
} from "firebase/firestore";

export async function generateRevisionContent({
  db,
  subChapterId,
  openAiKey,
  revisionConfig,
  userId,
  quizStage,
}) {
  if (!db || !subChapterId || !openAiKey || !userId || !quizStage) {
    return {
      success: false,
      revisionData: null,
      error: "Missing required parameters in generateRevisionContent.",
    };
  }

  // 1) Identify the user's *latest* quiz attempt => find failing concepts
  let failedConcepts = [];
  try {
    const quizRef = collection(db, "quizzes_demo");
    const q = query(
      quizRef,
      where("userId", "==", userId),
      where("subchapterId", "==", subChapterId),
      where("quizType", "==", quizStage),
      orderBy("attemptNumber", "desc")
    );
    const snap = await getDocs(q);
    if (snap.empty) {
      // No attempts => no fails => generic revision
      console.log("No quiz attempts found => providing a generic revision.");
    } else {
      // The first doc in the descending order is the latest attempt
      const latestDoc = snap.docs[0];
      const data = latestDoc.data();
      const quizSubmission = data.quizSubmission || [];

      // Build a concept map => { conceptName: { correct, total } }
      const conceptMap = {};
      quizSubmission.forEach((qItem) => {
        const cName = qItem.conceptName || "UnknownConcept";
        if (!conceptMap[cName]) {
          conceptMap[cName] = { correct: 0, total: 0 };
        }
        conceptMap[cName].total++;
        if (parseFloat(qItem.score) >= 1) {
          conceptMap[cName].correct++;
        }
      });

      // If ratio < 1 => fail
      Object.keys(conceptMap).forEach((cName) => {
        const { correct, total } = conceptMap[cName];
        if (total > 0 && correct < total) {
          failedConcepts.push(cName);
        }
      });
    }
  } catch (err) {
    return {
      success: false,
      revisionData: null,
      error: `Error fetching latest quiz attempt: ${err.message}`,
    };
  }

  // 2) Fetch subchapter summary from "subchapters_demo"
  let subchapterSummary = "";
  try {
    const ref = doc(db, "subchapters_demo", subChapterId);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      return {
        success: false,
        revisionData: null,
        error: `No subchapter found with ID: ${subChapterId}`,
      };
    }
    subchapterSummary = snap.data().summary || "";
  } catch (err) {
    return {
      success: false,
      revisionData: null,
      error: `Error fetching subchapter doc: ${err.message}`,
    };
  }

  // 3) We'll incorporate the revisionConfig doc. Suppose it has instructions or something
  const configJson = JSON.stringify(revisionConfig, null, 2);

  // 4) Build a GPT prompt that says: "Focus on these failed concepts. Return JSON with 'title' + 'concepts'..."
  let failedConceptsText = "No failing concepts => provide a general revision.";
  if (failedConcepts.length > 0) {
    failedConceptsText = `These concepts were failed:\n - ${failedConcepts.join("\n - ")}`;
  }

  const userPrompt = `
You are a helpful tutor. The user has a subchapter summary and some concepts they struggled with.

Subchapter Summary:
"${subchapterSummary}"

${failedConceptsText}

Revision Configuration:
${configJson}

Return valid JSON in this exact structure:
{
  "title": "Short Title",
  "concepts": [
    {
      "conceptName": "Concept A",
      "notes": ["Point 1", "Point 2"]
    },
    {
      "conceptName": "Concept B",
      "notes": ["..."]
    }
  ]
}

No extra commentary—only that JSON.
`.trim();

  // 5) Call GPT
  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "You are a helpful tutor. Return JSON only." },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 1600,
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
      revisionData: parsed,
      error: "",
    };
  } catch (err) {
    return {
      success: false,
      revisionData: null,
      error: `Error calling GPT: ${err.message}`,
    };
  }
}