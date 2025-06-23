// src/hooks/useConceptGraph.js
import { useEffect, useState } from "react";
import {
  collection, getDocs, query, where
} from "firebase/firestore";
import { db } from "../../../firebase";

/* util: numeric-prefix sort (same as before) */
const numPrefix = (t = "") => {
  const m = t.trim().match(/^(\d+(?:\.\d+)?)/);
  return m ? parseFloat(m[1] ?? m[0]) : Infinity;
};
const byNumberThenAlpha = (a, b) => {
  const na = numPrefix(a.name);
  const nb = numPrefix(b.name);
  return na === nb ? a.name.localeCompare(b.name) : na - nb;
};

/* helper: split an array into chunks of ≤ N */
const chunk = (arr, size = 10) =>
  Array.from({ length: Math.ceil(arr.length / size) },
             (_, i) => arr.slice(i * size, i * size + size));

export default function useConceptGraph() {
  const [concepts, setConcepts] = useState([]);
  const [loading , setLoading ] = useState(true);
  const [error   , setError   ] = useState(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        /* 1️⃣  grab ALL books */
        const bookSnap = await getDocs(collection(db, "books_demo"));
        const bookIds  = bookSnap.docs.map(d => d.id);

        if (bookIds.length === 0) {
          setConcepts([]);
          setLoading(false);
          return;
        }

        /* 2️⃣  for each ≤10-id chunk, pull chapters / sub-chapters / concepts */
        let chapterDocs = [];
        let subChapDocs = [];
        let conceptDocs = [];

        for (const ids of chunk(bookIds)) {
          const [chapSnap, subSnap, conSnap] = await Promise.all([
            getDocs(query(
              collection(db, "chapters_demo"),
              where("bookId", "in", ids)
            )),
            getDocs(query(
              collection(db, "subchapters_demo"),
              where("bookId", "in", ids)
            )),
            getDocs(query(
              collection(db, "subchapterConcepts"),
              where("bookId", "in", ids)
            )),
          ]);
          chapterDocs.push(...chapSnap.docs);
          subChapDocs.push(...subSnap.docs);
          conceptDocs.push(...conSnap.docs);
        }

        /* 3️⃣  build helper maps */
        const subsByChap = {};   // chapterId → [subChap]
        subChapDocs.forEach(s => {
          const row = { id: s.id, ...s.data() };
          (subsByChap[row.chapterId] ??= []).push(row);
        });

        const consBySub = {};    // subChapterId → [concept]
        conceptDocs.forEach(c => {
          const row = { id: c.id, ...c.data() };
          (consBySub[row.subChapterId] ??= []).push(row);
        });

        /* 4️⃣  walk chapters → sub-chapters → concepts */
        const flat = [];
        chapterDocs.forEach(c => {
          const chap = { id: c.id, ...c.data() };
          (subsByChap[chap.id] || []).forEach(sub => {
            (consBySub[sub.id] || []).forEach(con => {
              flat.push({
                id        : con.id,
                name      : con.name,
                subject   : chap.subject   ?? "Uncategorised",
                grouping  : chap.grouping  ?? "Other",
                chapter   : chap.name,
                subChap   : sub.name,
                book      : chap.bookName  ?? "NCERT",
                summary   : con.summary   ?? "",
                subPoints : con.subPoints ?? [],
              });
            });
          });
        });

        /* 5️⃣  deterministic chip ordering (unchanged) */
        flat.sort((a, b) => {
          const s = a.subject .localeCompare(b.subject );
          if (s !== 0) return s;
          const g = a.grouping.localeCompare(b.grouping);
          if (g !== 0) return g;
          const c = byNumberThenAlpha({ name: a.chapter }, { name: b.chapter });
          if (c !== 0) return c;
          return byNumberThenAlpha({ name: a.subChap }, { name: b.subChap });
        });

        setConcepts(flat);
      } catch (e) {
        console.error("useConceptGraph", e);
        setError(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return { concepts, loading, error };
}
