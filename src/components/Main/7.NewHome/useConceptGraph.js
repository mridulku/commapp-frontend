// src/hooks/useConceptGraph.js
import { useEffect, useState } from "react";
import {
  collection, getDocs, query,
} from "firebase/firestore";
import { db } from "../../../firebase";

/* util: numeric-prefix sort (same as in UserProfileAnalytics) */
const numPrefix = (t="") => {
  const m = t.trim().match(/^(\d+(?:\.\d+)?)/);
  return m ? parseFloat(m[1] ?? m[0]) : Infinity;
};
const byNumberThenAlpha = (a,b) => {
  const na = numPrefix(a.name); const nb = numPrefix(b.name);
  return na === nb ? a.name.localeCompare(b.name) : na - nb;
};

export default function useConceptGraph() {
  const [concepts, setConcepts]   = useState([]);
  const [loading , setLoading ]   = useState(true);
  const [error   , setError   ]   = useState(null);

  useEffect(() => {
    (async () => {
      try {
        /* flat pulls – no per-user filter this time */
        const [chapSnap, subSnap, conSnap] = await Promise.all([
          getDocs(collection(db,"chapters_demo")),
          getDocs(collection(db,"subchapters_demo")),
          getDocs(collection(db,"subchapterConcepts")),
        ]);

        /* build helper maps */
        const subsByChap = {};
        subSnap.docs.forEach(s=>{
          const row = { id:s.id, ...s.data() };
          (subsByChap[row.chapterId] ??= []).push(row);
        });

        const consBySub = {};
        conSnap.docs.forEach(c=>{
          const row = { id:c.id, ...c.data() };
          (consBySub[row.subChapterId] ??= []).push(row);
        });

        /* walk chapters → sub-chapters → concepts */
        const flat = [];
        chapSnap.docs.forEach(c=>{
          const chap = { id:c.id, ...c.data() };
          (subsByChap[chap.id] || []).forEach(sub=>{
            (consBySub[sub.id] || []).forEach(con=>{
              /* one record per concept – add the breadcrumb fields */
              flat.push({
                id       : con.id,
                name     : con.name,
                subject  : chap.subject   ?? "Uncategorised",
                grouping : chap.grouping  ?? "Other",
                chapter  : chap.name,
                subChap  : sub.name,
                book     : chap.bookName  ?? "NCERT",
                summary   : con.summary   ?? "",   // ← new
                subPoints : con.subPoints ?? [],   // ← new
              });
            });
          });
        });

        /* sort for deterministic chip order */
        flat.sort((a,b)=>{
          const s = a.subject.localeCompare(b.subject);
          if (s!==0) return s;
          const g = a.grouping.localeCompare(b.grouping);
          if (g!==0) return g;
          const c = byNumberThenAlpha({name:a.chapter},{name:b.chapter});
          if (c!==0) return c;
          return byNumberThenAlpha({name:a.subChap},{name:b.subChap});
        });

        setConcepts(flat);
      } catch (e) {
        console.error("useConceptGraph",e);
        setError(e);
      } finally {
        setLoading(false);
      }
    })();
  },[]);

  return { concepts, loading, error };
}
