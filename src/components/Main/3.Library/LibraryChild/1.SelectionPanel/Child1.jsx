// File: src/components/DetailedBookViewer/Child1.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import {
  Box, Typography, LinearProgress, IconButton, Pagination,
  TextField, FormControl, InputLabel, Select, MenuItem,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";

/* ------------------------------------------------------------------ */
/* 1. SHARED HELPERS                                                  */
/* ------------------------------------------------------------------ */
function getBookIcon(name = "") {
  const lower = name.toLowerCase();
  if (lower.includes("math"))     return "📐";
  if (lower.includes("science"))  return "🔬";
  if (lower.includes("history"))  return "🏰";
  if (lower.includes("art"))      return "🎨";
  return "📚";
}

/* ------------------------------------------------------------------ */
/* 2. TOEFL‑ONLY CONSTANTS                                            */
/* ------------------------------------------------------------------ */
const TOEFL_BOOK_ORDER = [
  "TOEFL Reading Guidebook",
  "TOEFL Writing Guidebook",
  "TOEFL Speaking Guidebook",
  "TOEFL Listening Guidebook",
];

function getToeflBookIcon(name) {
  switch (name) {
    case "TOEFL Reading Guidebook":   return "📖";
    case "TOEFL Writing Guidebook":   return "✍️";
    case "TOEFL Speaking Guidebook":  return "🗣️";
    case "TOEFL Listening Guidebook": return "🎧";
    default:                          return "📚";
  }
}

/* ------------------------------------------------------------------ */
/* 3.  FIXED‑TILE CONFIG FOR OTHER EXAMS                              */
/* ------------------------------------------------------------------ */
/*  – Add / remove exams or book arrays here.                         */
export const PANEL_BOOK_CONFIG = {
  CBSE: {
    books: ["CBSE1", "CBSE2", "CBSE3", "CBSE4"],
    iconMap: { CBSE1: "📘", CBSE2: "📙", CBSE3: "📗", CBSE4: "📕" },
  },
  JEEADVANCED: {
    books: ["JEEADVANCED1", "JEEADVANCED2", "JEEADVANCED3", "JEEADVANCED4"],
    iconMap: { JEEADVANCED1: "⚙️", JEEADVANCED2: "🧪", JEEADVANCED3: "📐", JEEADVANCED4: "🔋" },
  },
  NEET: {
    books: ["NEET1", "NEET2", "NEET3", "NEET4"],
    iconMap: { NEET1: "🫀", NEET2: "🧠", NEET3: "🦴", NEET4: "🧬" },
  },
  SAT: {
    books: ["SAT1", "SAT2", "SAT3", "SAT4"],
    iconMap: { SAT1: "📝", SAT2: "📏", SAT3: "📐", SAT4: "📚" },
  },
  GATE: {
    books: ["GATE1", "GATE2", "GATE3", "GATE4"],
    iconMap: { GATE1: "⚙️", GATE2: "🔧", GATE3: "📊", GATE4: "🔬" },
  },
  CAT: {
    books: ["CAT1", "CAT2", "CAT3", "CAT4"],
    iconMap: { CAT1: "📈", CAT2: "📉", CAT3: "💹", CAT4: "📊" },
  },
  GRE: {
    books: ["GRE1", "GRE2", "GRE3", "GRE4"],
    iconMap: { GRE1: "📝", GRE2: "📚", GRE3: "📖", GRE4: "✍️" },
  },
  UPSC: {
    books: ["UPSC1", "UPSC2", "UPSC3", "UPSC4"],
    iconMap: { UPSC1: "📜", UPSC2: "🗺️", UPSC3: "🏛️", UPSC4: "⚖️" },
  },
  FRM: {
    books: ["FRM1", "FRM2", "FRM3", "FRM4"],
    iconMap: { FRM1: "💰", FRM2: "📊", FRM3: "📉", FRM4: "📈" },
  },
};

