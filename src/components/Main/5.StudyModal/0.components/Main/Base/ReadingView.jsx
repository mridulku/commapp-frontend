 import React, {
   useEffect,
   useState,
   useRef,
   createContext,
   useContext,
 } from "react";import { useSelector, useDispatch } from "react-redux";
import axios from "axios";

import Loader from "./Loader";

import { db } from "../../../../../../firebase"; // Adjust path if needed
 
import { Fade } from "@mui/material";          // <-- already in bundle? add if not


import CheckCircleIcon from "@mui/icons-material/CheckCircle";

 import AccessTimeIcon from "@mui/icons-material/AccessTimeRounded";

 // 👇 helpers copied verbatim from QuizView
 function formatBand(sec) {
   if (sec < 60)      return "< 1 min";
   if (sec < 120)     return "< 2 min";
   if (sec < 180)     return "< 3 min";
   if (sec < 300)     return "< 5 min";
   return `${Math.floor(sec / 60)} min`;
 }

 const pillSx = {
   bgcolor : "#333",
   color   : "#fff",
   fontSize: 13,
   px      : 1,
   py      : 0.5,
   borderRadius: 1,
   display : "inline-flex",
   alignItems: "center",
   gap     : .5
 };

import {
  Box,
  Button,
  Tabs,
  Tab,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  CircularProgress,
  Typography
} from "@mui/material";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import SmartToyIcon from "@mui/icons-material/SmartToy";

import AskAIChat from "./AskAIChat";               // <-- keep the same import path
import { gptRewrite } from "./gptRewrite";         // <-- keep the same import path


import { fetchReadingTime, incrementReadingTime } from "../../../../../../store/readingSlice";
import { fetchPlan, setCurrentIndex }            from "../../../../../../store/planSlice";
import { refreshSubchapter }                     from "../../../../../../store/aggregatorSlice";  // ⬅️ add this



// ─── shared context: holds the seconds we want to display ───
 // ─── shared context: holds the live-seconds we want to show in the clock ───
 export const DisplayTimeCtx = createContext(0);
// -------------- persistent rewrite-cache --------------
import { doc, getDoc, setDoc, serverTimestamp  } from "firebase/firestore";   // ⬅︎ already used elsewhere in the repo

const RW_CACHE_COLL = "readingRewriteCache";

function buildRewriteCacheId(userId, planId, subChapterId, style) {
  // no date-stamp here → the same request will always get the same doc
  return `${userId}_${planId}_${subChapterId}_${style}`;
}

/* ───────────────────────────────────────────
   ClockPill – live timer that blinks once/s
   • relies on `displayedTime` already computed
   • uses the same AccessTimeIcon + pulsing scale
──────────────────────────────────────────── */
function ClockPill() {
  const seconds = useContext(DisplayTimeCtx);       // ← read from context
  const pulsing = seconds % 2 === 1;                // blink every odd second

  return (
    <Chip
      icon={
        <AccessTimeIcon
          sx={{
            fontSize : 16,
            transform: pulsing ? "scale(1.25)" : "scale(1)",
            transition:"transform 250ms ease-out",
          }}
        />
      }
      label={formatBand(seconds)}                   // "< 1 min", "8 min", …
      size="small"
      sx={{
        bgcolor: "#263238",                         // same pill colours as QuizView
        color  : "#e0f2f1",
        fontSize: 13,
        "& .MuiChip-icon": { ml: -0.4 },
        border: "none",
      }}
    />
  );
}



/* ---------------- rewrite styles ---------------- */
const STYLES = [
  { key: "original", label: "Original" },
  { key: "concise",  label: "Concise" },
  { key: "bullets",  label: "Bullet-points" },
  { key: "story",    label: "Story form" },
];

const RewriteOverlay = ({ text = "Transforming text…" }) => (
  <Fade in>
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: "rgba(0,0,0,.70)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 40
      }}
    >
      <CircularProgress size={48} sx={{ color: "#FFD700" }} />
      <span style={{ marginTop: 12, color: "#eee" }}>{text}</span>
    </div>
  </Fade>
);

