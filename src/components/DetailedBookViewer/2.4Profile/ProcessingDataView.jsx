// src/components/ProcessingDataView.jsx

import React, { useState, useEffect } from 'react';

export default function ProcessingDataView({
  userId,
  backendURL = import.meta.env.VITE_BACKEND_URL,
}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!userId) return;

    setLoading(true);
    const url = `${backendURL}/api/processing-data?userId=${encodeURIComponent(
      userId
    )}`;

    fetch(url)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then((json) => {
        if (json.error) {
          setError(json.error);
          setData(null);
        } else {
          setData(json);
          setError('');
        }
      })
      .catch((err) => {
        setError('Failed to fetch processing data.');
        console.error(err);
      })
      .finally(() => setLoading(false));
  }, [userId, backendURL]);

  if (!userId) {
    return <p>Please provide a userId</p>;
  }
  if (loading) {
    return <p>Loading processing data...</p>;
  }
  if (error) {
    return <p style={{ color: 'red' }}>Error: {error}</p>;
  }
  if (!data || !data.books) {
    return <p>No data yet.</p>;
  }

  return (
    <div style={{ margin: '1rem' }}>
      <h2>Decomposition Overview for User: {data.userId}</h2>
      {data.books.length === 0 ? (
        <p>No books found for this user.</p>
      ) : (
        data.books.map((book) => (
          <BookPipelineView key={book.id} book={book} />
        ))
      )}
    </div>
  );
}

/**
 * BookPipelineView
 * Renders each book’s pipeline info:
 *  - Basic book metadata
 *  - PDF Extract(s) with # pages
 *  - Chapters (expand/collapse)
 */
function BookPipelineView({ book }) {
  return (
    <div
      style={{
        border: '1px solid #ccc',
        margin: '1rem',
        padding: '1rem',
      }}
    >
      <h3>
        Book: {book.name} (ID: {book.id})
      </h3>
      <p>
        Created At:{' '}
        {book.createdAt && book.createdAt._seconds
          ? new Date(book.createdAt._seconds * 1000).toString()
          : 'N/A'}
      </p>

      <div style={{ marginTop: '0.5rem' }}>
        <h4>PDF Extracts</h4>
        {book.pdfExtracts && book.pdfExtracts.length > 0 ? (
          book.pdfExtracts.map((ext) => (
            <div key={ext.id} style={{ marginLeft: '1rem' }}>
              <p>Extract ID: {ext.id}</p>
              <p>File Path: {ext.filePath}</p>
              <p>Page Count: {ext.pagesCount}</p>
            </div>
          ))
        ) : (
          <p style={{ marginLeft: '1rem' }}>No PDF extracts found.</p>
        )}
      </div>

      <div style={{ marginTop: '0.5rem' }}>
        <h4>Chapters</h4>
        {book.chapters && book.chapters.length > 0 ? (
          book.chapters.map((ch) => <ChapterItem key={ch.id} chapter={ch} />)
        ) : (
          <p style={{ marginLeft: '1rem' }}>No chapters found.</p>
        )}
      </div>
    </div>
  );
}

/**
 * ChapterItem
 * Renders each chapter with an expand/collapse for subchapters
 */
function ChapterItem({ chapter }) {
  const [expanded, setExpanded] = useState(false);

  const toggleExpand = () => setExpanded((prev) => !prev);

  return (
    <div style={{ marginLeft: '1rem', padding: '0.5rem 0' }}>
      <div
        style={{ cursor: 'pointer', color: '#007bff' }}
        onClick={toggleExpand}
      >
        <strong>
          {expanded ? '▼ ' : '▶ '}
          {chapter.name || '(No Name)'}
        </strong>{' '}
        (Chapter ID: {chapter.id})
      </div>
      {expanded && (
        <div style={{ marginLeft: '1.5rem' }}>
          {chapter.subchapters && chapter.subchapters.length > 0 ? (
            chapter.subchapters.map((sub) => (
              <SubChapterItem key={sub.id} subchapter={sub} />
            ))
          ) : (
            <p>No subchapters found.</p>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * SubChapterItem
 * Renders subchapter name and optionally an expand to show summary
 */
function SubChapterItem({ subchapter }) {
  const [showSummary, setShowSummary] = useState(false);

  return (
    <div style={{ marginBottom: '0.5rem' }}>
      <div
        style={{ cursor: 'pointer', color: '#28a745' }}
        onClick={() => setShowSummary((prev) => !prev)}
      >
        {showSummary ? '▼ ' : '▶ '}
        <strong>
          {subchapter.name || '(No Subchapter Name)'}
        </strong>
      </div>
      {showSummary && subchapter.summary && (
        <div style={{ marginLeft: '1.5rem', whiteSpace: 'pre-wrap' }}>
          <p style={{ fontStyle: 'italic' }}>
            {subchapter.summary || '(No Summary)'}
          </p>
        </div>
      )}
    </div>
  );
}