/* A tiny hook that:
 *  – listens for the user’s plan-IDs           (same query you already had)
 *  – builds a metaMap (identical to PlanSelector’s createMeta fallback)
 *  – exposes { planIds, metaMap, selected, setSelected, loading }
 */
import { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "../../../../firebase";

/* ---- colour / emoji pools copied verbatim from PlanSelector ---- */
const ACCENTS  = ["#BB86FC", "#F48FB1", "#80DEEA", "#AED581", "#FFB74D"];
const SUBJECTS = [
  "Physics", "Chemistry", "Biology", "Maths", "English", "Reasoning",
  "Reading", "Listening", "Speaking", "Writing",
];
const LEVELS = ["Mastery", "Revision", "Glance"];
const EMOJIS = ["📘", "📙", "📗", "📕", "📒"];

const pick        = (arr, i) => arr[i % arr.length];
const seededRand  = (s) => { const x = Math.sin(s) * 1e4; return x - Math.floor(x); };
const hashCode    = (str) => { let h = 0; for (let i = 0; i < str.length; i++) { h = (h << 5) - h + str.charCodeAt(i); h |= 0; } return h; };

/* fallback card-meta identical to old createMeta */
function fakeMeta(pid) {
  const seed = Math.abs(hashCode(pid));
  const main = SUBJECTS[seed % SUBJECTS.length];
  return {
    name      : `${main} ${LEVELS[(seed >> 3) % LEVELS.length]} Plan`,
    dailyMin  : 15 + Math.floor(seededRand(seed + 42) * 10) * 5,
    emoji     : pick(EMOJIS, seed),
    accent    : pick(ACCENTS, seed),
    groupings : [],
    subjects  : [],          // prevent “[object Object]” from placeholder
  };
}

/* ---- util: pull a sensible string out of anything ---- */
function subjectText(raw) {
  if (typeof raw === "string") return raw;

  if (raw && typeof raw === "object") {
    // common field names first …
    const direct =
      raw.title ||
      raw.name  ||
      raw.subject ||
      raw.subjectName ||
      raw.label;
    if (typeof direct === "string" && direct.trim()) return direct.trim();

    // …otherwise take the first stringy value in the object
    const any = Object.values(raw).find(
      (v) => typeof v === "string" && v.trim()
    );
    if (any) return any.trim();
  }

  // final fallback – at least this won’t be “[object Object]”
  return JSON.stringify(raw);
}

export default function usePlans({ userId, bookId }) {
  const [planIds,   setPlanIds]   = useState([]);
  const [metaMap,   setMetaMap]   = useState({});
  const [selected,  setSelected]  = useState("");
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    if (!userId || !bookId) return;

    const q = query(
      collection(db, "adaptive_demo"),
      where("userId", "==", userId),
      where("bookId", "==", bookId),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(
      q,
      async (snap) => {
        const ids = snap.docs.map((d) => d.id);
        setPlanIds(ids);
        setSelected((cur) => (cur && ids.includes(cur) ? cur : ids[0] || ""));
        /* ---------- build metaMap (use cached refs to avoid refetch loop) ---------- */
        const m = {};

        await Promise.all(
          ids.map(async (pid) => {
            m[pid] = fakeMeta(pid); // placeholder first

            try {
              const docSnap = await getDoc(doc(db, "adaptive_demo", pid));
              if (!docSnap.exists()) return;

              const plan = docSnap.data() || {};

              if (plan.planName)              m[pid].name     = plan.planName;
              if (plan.dailyReadingTimeUsed)  m[pid].dailyMin = plan.dailyReadingTimeUsed;

              /* ---- subjects always normalised to plain strings ---- */
              if (plan.subjects?.length) {
                m[pid].subjects = plan.subjects.map(subjectText);
              }

              const g = Array.from(
                new Set(
                  (plan.subjects || []).flatMap((s) =>
                    (s.groupings || s.grouping || [])
                  )
                )
              );
              m[pid].groupings = g;
            } catch (e) {
              console.warn("meta fetch", pid, e);
            }
          })
        );

        setMetaMap(m);
        setLoading(false);
      },
      (e) => {
        console.error(e);
        setPlanIds([]);
        setSelected("");
        setLoading(false);
      }
    );

    return () => unsub();
  }, [userId, bookId]);

  return { planIds, metaMap, selected, setSelected, loading };
}