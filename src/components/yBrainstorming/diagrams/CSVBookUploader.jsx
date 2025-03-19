import React, { useState } from "react";
import Papa from "papaparse"; // npm install papaparse
import { db } from "../../../firebase"; // adjust to your path
import { collection, addDoc, doc, setDoc, serverTimestamp } from "firebase/firestore";

// Utility to group rows by some key
function groupBy(array, keyFn) {
  const map = {};
  for (const item of array) {
    const k = keyFn(item);
    if (!map[k]) map[k] = [];
    map[k].push(item);
  }
  return map;
}

// Some helper to compute approximate word count
function getWordCount(text = "") {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function CSVBookUploader() {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("");

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = () => {
    if (!file) {
      alert("Please select a CSV file first.");
      return;
    }
    setStatus("Parsing CSV...");

    Papa.parse(file, {
      header: true, // So that Papa uses first row as column names
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const rows = results.data;
          // Example row shape:
          // {
          //   bookName: 'Book 1',
          //   userId: 'user123',
          //   chapterName: 'Introduction',
          //   subchapterName: 'Overview',
          //   summary: 'This subchapter covers the basics...'
          // }

          // 1) Group rows by (bookName, userId)
          //    So each group => 1 doc in books_demo
          const booksMap = groupBy(rows, (row) => {
            // Construct a string key
            return `${row.bookName}___${row.userId}`;
          });

          // We'll keep a record of newly created bookDocIds so that we can map them
          // key = 'BookName___userId', value = Firestore docId
          const bookIdMap = {};

          // Also we will store the chapter docs we create
          // key = `${bookId}___chapterName`, value = chapterDocId
          const chapterIdMap = {};

          setStatus("Creating books in Firestore...");

          // 2) For each unique (bookName, userId) => create one book doc
          for (const bookKey of Object.keys(booksMap)) {
            const groupRows = booksMap[bookKey];
            const sampleRow = groupRows[0]; // we'll just take the first row to read the metadata

            const theBookName = sampleRow.bookName || "Untitled Book";
            const theUserId = sampleRow.userId || "anonymous";

            // Create book doc
            const bookDocRef = await addDoc(collection(db, "books_demo"), {
              name: theBookName,
              userId: theUserId,
              createdAt: serverTimestamp(),
            });
            const newBookId = bookDocRef.id;
            bookIdMap[bookKey] = newBookId;

            // Now group by chapterName within this specific book
            // We'll group by chapterName across all rows in groupRows
            const chaptersMap = groupBy(groupRows, (r) => r.chapterName || "Untitled Chapter");

            // 3) For each chapter => create chapters_demo doc
            for (const chapterName of Object.keys(chaptersMap)) {
              // create a doc in chapters_demo
              const cDocRef = await addDoc(collection(db, "chapters_demo"), {
                bookId: newBookId,
                userId: theUserId,
                name: chapterName,
                createdAt: serverTimestamp(),
              });
              const newChapterId = cDocRef.id;

              // store this so we can link subchapters
              chapterIdMap[`${newBookId}___${chapterName}`] = newChapterId;

              // The rows that belong to this chapter
              const subchapRows = chaptersMap[chapterName];

              // 4) For each row => create subchapters_demo doc
              for (const sRow of subchapRows) {
                const sName = sRow.subchapterName || "Untitled Subchapter";
                const sSummary = sRow.summary || "";
                const wCount = getWordCount(sSummary);

                const newSubRef = await addDoc(collection(db, "subchapters_demo"), {
                  chapterId: newChapterId,
                  bookId: newBookId,
                  userId: theUserId,
                  name: sName,
                  summary: sSummary,
                  wordCount: wCount,
                  createdAt: serverTimestamp(),
                });

                // If you need the doc's own ID stored:
                await setDoc(doc(db, "subchapters_demo", newSubRef.id), {
                  subChapterId: newSubRef.id,
                }, { merge: true });
              }
            }
          }

          setStatus("CSV uploaded and Firestore docs created successfully!");
        } catch (err) {
          console.error("Error while processing CSV:", err);
          setStatus(`Error: ${err.message}`);
        }
      },
      error: (err) => {
        console.error("PapaParse Error:", err);
        setStatus(`Parsing error: ${err.message}`);
      },
    });
  };

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: "1rem" }}>
      <h2>CSV Book Uploader</h2>
      <p>
        Upload a CSV with columns: <code>bookName, userId, chapterName, subchapterName, summary</code>.
      </p>

      <input type="file" accept=".csv" onChange={handleFileChange} />
      <button onClick={handleUpload} style={{ marginLeft: "0.5rem" }}>
        Upload
      </button>

      {status && (
        <div style={{ marginTop: "1rem", whiteSpace: "pre-wrap" }}>{status}</div>
      )}
    </div>
  );
}

export default CSVBookUploader;