// src/components/BookExplorer.jsx
import React, { useEffect, useState, useCallback } from "react";
import {
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "../../../firebase";          // 👈 adjust if your path differs

/** ----------  tiny helpers  ---------- **/

// Pull the leading “7.” or “3.2.”  →  7  /  3.2  (for proper sorting)
const numericPrefix = (name = "") => {
  const m = name.match(/^\s*([\d.]+)/);      // digits + optional dots
  return m ? parseFloat(m[1]) : Infinity;    // un-numbered items sink to bottom
};
const byPrefix = (a, b) => numericPrefix(a.name) - numericPrefix(b.name);

/**
 * processHtmlSummary
 * Cleans the raw summary the same way ReadingView does
 * but returns ONE combined HTML string (no paging needed here).
 */
function processHtmlSummary(htmlString = "") {
  let sanitized = htmlString.replace(/\\n/g, "\n").replace(/\r?\n/g, " ");
  const paragraphs = sanitized
    .split(/<\/p>/i)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => p + "</p>");
  return paragraphs.join("");
}

/** ----------  The component  ---------- **/

export default function BookExplorer({ userId }) {
  const [books, setBooks] = useState([]);
  const [selectedBookId, setSelectedBookId] = useState("");
  const [chapters, setChapters] = useState([]);
  const [subchapters, setSubchapters] = useState([]);
  const [concepts, setConcepts] = useState({});
  const [loading, setLoading] = useState(false);

  /* 1️⃣  fetch all books that belong to the user */
  useEffect(() => {
    if (!userId) return;
    (async () => {
      const q = query(
        collection(db, "books_demo"),
        where("userId", "==", userId)
      );
      const snap = await getDocs(q);
      const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      rows.sort(byPrefix);
      setBooks(rows);
      if (rows.length && !selectedBookId) setSelectedBookId(rows[0].id);
    })();
  }, [userId]);

  /* 2️⃣  when book changes → load chapters + subchapters + concepts  */
  const loadBook = useCallback(async (bookId) => {
    setLoading(true);

    // ---- CHAPTERS
    const chapQ = query(
      collection(db, "chapters_demo"),
      where("bookId", "==", bookId)
    );
    const chapSnap = await getDocs(chapQ);
    const chapRows = chapSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    chapRows.sort(byPrefix);

    // ---- SUB-CHAPTERS
    const subQ = query(
      collection(db, "subchapters_demo"),
      where("bookId", "==", bookId)
    );
    const subSnap = await getDocs(subQ);
    const subRows = subSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    subRows.sort(byPrefix);

    // ---- CONCEPTS
    const conQ = query(
      collection(db, "subchapterConcepts"),
      where("bookId", "==", bookId)
    );
    const conSnap = await getDocs(conQ);
    const conceptDict = {};
    conSnap.docs.forEach((d) => {
      const rec = { id: d.id, ...d.data() };
      if (!conceptDict[rec.subChapterId]) conceptDict[rec.subChapterId] = [];
      conceptDict[rec.subChapterId].push(rec);
    });

    setChapters(chapRows);
    setSubchapters(subRows);
    setConcepts(conceptDict);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (selectedBookId) loadBook(selectedBookId);
  }, [selectedBookId, loadBook]);

  /* ---------- RENDER ---------- */

  if (!userId) return <p>Please supply a userId prop.</p>;

  return (
    <div style={{ padding: "1rem", fontFamily: "sans-serif" }}>
      <h2>📚 Book Explorer (admin)</h2>

      {/* Book selector */}
      <label>
        Select book&nbsp;
        <select
          value={selectedBookId}
          onChange={(e) => setSelectedBookId(e.target.value)}
        >
          {books.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      </label>

      {loading && <p>Loading…</p>}

      {/* Chapter tree */}
      {!loading &&
        chapters.map((chap) => (
          <details key={chap.id} style={{ marginTop: "1rem" }}>
            <summary style={{ fontWeight: 700 }}>{chap.name}</summary>

            {/* ---- sub-chapters inside this chapter ---- */}
            {subchapters
              .filter((s) => s.chapterId === chap.id)
              .map((sub) => (
                <details
                  key={sub.id}
                  style={{ marginLeft: "1rem", marginTop: "0.5rem" }}
                >
                  <summary style={{ fontWeight: 600 }}>{sub.name}</summary>

                  {/* ---------- Raw  +  Processed Summary ---------- */}
                  <details style={{ marginLeft: "1rem", marginTop: "0.4rem" }}>
                    <summary style={{ fontWeight: 500 }}>🔧 Raw summary</summary>
                    <pre
                      style={{
                        marginLeft: "1rem",
                        whiteSpace: "pre-wrap",
                        fontFamily: "monospace",
                      }}
                    >
                      {sub.summary}
                    </pre>
                  </details>

                  <details
                    open
                    style={{ marginLeft: "1rem", marginTop: "0.4rem" }}
                  >
                    <summary style={{ fontWeight: 500 }}>✨ Processed summary</summary>
                    <div
                      style={{ marginLeft: "1rem" }}
                      dangerouslySetInnerHTML={{
                        __html: processHtmlSummary(sub.summary),
                      }}
                    />
                  </details>

                  {/* ---------- concepts ---------- */}
                  {(concepts[sub.id] || []).map((c) => (
                    <details
                      key={c.id}
                      style={{ marginLeft: "2rem", marginTop: "0.25rem" }}
                    >
                      <summary style={{ fontWeight: 500 }}>🧩 {c.name}</summary>

                      {/* concept raw/processed sections */}
                      <details style={{ marginLeft: "1rem", marginTop: "0.4rem" }}>
                        <summary style={{ fontWeight: 500 }}>🔧 Raw summary</summary>
                        <pre
                          style={{
                            marginLeft: "1rem",
                            whiteSpace: "pre-wrap",
                            fontFamily: "monospace",
                          }}
                        >
                          {c.summary}
                        </pre>
                      </details>

                      <details
                        open
                        style={{ marginLeft: "1rem", marginTop: "0.4rem" }}
                      >
                        <summary style={{ fontWeight: 500 }}>
                          ✨ Processed summary
                        </summary>
                        <div
                          style={{ marginLeft: "1rem" }}
                          dangerouslySetInnerHTML={{
                            __html: processHtmlSummary(c.summary),
                          }}
                        />
                      </details>

                      {/* sub-points, if any */}
                      {Array.isArray(c.subPoints) && c.subPoints.length > 0 && (
                        <ul style={{ marginLeft: "2rem" }}>
                          {c.subPoints.map((pt, idx) => (
                            <li key={idx}>{pt}</li>
                          ))}
                        </ul>
                      )}
                    </details>
                  ))}
                </details>
              ))}
          </details>
        ))}
    </div>
  );
}