/* ---------------- local fallback when GPT is offline ---------------- */
const mockRewrite = (html, style) => {
  if (style === "concise") {
    return `<p><em>(concise)</em> ${html.replace(/<\/p><p>/g, " ")}</p>`;
  }
  if (style === "bullets") {
    const txt = html.replace(/<[^>]+>/g, "");
    return `<ul>${txt
      .split(". ")
      .filter(Boolean)
      .map((t) => `<li>${t.trim()}</li>`)
      .join("")}</ul>`;
  }
  if (style === "story") {
    return `<p><strong>🧙‍♂️ Story:</strong><br/>${html}</p>`;
  }
  return html;
};

/* ---------------- chunk helper (from legacy) ---------------- */
function chunkHtmlByParagraphs(htmlString, chunkSize = 180) {
  let sanitized = htmlString.replace(/\\n/g, "\n");
  sanitized = sanitized.replace(/\r?\n/g, " ");

  let paragraphs = sanitized
    .split(/<\/p>/i)
    .map((p) => p.trim())
    .filter((p) => p.length > 0)
    .map((p) => p + "</p>");

  const pages = [];
  let currentPageHtml = "";
  let currentPageWordCount = 0;

  paragraphs.forEach((paragraph) => {
    const plainText = paragraph.replace(/<[^>]+>/g, "");
    const wordCount = plainText.split(/\s+/).filter(Boolean).length;
    if (currentPageWordCount + wordCount <= chunkSize) {
      currentPageHtml += paragraph;
      currentPageWordCount += wordCount;
    } else {
      if (currentPageHtml.trim().length > 0) {
        pages.push(currentPageHtml);
      }
      currentPageHtml = paragraph;
      currentPageWordCount = wordCount;
    }
  });

  if (currentPageHtml.trim().length > 0) {
    pages.push(currentPageHtml);
  }

  return pages;
}

/* ---------- who can see debug / time-details ---------- */
const ADMIN_UIDS = [
  "acbhbtiODoPPcks2CP6Z",   // ← add real admin UIDs here
];

/* ---------------- format time ---------------- */
function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

  // -- jump past a chapter that is already complete --------------
 

