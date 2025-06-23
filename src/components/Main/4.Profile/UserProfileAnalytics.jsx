import React, { useEffect, useState } from "react";
import { auth, db } from "../../../firebase";               // ← adjust path if needed
import {
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  CircularProgress,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

/**
 * UserProfileAnalytics
 * ────────────────────────────────────────────────────────────────
 * Displays a Book → Chapter → Sub‑chapter → Concept tree for the logged‑in user.
 * Optimisations:
 *   • Only 3 Firestore reads per book (chapters, sub‑chapters, concepts) — fetched in parallel.
 *   • Chapters & sub‑chapters sorted by the numeric prefix in their title (e.g., “2.3 Core Ideas”).
 *   • Concepts sorted alphabetically.
 * Pure React JSX — no TypeScript, no external deps beyond Firebase + MUI.
 */

/* ───────── helpers ───────── */
// Extract leading number (supports “12.” or “3.4”); Infinity if none → pushes unsorted items last
const numPrefix = (t = "") => {
  const m = t.trim().match(/^(\d+(?:\.\d+)?)/);
  return m ? parseFloat(m[1] || m[0]) : Infinity;
};
// Sort by numeric prefix first, then alphabetically as tiebreaker
const byNumberThenAlpha = (a, b) => {
  const na = numPrefix(a.name);
  const nb = numPrefix(b.name);
  return na === nb ? a.name.localeCompare(b.name) : na - nb;
};

const UserProfileAnalytics = () => {
  /* auth */
  const [userId, setUserId] = useState(null);

  /* data */
  const [books, setBooks] = useState([]); // [{id, name, chapters:[…]}]
  const [loading, setLoading] = useState(true);

  /* watch login state */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUserId(u ? u.uid : null);
    });
    return () => unsub();
  }, []);

  /* fetch everything whenever the user changes */
  useEffect(() => {
    if (!userId) {
      setBooks([]);
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        // 1️⃣ all the user's books
        const bookSnap = await getDocs(
          query(collection(db, "books_demo"), where("userId", "==", userId))
        );

        // 2️⃣ fetch each book in parallel
        const bookData = await Promise.all(
          bookSnap.docs.map(async (bDoc) => {
            const bookId = bDoc.id;
            const baseBook = { id: bookId, ...bDoc.data(), chapters: [] };

            // three flat queries in parallel for this book
            const [chapSnap, subSnap, conSnap] = await Promise.all([
              getDocs(query(collection(db, "chapters_demo"),      where("bookId", "==", bookId))),
              getDocs(query(collection(db, "subchapters_demo"),   where("bookId", "==", bookId))),
              getDocs(query(collection(db, "subchapterConcepts"), where("bookId", "==", bookId))),
            ]);

            // helper maps for quick look‑ups
            const subsByChapter = {}; // chapterId → [subChap]
            subSnap.docs.forEach((s) => {
              const row = { id: s.id, ...s.data(), concepts: [] };
              (subsByChapter[row.chapterId] ??= []).push(row);
            });

            const consBySub = {}; // subChapterId → [concept]
            conSnap.docs.forEach((c) => {
              const row = { id: c.id, ...c.data() };
              (consBySub[row.subChapterId] ??= []).push(row);
            });

            // stitch chapters → sub‑chapters → concepts
            const chapters = chapSnap.docs.map((c) => {
              const chap = { id: c.id, ...c.data(), subchapters: [] };

              chap.subchapters = (subsByChapter[chap.id] || [])
                .map((sub) => {
                  const concepts = (consBySub[sub.id] || []).sort((a, b) =>
                    a.name.localeCompare(b.name)
                  );
                  return { ...sub, concepts };
                })
                .sort(byNumberThenAlpha);

              return chap;
            });

            baseBook.chapters = chapters.sort(byNumberThenAlpha);
            return baseBook;
          })
        );

        setBooks(bookData);
      } catch (err) {
        console.error("UserProfileAnalytics → fetchData", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  /* ui helpers */
  const BookAccordion = ({ book }) => (
    <Accordion defaultExpanded>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography variant="h6" fontWeight={600}>
          {book.name}
        </Typography>
      </AccordionSummary>
      <AccordionDetails>
        {book.chapters.map((chap) => (
          <Accordion key={chap.id} sx={{ ml: 2 }} defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1" fontWeight={500}>
                {chap.name}
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              {chap.subchapters.map((sub) => (
                <Accordion key={sub.id} sx={{ ml: 4 }} disableGutters>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="body1">{sub.name}</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    {sub.concepts.length === 0 ? (
                      <Typography variant="body2" color="text.secondary">
                        (no concepts yet)
                      </Typography>
                    ) : (
                      <ul>
                        {sub.concepts.map((c) => (
                          <li key={c.id}>
                            <strong>{c.name}</strong>
                            {Array.isArray(c.subPoints) && c.subPoints.length > 0 && (
                              <ul>
                                {c.subPoints.map((p, i) => (
                                  <li key={i}>{p}</li>
                                ))}
                              </ul>
                            )}
                            {c.summary && <em>{" " + c.summary}</em>}
                          </li>
                        ))}
                      </ul>
                    )}
                  </AccordionDetails>
                </Accordion>
              ))}
            </AccordionDetails>
          </Accordion>
        ))}
      </AccordionDetails>
    </Accordion>
  );

  /* render */
  if (loading) return <CircularProgress sx={{ m: 4 }} />;
  if (!userId) return <Typography>No user logged in.</Typography>;
  if (books.length === 0) return <Typography>No books found.</Typography>;

  return (
    <div style={{ padding: 20 }}>
      {books.map((b) => (
        <BookAccordion key={b.id} book={b} />
      ))}
    </div>
  );
};

export default UserProfileAnalytics;
