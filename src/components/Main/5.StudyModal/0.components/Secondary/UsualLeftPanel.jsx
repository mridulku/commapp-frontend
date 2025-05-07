/* ─────────────────────────────────────────────────────────────
   LeftPanel.jsx – paginated sidebar (2 cards per page, cards
   always full-width; any scrollbar floats transparently)
────────────────────────────────────────────────────────────── */
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useSelector, useDispatch } from "react-redux";
import { setCurrentIndex } from "../../../../../store/planSlice";
import {
  Box,
  Typography,
  Select,
  MenuItem,
  FormControl,
  IconButton,
  Pagination,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";

import useTaskModel from "./shared/useTaskModel";   // ← new richer hook
import TaskCard     from "./shared/TaskCard";       // ← full-fat card
import DayProgressCircle from "./shared/DayProgressCircle";

/* ---------- constants ---------- */
const CARD_PAGE_SIZE = 2;

/* ---------- tiny in-memory caches so we never re-download a doc ---------- */
const timeCache      = {};   // { activityId   : seconds }
const subStatusCache = {};   // { subChapterId : {...}  }

/* ---------- outer container ---------- */
const containerSx = {
  height: "100%",
  bgcolor: "#1A1A1A",
  color:   "#fff",
  display: "flex",
  flexDirection: "column",
  p: 1,
  boxSizing: "border-box",
};

/* ---------- scrollable column; scrollbar floats transparently ---------- */
const columnSx = {
  flex: 1,
  overflowY: "auto",
  overflowX: "hidden",
  "&::-webkit-scrollbar":       { width: "6px" },
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
  const userId   = useSelector((s) => s.auth?.userId);
  const planId   = planDoc?.id;

  /* early guard */
  if (planStatus !== "succeeded" || !planDoc) {
    return (
      <Box sx={containerSx}>
        <Typography>No plan loaded yet.</Typography>
      </Box>
    );
  }

  /* ---------- local UI state ---------- */
  const [dayIdx,   setDayIdx]   = useState(0);   // adaptive only
  const [page,     setPage]     = useState(1);   // pagination (1-based)
  const [autoSync, setAutoSync] = useState(true);

  /* ---------- plan fields ---------- */
  const { planType = "adaptive", sessions = [] } = planDoc;
  const rawSession = planType === "book" ? sessions[0] : sessions[dayIdx] || {};
  const rawActs    = rawSession.activities || [];

  /* ---------- aggregator maps (lazy-filled) ---------- */
  const [timeMap, setTimeMap] = useState(() => ({ ...(planDoc.timeMap || {}) }));
  const [subStatusMap, setSubStatusMap] = useState(() => ({
    ...(planDoc.subchapterStatusMap || {}),
  }));

  /* ---------- build task models ---------- */
  const tasks = useTaskModel(rawActs, subStatusMap, timeMap);

  /* ---------- day selector stays in sync with central index ---------- */
  useEffect(() => {
    if (planType === "book" || !flattenedActivities?.length) return;
    const act = flattenedActivities[currentIndex];
    if (act && typeof act.dayIndex === "number") setDayIdx(act.dayIndex);
  }, [currentIndex, flattenedActivities, planType]);

  /* ---------- pagination helpers ---------- */
  const totalPages = Math.max(1, Math.ceil(tasks.length / CARD_PAGE_SIZE));

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const pageTasks = useMemo(
    () => tasks.slice((page - 1) * CARD_PAGE_SIZE, page * CARD_PAGE_SIZE),
    [tasks, page]
  );

  /* auto-flip page when someone clicks a card in another page */
  useEffect(() => {
    if (!autoSync) return;
    const idxInList = tasks.findIndex((t) => t.flatIndex === currentIndex);
    if (idxInList === -1) return;
    const needPage = Math.floor(idxInList / CARD_PAGE_SIZE) + 1; // 1-based
    if (needPage !== page) setPage(needPage);
  }, [currentIndex, tasks, page, autoSync]);

  const handleDayChange = (e) => {
    setDayIdx(Number(e.target.value));
    setPage(1);
  };

  /* ================================================================
     LAZY AGGREGATOR FETCH  –  only for cards visible on *this* page
  ================================================================ */
  useEffect(() => {
    if (!flattenedActivities?.length) return;

    pageTasks.forEach(async (t) => {
      const rawAct = flattenedActivities[t.flatIndex];
      if (!rawAct) return;

      const { subChapterId, type = "" } = rawAct;
      const activityId = t.id;

      /* ---- (A) time spent ------------------------------------ */
      if (activityId && timeCache[activityId] == null) {
        try {
          const apiType = type.toLowerCase().includes("read") ? "read" : "quiz";
          const { data } = await axios.get(
            `${import.meta.env.VITE_BACKEND_URL}/api/getActivityTime`,
            { params: { activityId, type: apiType } }
          );
          timeCache[activityId] = data?.totalTime || 0;
        } catch {
          timeCache[activityId] = 0;
        }
        setTimeMap((m) => ({ ...m, [activityId]: timeCache[activityId] }));
      }

      /* ---- (B) sub-chapter status ---------------------------- */
      if (subChapterId && subStatusCache[subChapterId] == null) {
        try {
          const { data } = await axios.get(
            `${import.meta.env.VITE_BACKEND_URL}/subchapter-status`,
            { params: { userId, planId, subchapterId: subChapterId } }
          );
          subStatusCache[subChapterId] = data || {};
        } catch {
          subStatusCache[subChapterId] = {};
        }
        setSubStatusMap((s) => ({
          ...s,
          [subChapterId]: subStatusCache[subChapterId],
        }));
      }
    });
  }, [pageTasks, flattenedActivities, userId, planId]);

  /* ---------- helpers ---------- */
  const progressPct =
    tasks.length > 0
      ? Math.round(
          (tasks.filter((t) => t.status === "completed").length / tasks.length) *
            100
        )
      : 0;

  const CardColumn = () => (
    <Box sx={columnSx}>
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

      {totalPages > 1 && (
        <Box
          sx={{
            position: "sticky",
            bottom: 0,
            pt: 1,
            bgcolor: "#1A1A1A",
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
              "& .MuiPaginationItem-root": { color: "#fff" },
              "& .MuiPaginationItem-icon": { color: "#fff" },
              "& .MuiPaginationItem-root.Mui-selected": {
                color: "#000",
                bgcolor: "#FFD700",
                "&:hover": { bgcolor: "#ffcc32" },
              },
            }}
          />
        </Box>
      )}
    </Box>
  );

  /* ---------- render ---------- */
  return (
    <Box sx={containerSx}>
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
    </Box>
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