/* ===================================================================
   ReadingView
   Merged from legacy + GPT rewrite prototype
=================================================================== */
export default function ReadingView({ activity, onNeedsRefreshStatus }) {
  // ---- legacy props & checks ----
  if (!activity) {
    return (
      <Box
        sx={{
          width: "100%", height: "100%",
          bgcolor: "#000", color: "#fff",
          display: "flex", justifyContent: "center", alignItems: "center",
          p: 2
        }}
      >
        No activity provided.
      </Box>
    );
  }
  const { subChapterId, activityId, completed } = activity;
  const isComplete = completed === true;


  // ---- Redux & dispatch ----
  const userId       = useSelector((state) => state.auth?.userId || "demoUser");
  const isAdmin      = ADMIN_UIDS.includes(userId);   // NEW
  const planId       = useSelector((state) => state.plan?.planDoc?.id);
  const currentIndex = useSelector((state) => state.plan?.currentIndex);
  const dispatch     = useDispatch();

  // ---- subchapter & usage states (legacy) ----
  const [subChapter, setSubChapter] = useState(null);
  const [serverTime, setServerTime] = useState(0);
  const [lastSnapMs, setLastSnapMs] = useState(null);

  const [pages, setPages] = useState([]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);


  const [isFinishing, setIsFinishing] = useState(false);

  // ─── unified timer (copied from QuizView) ──────────────────────────
const serverTotalSeconds = useRef(0);
const lastPostMs         = useRef(Date.now());
const sessionStartMs     = useRef(null);
const [leftoverSec, setLeftoverSec] = useState(0);

const [, forceTick] = useState(0);   // triggers a re-render every second


  // track reading start for final data
  const readingStartRef = useRef(null);

  // optional day-by-day breakdown
  const [timeDetails, setTimeDetails] = useState([]);
  const [showTimeDetailsOverlay, setShowTimeDetailsOverlay] = useState(false);

  // ---- GPT tab states (from prototype) ----
  const [tab, setTab]             = useState("read");
  const [style, setStyle]         = useState("original");
  const [anchEl, setAnchEl]       = useState(null);
  const [loadingStyle, setLS]     = useState(false);

  const [selText, setSel]         = useState("");
  const [mode, setMode]           = useState("page"); // "page" or "selection"

  // local cache for rewriting
  const cache = useRef({});

  // to show a spinner while loading subchapter from server
  const [loadingSubchapter, setLoadingSubchapter] = useState(false);

  // debug overlay toggle
  const [showDebug, setShowDebug] = useState(false);



  function handleGotoNext() {
    /*  We don’t need to ping the backend again – the chapter is
        already recorded as finished – we just advance the cursor.  */
    dispatch(setCurrentIndex(currentIndex + 1));
  }

  // ---- fetch subchapter & usage on mount or subchapter change (legacy) ----
  useEffect(() => {
    if (!subChapterId) return;

    setLoadingSubchapter(true);
    setSubChapter(null);
    setServerTime(0);
    setLeftoverSec(0);
    setLastSnapMs(Date.now());
    setPages([]);
    setCurrentPageIndex(0);
    readingStartRef.current = new Date();

    async function fetchData() {
      try {
        // (A) load subchapter from server
        const res = await axios.get(
  `${import.meta.env.VITE_BACKEND_URL}/api/subchapters/${subChapterId}`
        );
        const scData = res.data;
        setSubChapter(scData);

        // (B) fetch existing usage from aggregator
        const actionRes = await dispatch(
          fetchReadingTime({ userId, planId, subChapterId })
        );

        lastPostMs.current   = Date.now();
sessionStartMs.current = Date.now();   // start local session timer


        if (fetchReadingTime.fulfilled.match(actionRes)) {
          const existingSec = actionRes.payload || 0;
          setServerTime(existingSec);
          serverTotalSeconds.current = existingSec;   // keep helpers in sync//  ← keep helpers in sync
          setLeftoverSec(0);
          setLastSnapMs(Date.now());
        }
      } catch (err) {
        console.error("Failed to fetch subchapter or usage:", err);
      } finally {
        setLoadingSubchapter(false);
      }
    }

    fetchData();
  }, [subChapterId, dispatch, userId, planId]);

  // — 1-s local counter, stops if the chapter is already complete —
useEffect(() => {
  if (isComplete) return;
  const id = setInterval(() => {
    setLeftoverSec(sec => sec + 1);
    forceTick(t => t + 1);                 // heartbeat for the UI pulse
  }, 1000);
  return () => clearInterval(id);
}, [isComplete]);

// — post in 15-second lumps (identical to QuizView) —
useEffect(() => {
  if (isComplete) return;
  const id = setInterval(() => {
    const now   = Date.now();
    const diff  = Math.floor((now - lastPostMs.current) / 1000);
    const lumps = Math.floor(diff / 15);
    if (lumps > 0) {
      const sec = lumps * 15;
      dispatch(incrementReadingTime({
        activityId,
        userId,
        planId,
        subChapterId,
        increment: sec,
      })).then(a => {
        if (incrementReadingTime.fulfilled.match(a)) {
          serverTotalSeconds.current += sec;
        }
      });
      lastPostMs.current += sec * 1000;
      setLeftoverSec(prev => prev - sec);        // subtract what we just sent
    }
  }, 1000);
  return () => clearInterval(id);
}, [dispatch, activityId, userId, planId, subChapterId, isComplete]);

  // ---- chunk subchapter once loaded (legacy) ----
  useEffect(() => {
    if (!subChapter?.summary) return;
    const chunked = chunkHtmlByParagraphs(subChapter.summary, 180);
   cache.current = { original: chunked };       // ✨ flush everything else
   setStyle("original");                  // always start from Original
    setPages(chunked);
      /* Always begin on the first page, no matter the status */
  setCurrentPageIndex(0);
}, [subChapter]);

  // ---- lumps-of-15 to aggregator (legacy) ----
  useEffect(() => {
    if (!lastSnapMs) return;
    if (isComplete) return;

    const heartbeatId = setInterval(async () => {
      if (leftoverSec >= 15) {
        const lumps = Math.floor(leftoverSec / 15);
        if (lumps > 0) {
          const totalToPost = lumps * 15;
          // TODO persistence
          const resultAction = await dispatch(
            incrementReadingTime({
              activityId,
              userId,
              planId,
              subChapterId,
              increment: totalToPost,
            })
          );
          if (incrementReadingTime.fulfilled.match(resultAction)) {
            const newTotal = resultAction.payload || serverTime + totalToPost;
            setServerTime(newTotal);
          } else {
            console.error("Increment reading time failed:", resultAction);
          }
          const remainder = leftoverSec % 15;
          setLeftoverSec(remainder);
          setLastSnapMs(Date.now() - remainder * 1000);
        }
      }
    }, 1000);

    return () => clearInterval(heartbeatId);
  }, [
    leftoverSec,
    lastSnapMs,
    dispatch,
    userId,
    planId,
    subChapterId,
    serverTime,
    isComplete,
    activityId,
  ]);

 

  // ---- fetch day-by-day breakdown (legacy) ----
  useEffect(() => {
    if (!activityId) return;
    async function fetchTimeDetails() {
      try {
        ;

const resp = await axios.get(
  `${import.meta.env.VITE_BACKEND_URL}/api/getActivityTime`, {
          params: { activityId, type: "read" },
        });
        if (resp.data && resp.data.details) {
          setTimeDetails(resp.data.details);
        }
      } catch (err) {
        console.error("fetchTimeDetails error:", err);
      }
    }
    fetchTimeDetails();
  }, [activityId]);


// whenever the sub-chapter itself changes → ensure the tiny flag is reset
useEffect(() => { setLS(false); }, [subChapterId]);

  // ---- GPT rewriting effect (from prototype) ----
  // ---- GPT rewriting effect  ✧ with Firestore cache ✧ ----
useEffect(() => {
  if (!pages || style === "original" || cache.current[style]) return;

  setLS(true);                               // show tiny spinner in the tab

  (async () => {
    try {
      /* 1️⃣  look in Firestore */
      const cacheId   = buildRewriteCacheId(userId, planId, subChapterId, style);
      const snap      = await getDoc(doc(db, RW_CACHE_COLL, cacheId));

      if (snap.exists()) {
        console.log("[ReadingView] rewrite cache HIT →", cacheId);
        cache.current[style] = snap.data().pages || [];   // ← stored as array
        return;
      }

      /* 2️⃣  GPT fallback */
          /* 1) ask GPT page-by-page → we now get {html,usage} */
    /* 2️⃣  GPT fallback */
// AFTER
const results = await Promise.all(
  pages.map(p =>
    gptRewrite(p, style, { userId, planId, subChapterId })
  )
);
cache.current[style] = results.map(r => r.html);




      /* 3️⃣  persist so the next click is instant */
      await setDoc(
  doc(db, RW_CACHE_COLL, cacheId),
  { pages: cache.current[style], createdAt: serverTimestamp() },
  { merge: false }
);
      console.log("[ReadingView] rewrite cache SAVED →", cacheId);
    } catch (err) {
      console.warn("GPT or cache failed – using mock:", err);
      cache.current[style] = pages.map((html) => mockRewrite(html, style));
    } finally {
      setLS(false);
    }
  })();
}, [style, pages, userId, planId, subChapterId]);

  // ---- selection text for "Ask AI" tab (from prototype) ----
  const handleMouseUp = () => {
    const selection = window.getSelection().toString().trim();
    if (selection) setSel(selection);
  };

  // ---- event: next/prev page (legacy + minor UI) ----
  function handleNextPage() {
    if (currentPageIndex < pages.length - 1) {
      setCurrentPageIndex((i) => i + 1);
    }
  }
  function handlePrevPage() {
    if (currentPageIndex > 0) {
      setCurrentPageIndex((i) => i - 1);
    }
  }

  // ---- finish reading => mark complete, re-fetch plan (legacy) ----
  async function handleFinishReading() {
  // 1) give immediate feedback
  setIsFinishing(true);
    const readingEndTime = new Date();
    try {
      const oldIndex = currentIndex;

      // (A) Post reading usage
      // TODO persistence
      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/submitReading`,{
        userId,
        activityId,
        subChapterId,
        readingStartTime: readingStartRef.current?.toISOString(),
        readingEndTime: readingEndTime.toISOString(),
        planId: planId ?? null,
        timestamp: new Date().toISOString(),
      });

      // (B) Mark the activity as completed
      // TODO persistence
      const payload = {
        userId,
        planId,
        activityId,
        completed: true,
      };
      if (typeof activity.replicaIndex === "number") {
        payload.replicaIndex = activity.replicaIndex;
      }

      await dispatch(refreshSubchapter(subChapterId));
      

await axios.post(
  `${import.meta.env.VITE_BACKEND_URL}/api/markActivityCompletion`, payload);

      // (C) Refresh local or parent state
      if (typeof onNeedsRefreshStatus === "function") {
        onNeedsRefreshStatus();
      }
      

const backendURL = import.meta.env.VITE_BACKEND_URL;
      const fetchUrl   = "/api/adaptive-plan";
      const fetchAction = await dispatch(
        fetchPlan({ planId, backendURL, fetchUrl })
      );
      // (D) Move to next index
      if (fetchPlan.fulfilled.match(fetchAction)) {
        dispatch(setCurrentIndex(oldIndex + 1));
      } else {
        dispatch(setCurrentIndex(oldIndex + 1));
      }
    } catch (err) {
      console.error("Error finishing reading:", err);
      dispatch(setCurrentIndex(currentIndex + 1));
    }
    finally {
    /* ➋ safety-net: hide the overlay even if something failed */
    setIsFinishing(false);
    }
  }

  // ---- derived time to display ----
  const displayedTime = isComplete
    ? serverTime
    : serverTime + leftoverSec;

  
      /* ------------------------------------------------------------
         GLOBAL LOADER
         • shows while we’re still pulling the sub-chapter from the server
      ------------------------------------------------------------ */
      const isBusy = loadingSubchapter;   // ← there is no loadingBook / loadingCh here
      if (isBusy) {
        return (
          <Loader
            type="bar"          // animated bar with fake % inside Loader
            fullScreen          // blur overlay
            message="Loading your reading passage…"
          />
        );
      }

      /* ------------------------------------------------------------
   FINISHING OVERLAY  (NEW)
   – appears the moment the user presses “Finish Reading”
------------------------------------------------------------ */
if (isFinishing) {
  return (
    <Loader
      type="bar"
      fullScreen
      message="Saving your progress…"
    />
  );
}




  if (!pages?.length) {
    return (
      <Box sx={{ color: "#fff", p: 4, textAlign: "center" }}>
        No content.
      </Box>
    );
  }

  // ---- pick the correct style version of the pages from cache ----
    /*  after a style switch the cache might not be ready yet —
      fallback to original pages until rewrite is finished     */
  const VIEW = cache.current[style] || pages;
      // --- pagination helpers (NEW) ---
const totalPages        = VIEW.length;
const pageLabel         = `${currentPageIndex + 1} / ${totalPages}`;



/* ✧ NEW — true only while we’re waiting for a rewrite ✧ */
const waitingForRewrite =
  style !== "original" &&          // a transformed style
  !cache.current[style];           // cache not filled yet


  const currentPageHtml = VIEW[currentPageIndex] || "";

  const pulsing = !isComplete &&
                ((serverTotalSeconds.current + leftoverSec) % 2 === 1);



  // ---- render ----
     return (
     <DisplayTimeCtx.Provider
       value={serverTotalSeconds.current + leftoverSec /* live seconds */}
     >
    <Box
      sx={{
        width: "100%", height: "100%", bgcolor: "#000", color: "#fff",
        display: "flex", justifyContent: "center", alignItems: "center",
        p: 2
      }}
    >
      {/* main card */}
      <Box
        sx={{
          width: "85%", maxWidth: 700, height: "92%",
          bgcolor: "#111", border: "1px solid #333", borderRadius: 2,
           display: "flex", flexDirection: "column", overflow: "hidden",
           position: "relative"            // <-- NEW
        }}
      >
        {/* header */}
        <Box
          sx={{
            bgcolor: "#222", borderBottom: "1px solid #333",
            p: 1.2, display: "flex", alignItems: "center"
          }}
        >

          {/* ───────────────── full-card overlay ─────────────── */}
{waitingForRewrite && (
  <Box
    sx={{
      position: "absolute",
      inset: 0,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      bgcolor: "rgba(0,0,0,.68)",
      zIndex: 50             /* stays above the page text */
    }}
  >
    <CircularProgress size={46} sx={{ color: "#FFD700" }} />
  </Box>
)}


          {/* tabs */}
          <Tabs
            value={tab}
            onChange={(_, v) => {
              if (v === "ai") setMode(selText ? "selection" : "page");
              setTab(v);
            }}
            textColor="inherit"
            indicatorColor="secondary"
            sx={{ "& .MuiTab-root": { minHeight: 32 } }}
          >
            <Tab
              value="read"
              label={
                <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.5 }}>
                  Read
                  
                    <Chip
                      label={STYLES.find((s) => s.key === style)?.label}
                      size="small"
                      sx={{
  bgcolor: "#424242",          // graphite 700
  color:  "#fff",
  fontSize: 11,
  "& .MuiChip-label": { px: 0.75 }  // (optional) tighten padding
}}
                    />
                  
                  <IconButton
                    size="small"
                    sx={{ p: 0, color: "#bbb" }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setAnchEl(e.currentTarget);
                    }}
                  >
                    <ArrowDropDownIcon fontSize="small" />
                  </IconButton>
                </Box>
              }
            />
            <Tab
              value="ai"
              label="Ask AI"
              icon={<SmartToyIcon sx={{ ml: 0.5 }} fontSize="small" />}
              iconPosition="end"
            />
          </Tabs>

          {/* subChapter title */}
          <Typography
            sx={{
              ml: 2, fontSize: 13, opacity: 0.7, maxWidth: 300,
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"
            }}
          >
            {subChapter?.name || ""}
          </Typography>

          {/* time chip & debug toggler */}
          <Box
            sx={{
              ml: "auto", display: "flex", alignItems: "center", gap: 1
            }}
          >
            {/*  either “completed” chip  ─or─  live timer  */}
{isComplete ? (
  /* ✅ DONE-READING PILL  ─ shows completion date + banded time */
  <Chip
    icon={<CheckCircleIcon sx={{ fontSize: 18, color: "#4caf50" }} />}
    label={`Completed • ${
      new Date(activity.completedAt ?? Date.now()).toLocaleDateString()
    } • ${formatBand(serverTotalSeconds.current)}`}
    size="small"
    sx={{
      bgcolor: "#1b5e20",
      color:  "#c8e6c9",
      fontSize: 13,
      "& .MuiChip-icon": { mr: -.4 }
    }}
  />
) : (
  /* 🕒 LIVE TIMER PILL  ─ pulses once per second */
  <ClockPill />
)}
            {/* day-by-day overlay toggle if complete */}
            {isAdmin && isComplete && (
              <Button
                variant="text"
                size="small"
                sx={{ color: "#999" }}
                onClick={() => setShowTimeDetailsOverlay((o) => !o)}
              >
                i
              </Button>
            )}
            {/* debug info toggle */}
            {isAdmin && (
            <Button
              variant="text"
              size="small"
              sx={{ color: "#999" }}
              onClick={() => setShowDebug((o) => !o)}
            >
              debug
            </Button>
            )}
          </Box>
        </Box>

        {/* style menu */}
        <Menu
          anchorEl={anchEl}
          open={Boolean(anchEl)}
          onClose={() => setAnchEl(null)}
        >
          {STYLES.map((opt) => (
            <MenuItem
              key={opt.key}
              selected={opt.key === style}
              disabled={loadingStyle && opt.key !== style}
              onClick={() => {
                setAnchEl(null);
                setStyle(opt.key);
                setCurrentPageIndex(0);
              }}
            >
              {opt.label}
            </MenuItem>
          ))}
        </Menu>

        {/* main body */}
        <Box
          sx={{ flex: 1, p: 2, overflowY: "auto",  position: "relative" }}
          onMouseUp={handleMouseUp}
        >

          



          {tab === "read" ? (
    waitingForRewrite ? (
      /* ⬅️ loader covers the page while we wait */
      <RewriteOverlay />
    ) : (
      <div
        dangerouslySetInnerHTML={{ __html: currentPageHtml }}
        style={{ fontSize: "1.1rem", lineHeight: 1.6 }}
      />
    )
  ) : (
            <AskAIChat
              contextText={
                mode === "page"
                  ? currentPageHtml.replace(/<[^>]+>/g, " ")
                  : selText
              }
              mode={mode}
              onModeChange={setMode}
              selection={selText}
              subChapterId={subChapterId}   // ← add this line
            />
          )}
        </Box>

{/* footer nav (only for "read" tab) */}
{tab === "read" && (
  <Box
    sx={{
      p: 1,
      borderTop: "1px solid #333",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 1        // nicer spacing
    }}
  >
    {/* PREVIOUS */}
    <Button
  size="small"
  variant="contained"
  sx={{
    bgcolor: "#545454",            // ← graphite
    "&:hover": { bgcolor: "#616161" }
  }}
  onClick={handlePrevPage}
>
  Previous
</Button>

    {/* PAGE COUNTER (NEW) */}
    <Typography
      sx={{ flexShrink: 0, fontSize: 14, opacity: 0.8 }}
    >
      Page&nbsp;{pageLabel}
    </Typography>

    {/* NEXT  |  FINISH */}
    {currentPageIndex < totalPages - 1 ? (
      <Button
  size="small"
  variant="contained"
  sx={{
    bgcolor: "#5e35b1",            // ← indigo
    "&:hover": { bgcolor: "#512da8" }
  }}
  onClick={handleNextPage}
>
  Next
</Button>
    ) : (
     <Button
  size="small"
  variant="contained"
  sx={{
    bgcolor: "#26a69a",              // teal
    "&:hover": { bgcolor: "#1e8e86" }
  }}
  onClick={isComplete ? handleGotoNext : handleFinishReading}
  disabled={isFinishing}
>
  {isFinishing && (
    <CircularProgress
      size={14}
      sx={{ color: "#fff", mr: 1 }}
    />
  )}
  {isComplete
    ? "Next Task"
    : isFinishing
      ? "Saving…"
      : "Finish Reading"}
</Button>
    )}
  </Box>
)}
      </Box>

      {/* Day-by-day overlay */}
      {showTimeDetailsOverlay && (
        <Box
          sx={{
            position: "absolute", top: 80,
            backgroundColor: "#222", border: "1px solid #444",
            borderRadius: 1, p: 2, maxWidth: 300, zIndex: 9999
          }}
        >
          <Typography variant="h6" sx={{ mb: 1 }}>
            Reading Time Breakdown
          </Typography>
          {timeDetails && timeDetails.length > 0 ? (
            <ul style={{ paddingLeft: "1.25rem" }}>
              {timeDetails.map((item, idx) => (
                <li key={idx} style={{ marginBottom: "0.4rem" }}>
                  <strong>{item.dateStr || "No date"}</strong>:
                  {" "}{item.totalSeconds} sec
                </li>
              ))}
            </ul>
          ) : (
            <Typography variant="body2">No data found.</Typography>
          )}
        </Box>
      )}

      {/* Debug overlay */}
      {showDebug && (
        <Box
          sx={{
            position: "absolute", top: 80, right: 16,
            backgroundColor: "#222", border: "1px solid #444",
            borderRadius: 1, p: 1.5, width: 300, zIndex: 9999
          }}
        >
          <Typography variant="h6">Debug Info</Typography>
          <pre style={{ whiteSpace: "pre-wrap", fontSize: 12 }}>
{JSON.stringify(
  {
    activity,
    subChapter,
    serverTime,
    leftoverSec,
    currentPageIndex,
    totalPages: VIEW.length,
    completed,
  },
  null,
  2
)}
          </pre>
        </Box>
      )}
    </Box>
    </DisplayTimeCtx.Provider>
  );
}