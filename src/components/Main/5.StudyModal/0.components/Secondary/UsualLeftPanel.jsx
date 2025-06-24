/* ─────────────────────────────────────────────────────────────
   LeftPanel.jsx – paginated sidebar with “How it works” dialog
────────────────────────────────────────────────────────────── */
import React, { useEffect, useMemo, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { setCurrentIndex } from "../../../../../store/planSlice";
import { fetchAggregatorForDay } from "../../../../../store/aggregatorSlice";

import {
  Box,
  Typography,
  Select,
  Chip,
  MenuItem,
  FormControl,
  IconButton,
  Pagination,
  Button,
  Dialog
} from "@mui/material";
import MenuIcon        from "@mui/icons-material/Menu";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";

import useTaskModel      from "./shared/useTaskModel";
import TaskCard          from "./shared/TaskCard";
import DayProgressCircle from "./shared/DayProgressCircle";
import HowItWorks from "../../../3.Library/3.AdaptivePlanView/6.HowItWorks/HowItWorks";


/* ---------- constants ---------- */
const CARD_PAGE_SIZE = 2;
const ACCENT = "#BB86FC";

const STAGE_LABEL = "Stage 1 · Diagnosis";

/* ---------- styling ---------- */
const containerSx = {
  height: "100%",
  bgcolor: "#1A1A1A",
  color: "#fff",
  display: "flex",
  flexDirection: "column",
  p: 1,
  boxSizing: "border-box",
};

const columnSx = {
  flex: 1,
  overflowY: "auto",
  overflowX: "hidden",
  "&::-webkit-scrollbar": { width: "6px" },
  "&::-webkit-scrollbar-track": { background: "transparent" },
  "&::-webkit-scrollbar-thumb": { background: "#555", borderRadius: 3 },
  scrollbarWidth: "thin",
  scrollbarColor: "#555 transparent",
};

/* =================================================================== */
export default function LeftPanel({ isCollapsed = false, onToggleCollapse }) {
  /* ---------- redux ---------- */
  const dispatch = useDispatch();
  const {
    planDoc,
    flattenedActivities,
    currentIndex,
    status: planStatus,
  } = useSelector((s) => s.plan);

  const timeMap       = useSelector((s) => s.aggregator.timeMap);
  const subchapterMap = useSelector((s) => s.aggregator.subchapterMap);

  /* ---------- local UI state (unconditional) ---------- */
  const [dayIdx, setDayIdx] = useState(0);          // adaptive-plan only
  const [page,   setPage]   = useState(1);          // pagination
  const [autoSync, setAutoSync] = useState(true);
  const [hiwOpen,  setHiwOpen]  = useState(false);  // ← NEW state

  /* ---------- plan helpers ---------- */
  const planType = planDoc?.planType || "adaptive";
  const sessions = planDoc?.sessions || [];

  const rawSession =
    planType === "book" ? sessions[0] || {} : sessions[dayIdx] || {};
  const rawActs = rawSession.activities || [];

  /* ---------- fetch aggregator for this day ---------- */
  useEffect(() => {
    if (planStatus === "succeeded") {
      dispatch(fetchAggregatorForDay({ dayIndex: dayIdx }));
    }
  }, [dispatch, dayIdx, planStatus]);

  /* ---------- build task models ---------- */
  const tasks = useTaskModel(rawActs, subchapterMap, timeMap);

  /* ---------- keep dayIdx in sync with currentIndex ---------- */
  useEffect(() => {
    if (planType === "book" || !flattenedActivities?.length) return;
    const act = flattenedActivities[currentIndex];
    if (act && typeof act.dayIndex === "number") setDayIdx(act.dayIndex);
  }, [currentIndex, flattenedActivities, planType]);

  /* ---------- pagination ---------- */
  const totalPages = Math.max(1, Math.ceil(tasks.length / CARD_PAGE_SIZE));

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const pageTasks = useMemo(
    () => tasks.slice((page - 1) * CARD_PAGE_SIZE, page * CARD_PAGE_SIZE),
    [tasks, page]
  );

  /* auto-flip page when needed */
  useEffect(() => {
    if (!autoSync) return;
    const idxInList = tasks.findIndex((t) => t.flatIndex === currentIndex);
    if (idxInList === -1) return;
    const needPage = Math.floor(idxInList / CARD_PAGE_SIZE) + 1;
    if (needPage !== page) setPage(needPage);
  }, [currentIndex, tasks, page, autoSync]);

  const handleDayChange = (e) => {
    setDayIdx(Number(e.target.value));
    setPage(1);
  };

  /* ---------- helpers ---------- */
  const progressPct =
    tasks.length > 0
      ? Math.round(
          (tasks.filter((t) => t.status === "completed").length / tasks.length) *
            100
        )
      : 0;

  /* ---------- Scroll column including centred footer ---------- */
const CardColumn = () => (
  <Box sx={columnSx}>
    {/* flex wrapper lets us push the footer down */}
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100%" }}>
      {/* --- task cards --- */}
      {pageTasks.map((t) => (
        <TaskCard
          key={t.id}
          t={t}
          selected={currentIndex === t.flatIndex}
          onOpen={() => {
            setAutoSync(true);
            dispatch(setCurrentIndex(t.flatIndex));
          }}
        />
      ))}

      {/* --- pagination --- */}
      {totalPages > 1 && (
        <Box
          sx={{
            pt: 1,
            display: "flex",
            justifyContent: "center",
          }}
        >
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, p) => {
              setAutoSync(false);
              setPage(p);
            }}
            size="small"
            siblingCount={0}
            boundaryCount={1}
            sx={{
              "& .MuiPaginationItem-root":  { color: "#fff" },
              "& .MuiPaginationItem-icon":  { color: "#fff" },
              "& .MuiPaginationItem-root.Mui-selected": {
                color: "#fff",
                bgcolor: "#555",
                "&:hover": { bgcolor: "#666" },
              },
            }}
          />
        </Box>
      )}

      {/* grow-able spacer pushes footer downward */}
      <Box sx={{ flexGrow: 1 }} />

      {/* --- stage chip --- */}
      <Box sx={{ display: "flex", justifyContent: "center", pb: 1 }}>
        <Chip
          label="Stage 1 · Deep Dive"
          size="small"
          sx={{
            bgcolor: "#333",
            color: "#fff",
            fontWeight: 600,
            px: 1.5,
          }}
        />
      </Box>

      {/* --- “Learn how it works” button --- */}
      <Box sx={{ display: "flex", justifyContent: "center", pb: 2 }}>
        <Button
          startIcon={<HelpOutlineIcon />}
          size="small"
          sx={{
            bgcolor: ACCENT,
            color: "#000",
            fontWeight: 600,
            px: 2,
            textTransform: "none",   // ⬅️ keep natural casing
            "&:hover": { bgcolor: "#A57BF7" },
          }}
          onClick={() => setHiwOpen(true)}
        >
          Learn&nbsp;how&nbsp;it&nbsp;works
        </Button>
      </Box>
    </Box>
  </Box>
);

  /* ---------- render ---------- */
  const showLoading = planStatus !== "succeeded" || !planDoc;

  return (
    <>
      <Box sx={containerSx}>
        {showLoading ? (
          <Typography>No plan loaded yet.</Typography>
        ) : (
          <>
            <HeaderRow
              isCollapsed={isCollapsed}
              onToggleCollapse={onToggleCollapse}
              planType={planType}
              sessions={sessions}
              dayIdx={dayIdx}
              handleDayChange={handleDayChange}
              progressPct={progressPct}
            />
            {!isCollapsed && <CardColumn />}
          </>
        )}
      </Box>

      {/* ────── How-it-works dialog ────── */}
      <Dialog
        open={hiwOpen}
        onClose={() => setHiwOpen(false)}
        fullWidth
        maxWidth="lg"               /* md → lg (or xl) to kill X-scroll */
        PaperProps={{
          sx: {
            bgcolor: "transparent", // let inner card style itself
      boxShadow: "none",
      overflow: "hidden",     /* ⬅ prevent wrapper scrollbars */
          },
        }}
      >
        <HowItWorks onClose={() => setHiwOpen(false)} />
      </Dialog>
    </>
  );
}

/* =================================================================== */
function HeaderRow({
  isCollapsed,
  onToggleCollapse,
  planType,
  sessions,
  dayIdx,
  handleDayChange,
  progressPct = 0,
}) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        mb: 1,
        height: 32,
      }}
    >
      <IconButton size="small" onClick={onToggleCollapse} sx={{ color: "#fff" }}>
        <MenuIcon />
      </IconButton>

      {!isCollapsed && planType !== "book" && (
        <FormControl variant="standard" sx={{ minWidth: 60 }}>
          <Select
            value={dayIdx}
            onChange={handleDayChange}
            disableUnderline
            sx={{
              fontSize: "0.8rem",
              color: "#fff",
              bgcolor: "#222",
              borderRadius: 1,
              px: 1,
              py: 0.5,
              "& .MuiSelect-icon": { color: "#fff" },
            }}
            MenuProps={{ PaperProps: { sx: { bgcolor: "#222", color: "#fff" } } }}
          >
            {sessions.map((s, i) => (
              <MenuItem key={i} value={i}>
                Day {s.sessionLabel || i + 1}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      {!isCollapsed && <DayProgressCircle pct={progressPct} />}
    </Box>
  );
}