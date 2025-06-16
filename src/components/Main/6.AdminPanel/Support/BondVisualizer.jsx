import React, { useState, useRef, useEffect, useMemo } from 'react';
import OpenAI from 'openai';

export default function BondVisualizer() {
  const [question, setQuestion] = useState('');
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [viewerError, setViewerError] = useState(false);
  const [showPractice, setShowPractice] = useState(false);
  const containerRef = useRef(null);

  /** ----------  OPENAI ---------- */
  const openai = useMemo(
    () =>
      new OpenAI({
        apiKey:
          import.meta.env.VITE_OPENAI_KEY || process.env.REACT_APP_OPENAI_KEY,
        dangerouslyAllowBrowser: true,
      }),
    []
  );

  const systemPrompt = `
You are a chemistry assistant.
If the user text clearly refers to ONE molecule or ion, reply with RAW JSON only:
{
  "smiles":"<SMILES>",
  "common":"<common name>",
  "shape":"<VSEPR>",
  "hybrid":"<sp...>",
  "explanation":"<one sentence>"
}
If the text does NOT map to exactly one molecule, reply with:
{ "error":"NO_MAPPING" }`;

  /** ----------  3Dmol LOADER ---------- */
  async function load3Dmol() {
    if (window.$3Dmol) return true;

    const cdnUrls = [
      'https://cdn.jsdelivr.net/npm/3dmol@2.0.6/build/3Dmol-min.js',
      'https://unpkg.com/3dmol@2.0.6/build/3Dmol-min.js',
      'https://cdnjs.cloudflare.com/ajax/libs/3Dmol/2.0.6/3Dmol-min.js',
    ];

    for (const src of cdnUrls) {
      const ok = await new Promise((res) => {
        const script = document.createElement('script');
        script.src = src;
        script.async = true;
        script.onload = () => res(true);
        script.onerror = () => res(false);
        document.body.appendChild(script);
      });
      if (ok && window.$3Dmol) return true;
    }
    return false;
  }

  /** ----------  SDF FETCHER ---------- */
  async function fetchSDF(smiles) {
    const enc = encodeURIComponent(smiles);
    const urls = [
      `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/smiles/${enc}/record/SDF?record_type=3d`,
      `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/smiles/${enc}/record/SDF?record_type=2d`,
      `https://cactus.nci.nih.gov/chemical/structure/${enc}/file?format=sdf&get3d=true`,
    ];
    for (const url of urls) {
      try {
        const res = await fetch(url);
        if (res.ok) {
          const txt = await res.text();
          if (txt && txt.includes('V2000')) return txt;
        }
      } catch {
        /* ignore */
      }
    }
    return null;
  }

  /** ----------  SUBMIT ---------- */
  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setData(null);
    setViewerError(false);
    setShowPractice(false);
    if (!question.trim()) return;

    setLoading(true);
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        temperature: 0,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: question.trim() },
        ],
      });

      const raw = completion.choices[0]?.message?.content?.trim();
      let parsed;
      try {
        parsed = JSON.parse(raw);
      } catch {
        throw new Error('Bad JSON');
      }

      if (parsed?.error === 'NO_MAPPING') {
        setError("Couldn’t recognise that molecule, please rephrase.");
        return;
      }

      const sdf = await fetchSDF(parsed.smiles);
      setData({ ...parsed, sdf });
    } catch {
      setError('Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  }

  /** ----------  VIEWER ---------- */
  useEffect(() => {
    (async () => {
      if (!data) return;
      const ok = await load3Dmol();
      if (!ok) {
        setViewerError(true);
        return;
      }

      try {
        if (!containerRef.current) return;
        containerRef.current.innerHTML = '';
        const viewer = window.$3Dmol.createViewer(containerRef.current, {
          backgroundColor: 'white',
        });
        if (data.sdf) {
          viewer.addModel(data.sdf, 'sdf');
        } else {
          viewer.addModel(data.smiles, 'smi', { gen3D: true });
        }
        viewer.setStyle({}, { stick: {}, sphere: { scale: 0.28 } });
        viewer.zoomTo();
        viewer.render();
      } catch {
        setViewerError(true);
      }
    })();
  }, [data]);

  /** ----------  RENDER ---------- */
  return (
    <div className="max-w-xl mx-auto p-4">
      <form onSubmit={handleSubmit} className="mb-4">
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask a bond-angle question…"
          className="w-full border rounded px-3 py-2 mb-2"
        />
        <button
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {loading ? 'Thinking…' : 'Submit'}
        </button>
      </form>

      {error && <p className="text-red-600 mb-4">{error}</p>}

      {data && (
        <>
          <div
            ref={containerRef}
            className="border rounded h-72 mb-4 flex items-center justify-center"
          >
            {viewerError && (
              <p className="text-center">Failed to render molecule.</p>
            )}
          </div>

          <div className="mb-4 space-y-1">
            <p>
              <strong>Shape:</strong> {data.shape}
            </p>
            <p>
              <strong>Hybridisation:</strong> {data.hybrid}
            </p>
            <p>
              <strong>Why?</strong> {data.explanation}
            </p>
          </div>

          <button
            onClick={() => setShowPractice(true)}
            className="bg-green-600 text-white px-4 py-2 rounded"
          >
            Practise 3 Qs →
          </button>
        </>
      )}

      {showPractice && (
        <ul className="list-disc pl-6 mt-4 space-y-2">
          <li>
            What is the approximate bond angle in {data?.common || 'this'}
            molecule?
          </li>
          <li>
            Which hybrid orbitals are used by the central atom in{' '}
            {data?.common || 'this'}?
          </li>
          <li>
            How do lone-pair–bond-pair repulsions influence the shape of{' '}
            {data?.common || 'this'}?
          </li>
        </ul>
      )}
    </div>
  );
}