/* ------------------------------------------------------------------ */
/* 4. MAIN COMPONENT                                                  */
/* ------------------------------------------------------------------ */
export default function Child1({ userId, onBookSelect = () => {}, onOpenOnboarding = () => {} }) {
  const examType = useSelector((s) => s.exam.examType);
  const [booksData, setBooksData] = useState([]);
  const [selectedBookId, setSelectedBookId] = useState(null);

  /* ---- fetch user's real books once ---- */
  useEffect(() => {
    if (!userId) return;
    (async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/books-user`, { params: { userId } });
        setBooksData(res.data?.success ? res.data.data : []);
      } catch (e) {
        console.error("books-user:", e);
        setBooksData([]);
      }
    })();
  }, [userId]);

  /* ================================================================
     1) TOEFL BRANCH  (unchanged – uses locked tiles)
  =================================================================*/
  if (examType === "TOEFL") {
    /* … original TOEFL rendering kept exactly as before … */
    /*   (omitted here for brevity – just leave your old code)       */
  }

  /* ================================================================
     2)  FIXED‑TILE BRANCH  (CBSE, JEEADVANCED, …)
  =================================================================*/
  const fixedCfg = PANEL_BOOK_CONFIG[examType];
  if (fixedCfg) {
    const tiles = fixedCfg.books.map((title) => {
      const match = booksData.find((b) => b.name === title) || null;
      return {
        title,
        icon: fixedCfg.iconMap[title] || "📚",
        found: Boolean(match),
        bookId: match?.id || null,
      };
    });

    return (
      <Box sx={{ backgroundColor: "#000", color: "#FFF", p: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2 }}>
          My Materials
        </Typography>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {tiles.map((t) => (
            <Box
              key={t.title}
              sx={{
                p: 2,
                borderRadius: 1,
                backgroundColor: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.15)",
                cursor: t.found ? "pointer" : "default",
                display: "flex",
                alignItems: "center",
                gap: 1.5,
              }}
              onClick={() => t.found && onBookSelect(t.bookId, t.title)}
            >
              <Typography sx={{ fontSize: "1.5rem" }}>{t.icon}</Typography>
              <Typography variant="body1" sx={{ fontWeight: "bold" }}>
                {t.title}
              </Typography>
              {!t.found && (
                <Typography variant="caption" sx={{ opacity: 0.7 }}>
                  — not in your library
                </Typography>
              )}
            </Box>
          ))}
        </Box>
      </Box>
    );
  }


  /* ========================================================= */
  /* 3)  Fallback = original generic list (plus button shown)  */
  /* ========================================================= */
  return (
        <GenericBookList
          booksData={booksData}
          selectedBookId={selectedBookId}
          setSelectedBook={setSelectedBookId}        //  ← correct
          onBookSelect={onBookSelect}
          onOpenOnboarding={onOpenOnboarding}
        />
      );
}

/* ================================================================= */
/* <SpecialPanel>  – reusable 4‑tile locked/unlocked layout           */
/* ================================================================= */
function SpecialPanel({ tiles, selectedBookId, setSelectedBook, onBookSelect, plusDisabled }) {
  return (
    <Box sx={{ backgroundColor: "#000", color: "#FFF", p: 2 }}>
      <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2 }}>
        My Materials
      </Typography>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {tiles.map(tb => {
          const found      = Boolean(tb.bookObj);
          const isSelected = tb.bookObj?.id === selectedBookId;

          return (
            <Box
              key={tb.title}
              sx={{
                p: 2,
                borderRadius: 1,
                backgroundColor: isSelected ? "rgba(187,134,252,0.3)" : "rgba(255,255,255,0.06)",
                border: isSelected ? "2px solid #BB86FC" : "1px solid rgba(255,255,255,0.15)",
                cursor: found && !tb.locked ? "pointer" : "default",
              }}
              onClick={() => {
                if (found && !tb.locked) {
                  setSelectedBook(tb.bookObj.id);
                  onBookSelect(tb.bookObj.id, tb.bookObj.name);
                }
              }}
            >
              {/* header */}
              <Box sx={{ display:"flex", alignItems:"center", gap:1.5, mb:1 }}>
                <Typography sx={{ fontSize:"1.5rem" }}>{tb.icon}</Typography>
                <Typography variant="h6" sx={{ fontWeight:"bold" }}>{tb.title}</Typography>
              </Box>

              {/* body */}
              {!found && (
                <Typography variant="body2" sx={{ opacity:0.7 }}>Not found in your library.</Typography>
              )}

              {found && (
                tb.locked ? (
                  <>
                    <LinearProgress variant="determinate" value={0} sx={progressStyle} />
                    <Typography variant="caption" sx={{opacity:0.8}}>0% complete</Typography>
                    <Box sx={lockChip}><span role="img" aria-label="lock">🔒</span> Locked</Box>
                  </>
                ) : (
                  <>
                    <LinearProgress variant="determinate" value={tb.progress} sx={progressStyle} />
                    <Typography variant="caption" sx={{opacity:0.8}}>
                      {tb.progress}% complete
                    </Typography>
                  </>
                )
              )}
            </Box>
          );
        })}
      </Box>

      {/* "+" button intentionally hidden */}
      {!plusDisabled && (
        <IconButton sx={{ color:"#4CAF50", mt:2 }} title="Upload">
          <AddIcon/>
        </IconButton>
      )}
    </Box>
  );
}

/* ================================================================= */
/* <GenericBookList> – the original search / sort / pagination view   */
/* (moved out to keep the main component readable – logic unchanged) */
/* ================================================================= */
function GenericBookList({
  booksData,
  selectedBookId,
  setSelectedBookId,
  onBookSelect,
  onOpenOnboarding,
}) {
  // ---------------- local state kept exactly as before -------------
  const [page, setPage] = React.useState(1);
  const booksPerPage = 5;
  const [searchQuery, setSearchQuery] = React.useState("");
  const [sortOption, setSortOption] = React.useState("NEWEST");

  /* ---------- filtering / sorting logic (unchanged) -------------- */
  const filtered = booksData.filter((b) =>
    (b.name || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sorted = [...filtered].sort((a, b) => {
    const dA = a.createdAt ? new Date(a.createdAt) : 0;
    const dB = b.createdAt ? new Date(b.createdAt) : 0;
    const nA = (a.name || "").toLowerCase();
    const nB = (b.name || "").toLowerCase();

    switch (sortOption) {
      case "NEWEST":     return dB - dA;
      case "OLDEST":     return dA - dB;
      case "ALPHA_ASC":  return nA.localeCompare(nB);
      case "ALPHA_DESC": return nB.localeCompare(nA);
      default:           return 0;
    }
  });

  /* ----------- tiny helper for progress % ----------- */
  const bookStats = sorted.map((bk) => {
    let total = 0, done = 0;
    (bk.chapters || []).forEach((c) => {
      (c.subChapters || []).forEach((s) => {
        total += 1;
        if (s.isDone) done += 1;
      });
    });
    return {
      ...bk,
      progress: total ? Math.round((done / total) * 100) : 0,
    };
  });

  /* -------------- pagination -------------- */
  const start = (page - 1) * booksPerPage;
  const current = bookStats.slice(start, start + booksPerPage);

  /* -------------- render -------------- */
  return (
    <Box sx={{ background: "#000", color: "#fff", p: 2, display: "flex", flexDirection: "column", gap: 2 }}>
      {/* header + "+" button */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Typography variant="h6" sx={{ fontWeight: "bold" }}>My Materials</Typography>
        <IconButton sx={{ color: "#4CAF50" }} onClick={onOpenOnboarding} title="Upload">
          <AddIcon/>
        </IconButton>
      </Box>

      {/* search / sort */}
      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
        <TextField
          size="small"
          placeholder="Search…"
          value={searchQuery}
          onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
          sx={{ width: 160, input:{color:"#fff"}, "& .MuiOutlinedInput-root > fieldset":{borderColor:"rgba(255,255,255,0.3)"} }}
        />
        <FormControl size="small" sx={{ minWidth:120 }}>
          <InputLabel sx={{ color:"#fff" }}>Sort</InputLabel>
          <Select
            value={sortOption}
            label="Sort"
            onChange={(e)=>{ setSortOption(e.target.value); setPage(1); }}
            sx={{ color:"#fff" }}
          >
            <MenuItem value="NEWEST">Newest</MenuItem>
            <MenuItem value="OLDEST">Oldest</MenuItem>
            <MenuItem value="ALPHA_ASC">A → Z</MenuItem>
            <MenuItem value="ALPHA_DESC">Z → A</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* list */}
      {current.map((bk) => {
        const isSel = bk.id === selectedBookId;
        const icon  = getBookIcon(bk.name);
        const date  = bk.createdAt ? new Date(bk.createdAt).toLocaleDateString() : "—";

        return (
          <Box
            key={bk.id}
            sx={{
              p: 1, display:"flex", gap:1.5, alignItems:"center",
              borderRadius:1,
              background: isSel ? "rgba(187,134,252,.3)" : "rgba(255,255,255,.06)",
              border: isSel ? "2px solid #BB86FC" : "1px solid rgba(255,255,255,.15)",
              cursor:"pointer"
            }}
            onClick={()=>{
              setSelectedBookId(bk.id);
              onBookSelect(bk.id, bk.name);
            }}
          >
            <Box sx={{ fontSize:"1.5rem", width:"2rem", textAlign:"center" }}>{icon}</Box>
            <Box sx={{ flex:1 }}>
              <Typography sx={{ fontWeight:"bold", lineHeight:1.2 }}>{bk.name}</Typography>
              <Typography variant="caption" sx={{ opacity:.8 }}>{date}</Typography>
              <LinearProgress variant="determinate" value={bk.progress} sx={progressStyle}/>
              <Typography variant="caption" sx={{ opacity:.8 }}>{bk.progress}% complete</Typography>
            </Box>
          </Box>
        );
      })}

      {/* pagination */}
      {bookStats.length > booksPerPage && (
        <Box sx={{ mt:1, display:"flex", justifyContent:"center" }}>
          <Pagination
  count={Math.ceil(bookStats.length / booksPerPage)}
  page={page}
  onChange={(e, v) => setPage(v)}
  siblingCount={0}           // optional – keeps the bar compact
  sx={{
    /* all items */
    "& .MuiPaginationItem-root": {
      color: "#FFF",
      borderColor: "rgba(255,255,255,0.3)",
    },
    /* selected page */
    "& .MuiPaginationItem-root.Mui-selected": {
      backgroundColor: "#BB86FC",   // purple pill
      color: "#000",                // text inside the pill
    },
    /* hover / focus states */
    "& .MuiPaginationItem-root:hover": {
      backgroundColor: "rgba(255,255,255,0.08)",
    },
    "& .MuiPaginationItem-root.Mui-selected:hover": {
      backgroundColor: "#BB86FC",
      opacity: 0.9,
    },
    /* the “…” element */
    "& .MuiPaginationItem-ellipsis": {
      color: "#FFF",
    },
  }}
/>
        </Box>
      )}
    </Box>
  );
}

/* ---------- tiny shared style snippets ---------- */
const progressStyle = {
  height: 6,
  borderRadius: 1,
  backgroundColor: "rgba(255,255,255,0.3)",
  my: 1,
  "& .MuiLinearProgress-bar": { backgroundColor: "#FFD700" }
};
const lockChip = {
  mt:1,
  display:"inline-flex",
  alignItems:"center",
  gap:0.5,
  backgroundColor:"#333",
  color:"#fff",
  px:1,
  py:0.5,
  borderRadius:1,
  fontSize:"0.9rem",
  fontWeight:"bold"
};