/* ─────────────────────────────────────────────────────────────
   LeftPanel.jsx – paginated sidebar (3 cards per page, cards
   always full-width; any scrollbar floats transparently)
   ──────────────────────────────────────────────────────────── */
   import React, { useEffect, useMemo, useState } from "react";
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
   
   import useTaskModel      from "./shared/useTaskModel";
   import TaskCard          from "./shared/TaskCard";
   import DayProgressCircle from "./shared/DayProgressCircle";
   
   /* ---------- constants ---------- */
   const CARD_PAGE_SIZE = 2;
   
   /* ---------- outer container ---------- */
   const containerSx = {
     height: "100%",
     bgcolor: "#1A1A1A",
     color: "#fff",
     display: "flex",
     flexDirection: "column",
     p: 1,
     boxSizing: "border-box",
   };
   
   /* ---------- column that may scroll a little on very small screens
                 – scrollbar floats, no dark gutter                  */
   const columnSx = {
     flex: 1,
     overflowY: "auto",
     overflowX: "hidden",
     /* transparent track & slim thumb */
     "&::-webkit-scrollbar":       { width: "6px" },
     "&::-webkit-scrollbar-track": { background: "transparent" },
     "&::-webkit-scrollbar-thumb": { background: "#555", borderRadius: 3 },
     scrollbarWidth: "thin",
     scrollbarColor: "#555 transparent",
   };
   
   /* =================================================================== */
   export default function LeftPanel({ isCollapsed = false, onToggleCollapse }) {
     const dispatch = useDispatch();
     const { planDoc, flattenedActivities, currentIndex, status } = useSelector(
       (s) => s.plan
     );
   
     /* early guard */
     if (status !== "succeeded" || !planDoc)
       return (
         <Box sx={containerSx}>
           <Typography>No plan loaded yet.</Typography>
         </Box>
       );


    



   
     /* ------------ local state ------------ */
     const [dayIdx, setDayIdx] = useState(0);       // adaptive only
     const [page, setPage]     = useState(1);       // pagination (1-based)
     const [autoSync, setAutoSync] = useState(true);



   
     const {
       planType = "adaptive",
       sessions = [],
       subchapterStatusMap = {},
       timeMap = {},
     } = planDoc;
   
     /* keep day selector in sync with central “currentIndex” (adaptive) */
     useEffect(() => {
       if (planType === "book" || !flattenedActivities?.length) return;
       const act = flattenedActivities[currentIndex];
       if (act && typeof act.dayIndex === "number") setDayIdx(act.dayIndex);
     }, [currentIndex, flattenedActivities, planType]);
   
     /* session & tasks */
     const session =
       planType === "book" ? sessions[0] : sessions[dayIdx] || {};
     const tasks = useTaskModel(
       session.activities || [],
       subchapterStatusMap,
       timeMap
     );


     /* ---------- pagination ---------- */
const totalPages = Math.max(1, Math.ceil(tasks.length / CARD_PAGE_SIZE));

useEffect(() => {
  if (page > totalPages) setPage(totalPages);
}, [page, totalPages]);

const pageTasks = useMemo(
  () => tasks.slice((page - 1) * CARD_PAGE_SIZE, page * CARD_PAGE_SIZE),
  [tasks, page]
);

/* auto-flip page when currentIndex jumps to a card on another page */
useEffect(() => {
  if (!autoSync) return;                           // respect manual browse
  const idxInList = tasks.findIndex(
    (t) => t.flatIndex === currentIndex
  );
  if (idxInList === -1) return;                        // not in current list
  const requiredPage = Math.floor(idxInList / CARD_PAGE_SIZE) + 1; // 1-based
  if (requiredPage !== page) setPage(requiredPage);
  }, [currentIndex, tasks, page, autoSync]);

/* on day change reset page to 1 */
const handleDayChange = (e) => {
  setDayIdx(Number(e.target.value));
  setPage(1);
};



   


     
   
     /* ------------ JSX helpers ------------ */
     const CardColumn = () => (
       <Box sx={columnSx}>
         {pageTasks.map((t) => (
           <TaskCard
             key={t.id}
             t={t}
             selected={currentIndex === t.flatIndex}
              onOpen={() => {
                 setAutoSync(true);                      // re-enable auto-sync
                 dispatch(setCurrentIndex(t.flatIndex));
               }}
           />
         ))}
   
    {totalPages > 1 && (
   <Box
     sx={{
       position: "sticky",   // ⬅ keeps it visible
       bottom: 0,
       pt: 1,
       bgcolor: "#1A1A1A",   // background so cards don’t peek through
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
  /* ---------- COLORS ---------- */
  sx={{
    /* numbers + chevron icons */
    "& .MuiPaginationItem-root":  { color: "#fff" },
    "& .MuiPaginationItem-icon":  { color: "#fff" },

    /* selected page */
    "& .MuiPaginationItem-root.Mui-selected": {
      color: "#000",            // text
      bgcolor: "#FFD700",       // gold circle
      "&:hover": { bgcolor: "#ffcc32" },
    },
  }}
/>
           </Box>
         )}
       </Box>
     );
   
     return (
       <Box sx={containerSx}>
         <HeaderRow
           isCollapsed={isCollapsed}
           onToggleCollapse={onToggleCollapse}
           planType={planType}
           sessions={sessions}
           dayIdx={dayIdx}
           handleDayChange={handleDayChange}
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
   
         {!isCollapsed && <DayProgressCircle pct={0} />}
       </Box>
     );
   }