import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import axios from "axios";
import {
  Box,
  Button,
  CircularProgress,
  Typography,
  Alert,
  Grid,
  Checkbox,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  List,
  TextField,
  Tooltip,
  IconButton,
  RadioGroup,
  Radio,
  FormControlLabel,
  FormControl,
  FormLabel,
} from "@mui/material";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import InfoIcon from "@mui/icons-material/Info";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";

/* ---------- helpers ---------- */
const stringify = (x) => (typeof x === "string" ? x : JSON.stringify(x));

function sortByNumericPrefix(arr) {
  return arr.slice().sort((a, b) => {
        const getNum = (str) => {
          const m = str?.match(/^(\d+)\.?/);
          return m ? parseInt(m[1], 10) : 999999;
        };
        const numA = getNum(a.title);
        const numB = getNum(b.title);
        return numA === numB
          ? a.title.localeCompare(b.title)
          : numA - numB;
      });
    }

/* ---------- component ---------- */
export default function GuideOnboarding() {
  /* Redux */
  const userId   = useSelector((s) => s.auth?.userId);
  const examType = useSelector((s) => s.exam?.examType);

  /* bookId lookup -------------------------------------------------- */
  const [bookId, setBookId]     = useState(null);
  const [bookErr, setBookErr]   = useState(null);
  const [loadingBook, setLB]    = useState(false);

  useEffect(() => {
    if (!userId || !examType) return;

    (async () => {
      setLB(true); setBookErr(null);
      try {
        const { doc, getDoc } = await import("firebase/firestore");
        const firebase = await import("../../../../../../../firebase");
        const snap = await getDoc(
          doc(firebase.db, "users", userId)
        );

        if (!snap.exists()) throw new Error("User doc not found");

        const fieldMap = {
          NEET:  "clonedNeetBook",
          TOEFL: "clonedToeflBooks",
          // add others as needed…
        };

        const entry = snap.data()[fieldMap[examType.toUpperCase()]];
        const id =
          Array.isArray(entry) ? entry?.[0]?.newBookId : entry?.newBookId;
        if (!id) throw new Error("newBookId missing");
        setBookId(id);
      } catch (e) {
        setBookErr(stringify(e.message || e));
      } finally {
        setLB(false);
      }
    })();
  }, [userId, examType]);

  /* chapter list --------------------------------------------------- */
  const backendURL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";
  const [chapters, setChapters]       = useState([]);
  const [chapErr,  setChapErr]        = useState(null);
  const [loadingCh, setLoadingCh]     = useState(false);

  useEffect(() => {
    if (!userId || !bookId) return;

    (async () => {
      setLoadingCh(true); setChapErr(null);
      try {
        const res = await axios.get(`${backendURL}/api/process-book-data`, {
          params: { userId, bookId },
        });
        const list = res.data?.chapters ?? [];
        const cooked = sortByNumericPrefix(
          list.map((c) => ({
            id: c.id,
            title: c.name,
            expanded: false,
            selected: true,
            subchapters: sortByNumericPrefix(
              (c.subchapters || []).map((s) => ({
                id: s.id,
                title: s.name,
              }))
            ),
          }))
        );
        setChapters(cooked);
      } catch (e) {
        setChapErr(stringify(e.message || e));
      } finally {
        setLoadingCh(false);
      }
    })();
  }, [userId, bookId, backendURL]);

  /* selection handlers --------------------------------------------- */
  const toggleChapter = (idx) => {
    setChapters((prev) =>
      prev.map((c, i) =>
        i === idx
          ? {
              ...c,
              selected: !c.selected,
            }
          : c
      )
    );
  };
  const toggleAccord = (idx) =>
    setChapters((prev) =>
      prev.map((c, i) => (i === idx ? { ...c, expanded: !c.expanded } : c))
    );

  /* plan-selection fields ------------------------------------------ */
  const [targetDate,       setTargetDate]       = useState("");
  const [dailyReadingTime, setDailyReadingTime] = useState(30);
  const [masteryLevel,     setMasteryLevel]     = useState("mastery");

  /* generation ------------------------------------------------------ */
  const [creating, setCreating]   = useState(false);
  const [success,  setSuccess]    = useState(false);
  const [genErr,   setGenErr]     = useState(null);

  const PLAN_ENDPOINT =
    "https://generateadaptiveplan2-zfztjkkvva-uc.a.run.app";

  function buildBody() {
    /* selected chapters */
    const sel = chapters.filter((c) => c.selected);
    const selectedChapterIds =
      sel.length === chapters.length ? null : sel.map((c) => c.id);

    /* quiz / revise time from masteryLevel */
    const quizRevMap = {
      mastery:   5,
      revision:  3,
      glance:    1,
    };
    const qr = quizRevMap[masteryLevel] ?? 1;

    return {
      userId,
      bookId,
      targetDate,
      dailyReadingTime,
      planType: masteryLevel,
      quizTime: qr,
      reviseTime: qr,
      ...(selectedChapterIds ? { selectedChapters: selectedChapterIds } : {}),
    };
  }

  async function handleGenerate() {
    if (!bookId) return;
    /* basic validation */
    if (!chapters.some((c) => c.selected)) {
      setGenErr("Please keep at least one chapter selected.");
      return;
    }

    setCreating(true); setSuccess(false); setGenErr(null);
    try {
      await axios.post(PLAN_ENDPOINT, buildBody(), {
        headers: { "Content-Type": "application/json" },
      });
      setSuccess(true);
    } catch (e) {
      const msg =
        e.response?.data?.error || e.response?.data?.message || e.message;
      setGenErr(stringify(msg));
    } finally {
      setCreating(false);
    }
  }

  /* ---------------------------------- UI ---------------------------------- */
  const purple = "#B39DDB";

  return (
    <Box
      sx={{
        maxWidth: 760,
        mx: "auto",
        mt: 5,
        p: 3,
        bgcolor: "rgba(255,255,255,0.04)",
        borderRadius: 2,
        color: "#fff",
      }}
    >
      <Typography variant="h5" sx={{ fontWeight: "bold", mb: 2 }}>
        {examType ? `${examType} Plan Setup` : "Loading…"}
      </Typography>

      {/* book & chapter loaders / errors */}
      {(loadingBook || loadingCh) && <CircularProgress sx={{ color: purple }} />}
      {bookErr && <Alert severity="error" sx={{ mb: 2 }}>{bookErr}</Alert>}
      {chapErr && <Alert severity="error" sx={{ mb: 2 }}>{chapErr}</Alert>}

      {/* CHAPTER SELECTION */}
      {chapters.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography sx={{ fontWeight: "bold", mb: 1 }}>
            Chapters
          </Typography>
          {chapters.map((c, idx) => (
            <Box key={c.id} sx={{ mb: 1 }}>
              <ListItem disablePadding sx={{ bgcolor: "#333", borderRadius: 1 }}>
                <ListItemButton onClick={() => toggleAccord(idx)}>
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <Checkbox
                      checked={c.selected}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleChapter(idx);
                      }}
                      sx={{
                        color: purple,
                        "&.Mui-checked": { color: "#D1C4E9" },
                      }}
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography sx={{ color: "#fff", fontWeight: 500 }}>
                        {c.title}
                      </Typography>
                    }
                  />
                  {c.expanded ? (
                    <ExpandLess sx={{ color: "#fff" }} />
                  ) : (
                    <ExpandMore sx={{ color: "#fff" }} />
                  )}
                </ListItemButton>
              </ListItem>
              <Collapse in={c.expanded} unmountOnExit timeout="auto">
                <List disablePadding>
                  {c.subchapters.map((s) => (
                    <ListItem key={s.id} sx={{ pl: 6, bgcolor: "#444" }}>
                      <ListItemIcon sx={{ minWidth: 30 }}>
                        <Typography sx={{ color: purple, fontWeight: "bold" }}>
                          •
                        </Typography>
                      </ListItemIcon>
                      <ListItemText
                        primary={<Typography sx={{ color: "#fff" }}>{s.title}</Typography>}
                      />
                    </ListItem>
                  ))}
                </List>
              </Collapse>
            </Box>
          ))}
        </Box>
      )}

      {/* PLAN-SELECTION FIELDS */}
      <Grid container spacing={3}>
        {/* target date */}
        <Grid item xs={12} sm={6}>
          <Box display="flex" alignItems="center" gap={1}>
            <Typography sx={{ fontWeight: "bold" }}>
              <CalendarMonthIcon
                sx={{ fontSize: "1rem", verticalAlign: "middle", color: purple }}
              />{" "}
              Target Date
            </Typography>
            <Tooltip title="We’ll check if the plan fits this date.">
              <IconButton size="small" sx={{ color: purple }}>
                <InfoIcon fontSize="inherit" />
              </IconButton>
            </Tooltip>
          </Box>
          <TextField
            type="date"
            fullWidth
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            size="small"
            sx={{
              "& .MuiOutlinedInput-root": { color: "#fff", bgcolor: "#333" },
              "& .MuiOutlinedInput-notchedOutline": { borderColor: purple },
            }}
          />
        </Grid>

        {/* daily reading */}
        <Grid item xs={12} sm={6}>
          <Box display="flex" alignItems="center" gap={1}>
            <Typography sx={{ fontWeight: "bold" }}>
              <AccessTimeIcon
                sx={{ fontSize: "1rem", verticalAlign: "middle", color: purple }}
              />{" "}
              Daily Reading (min)
            </Typography>
            <Tooltip title="Minutes per day you can dedicate">
              <IconButton size="small" sx={{ color: purple }}>
                <InfoIcon fontSize="inherit" />
              </IconButton>
            </Tooltip>
          </Box>
          <TextField
            type="number"
            fullWidth
            value={dailyReadingTime}
            onChange={(e) => setDailyReadingTime(Number(e.target.value))}
            size="small"
            sx={{
              "& .MuiOutlinedInput-root": { color: "#fff", bgcolor: "#333" },
              "& .MuiOutlinedInput-notchedOutline": { borderColor: purple },
            }}
          />
        </Grid>

        {/* mastery level */}
        <Grid item xs={12}>
          <Box display="flex" alignItems="center" gap={1}>
            <Typography sx={{ fontWeight: "bold" }}>
              <AssignmentTurnedInIcon
                sx={{ fontSize: "1rem", verticalAlign: "middle", color: purple }}
              />{" "}
              Mastery Level
            </Typography>
          </Box>
          <FormControl sx={{ mt: 1 }}>
            <FormLabel sx={{ color: "#fff" }}>
              Choose Level
            </FormLabel>
            <RadioGroup
              row
              value={masteryLevel}
              onChange={(e) => setMasteryLevel(e.target.value)}
            >
              {["mastery", "revision", "glance"].map((lvl) => (
                <FormControlLabel
                  key={lvl}
                  value={lvl}
                  control={
                    <Radio
                      sx={{
                        color: purple,
                        "&.Mui-checked": { color: purple },
                      }}
                    />
                  }
                  label={lvl.charAt(0).toUpperCase() + lvl.slice(1)}
                  sx={{ color: "#fff" }}
                />
              ))}
            </RadioGroup>
          </FormControl>
        </Grid>
      </Grid>

      {/* generate button */}
      <Box sx={{ mt: 3, textAlign: "center" }}>
        <Button
          variant="contained"
          disabled={creating || !bookId || loadingBook || loadingCh}
          onClick={handleGenerate}
          sx={{ bgcolor: purple, "&:hover": { bgcolor: "#D1C4E9" } }}
        >
          {creating ? "Generating…" : "Generate Plan"}
        </Button>
      </Box>

      {/* result toasts */}
      {success && (
        <Alert severity="success" sx={{ mt: 2 }}>
          🎉 Plan created successfully!
        </Alert>
      )}
      {genErr && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {genErr}
        </Alert>
      )}
    </Box>
  );
}