/*  DoubtChat.jsx
 *  Drop inside src/components and import where needed.
 *  Requires Tailwind or basic CSS (you can replace the class names).
 */

import React, { useState } from "react";

// --- dummy concept-detector (replace with real API call) ---
const detectConcept = async (question) => {
  // simulate network latency
  await new Promise((r) => setTimeout(r, 600));

  return {
    name: "Limiting Reagent (Stoichiometry)",
    weight: "High",
    bloom: "Apply",
    past: ["NEET 2022 Q-51", "Allen Mock Set 8"],
  };
};

export default function DoubtChat() {
  const [msgs, setMsgs] = useState([]); // { from: "user" | "bot", text: string }
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [concept, setConcept] = useState(null);

  const send = async () => {
    if (!input.trim()) return;
    const question = input.trim();
    setMsgs((m) => [...m, { from: "user", text: question }]);
    setInput("");
    setThinking(true);

    const c = await detectConcept(question);

    setConcept(c);
    setMsgs((m) => [
      ...m,
      {
        from: "bot",
        text: `Looks like a question on ${c.name}. Want to practise it now?`,
      },
    ]);
    setThinking(false);
  };

  return (
    <div className="w-full max-w-md mx-auto h-[80vh] flex flex-col rounded-xl border shadow bg-white">
      {/* header */}
      <header className="p-4 border-b bg-gray-50 font-bold text-lg flex gap-2 items-center">
        <span role="img" aria-label="sparkles">
          ✨
        </span>
        Doubt Chat
      </header>

      {/* chat stream */}
      <div className="flex-1 p-4 space-y-3 overflow-y-auto">
        {msgs.map((m, i) => (
          <div
            key={i}
            className={`max-w-[80%] rounded-lg px-3 py-2 text-sm shadow
              ${m.from === "user" ? "ml-auto bg-blue-600 text-white" : "bg-gray-100"}
            `}
          >
            {m.text}
          </div>
        ))}

        {thinking && (
          <div className="text-xs italic text-gray-400">thinking…</div>
        )}

        {concept && (
          <div className="border-l-4 border-teal-500 bg-teal-50 p-3 rounded-md text-sm text-gray-800 space-y-1">
            <p className="font-semibold">Weak Concept Detected</p>
            <p>Concept: {concept.name}</p>
            <p>Weight: {concept.weight}</p>
            <p>Bloom Level: {concept.bloom}</p>
            <p>Seen in:</p>
            <ul className="list-disc pl-5">
              {concept.past.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>

            <div className="pt-2 flex gap-2">
              <button className="px-3 py-1 bg-blue-600 text-white rounded text-xs">
                Practise 3 Qs →
              </button>
              <button className="px-3 py-1 bg-transparent border text-xs rounded">
                Skip
              </button>
            </div>
          </div>
        )}
      </div>

      {/* input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        className="p-3 border-t bg-gray-50 flex gap-2"
      >
        <input
          type="text"
          placeholder="Type your doubt…"
          className="flex-1 border rounded px-3 py-2 text-sm"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button
          type="submit"
          disabled={thinking || !input.trim()}
          className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
}