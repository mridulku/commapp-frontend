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
  Box,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

/**
 * UserProfileAnalytics (subject → grouping → chapter → sub-chapter → concept)
 * ────────────────────────────────────────────────────────────────
 * • 3 parallel queries per book (chapters, sub-chapters, concepts)
 * • Hides any node whose descendants contain zero concepts
 * • Sorting order:
 *      - Subject (alphabetical)
 *      - Grouping (alphabetical)
 *      - Chapter   (numeric prefix, then alpha)
 *      - Sub‑chapter (numeric prefix, then alpha)
 *      - Concept   (alphabetical)
 * Pure JSX — drop straight into a Vite/CRA project.
 */

/* ───────── helpers ───────── */
const numPrefix = (t = "") => {
  const m = t.trim().match(/^(\d+(?:\.\d+)?)/);
  return m ? parseFloat(m[1] || m[0]) : Infinity;
};
const byNumberThenAlpha = (a, b) => {
  const na = numPrefix(a.name);
  const nb = numPrefix(b.name);
  return na === nb ? a.name.localeCompare(b.name) : na - nb;
};
const byAlpha = (a, b) => a.name.localeCompare(b.name);

const UserProfileAnalytics = () => {
  /* auth */
  const [userId, setUserId] = useState(null);

  /* data */
  const [books, setBooks] = useState([]); // [{id, name, subjects:[…]}]
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
            const baseBook = { id: bookId, ...bDoc.data(), subjects: [] };

            // three flat queries in parallel for this book
            const [chapSnap, subSnap, conSnap] = await Promise.all([
              getDocs(query(collection(db, "chapters_demo"),      where("bookId", "==", bookId))),
              getDocs(query(collection(db, "subchapters_demo"),   where("bookId", "==", bookId))),
              getDocs(query(collection(db, "subchapterConcepts"), where("bookId", "==", bookId))),
            ]);

            // helper maps
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

            // Build chapters with filtered sub‑chapters & concepts
            const chapterObjs = chapSnap.docs
              .map((c) => {
                const chap = { id: c.id, ...c.data(), subchapters: [] };
                chap.subchapters = (subsByChapter[chap.id] || [])
                  .map((sub) => {
                    const concepts = (consBySub[sub.id] || [])
                      .sort((a, b) => a.name.localeCompare(b.name));
                    return { ...sub, concepts };
                  })
                  .filter((sub) => sub.concepts.length > 0) // hide empty sub‑chapters
                  .sort(byNumberThenAlpha);
                return chap;
              })
              .filter((chap) => chap.subchapters.length > 0) // hide empty chapters
              .sort(byNumberThenAlpha);

            // Group by subject → grouping
            const subjectMap = {}; // subject → groupingMap
            chapterObjs.forEach((chap) => {
              const subject = chap.subject || "Uncategorised";
              const grouping = chap.grouping || "Other";
              if (!subjectMap[subject]) subjectMap[subject] = {};
              if (!subjectMap[subject][grouping]) subjectMap[subject][grouping] = [];
              subjectMap[subject][grouping].push(chap);
            });

            // Collapse to array structure with sorting & filtering empty groups/subjects
            const subjectsArr = Object.entries(subjectMap)
              .map(([subjectName, groupingObj]) => {
                const groupingsArr = Object.entries(groupingObj)
                  .map(([groupName, chaps]) => ({
                    id: `${subjectName}|${groupName}`,
                    name: groupName,
                    chapters: chaps,
                  }))
                  .filter((g) => g.chapters.length > 0) // should always be true, but safe
                  .sort(byAlpha);

                return {
                  id: subjectName,
                  name: subjectName,
                  groupings: groupingsArr,
                };
              })
              .filter((s) => s.groupings.length > 0)
              .sort(byAlpha);

            baseBook.subjects = subjectsArr;
            return baseBook;
          })
        );

        // Optionally drop books with no content
        const filteredBooks = bookData.filter((bk) => bk.subjects.length > 0);
        setBooks(filteredBooks);
      } catch (err) {
        console.error("UserProfileAnalytics → fetchData", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  /* ui helpers */
  const ConceptList = ({ concepts }) => (
    <ul>
      {concepts.map((c) => (
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
  );

  const SubChapterAccordion = ({ sub }) => (
    <Accordion key={sub.id} sx={{ ml: 6 }} disableGutters>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography variant="body1">{sub.name}</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <ConceptList concepts={sub.concepts} />
      </AccordionDetails>
    </Accordion>
  );

  const ChapterAccordion = ({ chap }) => (
    <Accordion key={chap.id} sx={{ ml: 4 }} defaultExpanded>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography variant="subtitle1" fontWeight={500}>
          {chap.name}
        </Typography>
      </AccordionSummary>
      <AccordionDetails>
        {chap.subchapters.map((sub) => (
          <SubChapterAccordion key={sub.id} sub={sub} />
        ))}
      </AccordionDetails>
    </Accordion>
  );

  const GroupingAccordion = ({ grp }) => (
    <Accordion key={grp.id} sx={{ ml: 2 }} defaultExpanded>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography variant="h6" fontWeight={600}>
          {grp.name}
        </Typography>
      </AccordionSummary>
      <AccordionDetails>
        {grp.chapters.map((chap) => (
          <ChapterAccordion key={chap.id} chap={chap} />
        ))}
      </AccordionDetails>
    </Accordion>
  );

  const SubjectAccordion = ({ subj }) => (
    <Accordion key={subj.id} defaultExpanded>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography variant="h5" fontWeight={700}>
          {subj.name}
        </Typography>
      </AccordionSummary>
      <AccordionDetails>
        {subj.groupings.map((grp) => (
          <GroupingAccordion key={grp.id} grp={grp} />
        ))}
      </AccordionDetails>
    </Accordion>
  );

  const BookSection = ({ book }) => (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        {book.name}
      </Typography>
      {book.subjects.map((subj) => (
        <SubjectAccordion key={subj.id} subj={subj} />
      ))}
    </Box>
  );

  /* render */
  if (loading) return <CircularProgress sx={{ m: 4 }} />;
  if (!userId) return <Typography>No user logged in.</Typography>;
  if (books.length === 0) return <Typography>No data found.</Typography>;

  return (
    <div style={{ padding: 20 }}>
      {books.map((b) => (
        <BookSection key={b.id} book={b} />
      ))}
    </div>
  );
};

export default UserProfileAnalytics;
