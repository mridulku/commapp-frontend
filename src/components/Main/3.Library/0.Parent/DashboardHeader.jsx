// -------------------------------------------------------------
// CompactDashboardHeader.jsx – v5 (adds Stage pill w/ dropdown)
// -------------------------------------------------------------
import React, { useState } from "react";
import {
  Box,
  Typography,
  Stack,
  Tooltip,
  Button,
  Chip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";

import TrackChangesIcon from "@mui/icons-material/TrackChanges";
import CheckIcon        from "@mui/icons-material/Check";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import ClearIcon        from "@mui/icons-material/Clear";

/** Hard-coded stage meta (swap later if you wire real data) */
const CURRENT_STAGE = 1;
const STAGES = [
  { num: 1, title: "Diagnosis" },
  { num: 2, title: "Deep Dive" },
  { num: 3, title: "Mastery"   },
];

/**
 * @param {ReactNode} planName – usually a <PlanDropdown/>
 * @param {Array}     kpis     – [{ icon, value, label }]
 * @param {string}    bg       – bar background colour
 * @param {string}    textColor– primary text colour
 * @param {Function}  onResume – (optional) callback for the Resume button
 */
export default function DashboardHeader({
  planName,
  kpis = [],
  bg = "#111",
  textColor = "#fff",
  onResume = null,
}) {
  /* ---------- pill styling for KPIs ---------- */
  const pillSx  = {
    display: "flex",
    alignItems: "center",
    gap: 0.75,
    px: 1.5,
    py: 0.5,
    bgcolor: "#1e1e1e",
    border: "1px solid #2c2c2c",
    borderRadius: 2,
    minWidth: 90,
    whiteSpace: "nowrap",
    cursor: "default",
  };
  const valueSx = { fontWeight: 700, fontSize: 14, color: "#fff" };
  const labelSx = { fontSize: 12,   color: "#aaa" };

  return (
    <Box
      sx={{
        px: 3,
        py: 1,
        bgcolor: bg,
        color: textColor,
        display: "flex",
        alignItems: "center",
        gap: 3,
        borderBottom: "1px solid #222",
        minHeight: 56,
        flexWrap: "wrap",
      }}
    >
      {/* left – plan selector + resume */}
      <Typography
        component="div"
        variant="h5"
        sx={{ fontWeight: 700, display: "flex", alignItems: "center" }}
      >
        {planName}

        {onResume && (
          <Button
            variant="contained"
            size="small"
            disableElevation
            sx={{
              ml: 1,
              bgcolor: "#FFD700",
              color: "#000",
              fontWeight: 700,
              minWidth: 80,
              "&:hover": { bgcolor: "#FFD700" },
            }}
            onClick={onResume}
          >
            Start Learning
          </Button>
        )}
      </Typography>

      {/* centre – Stage pill + KPI pills */}
      <Stack
        direction="row"
        spacing={1.5}
        useFlexGap
        sx={{ flexWrap: "wrap", ml: 4, flexGrow: 1 }}
      >
        {/* 0️⃣ Stage pill */}
        <StageChip />

        {/* Existing KPI pills */}
        {kpis.map((m) => (
          <Box key={m.label} sx={pillSx}>
            <span>{m.icon}</span>
            <Typography component="span" sx={valueSx}>
              {m.value}
            </Typography>
            <Typography component="span" sx={labelSx}>
              {m.label}
            </Typography>
          </Box>
        ))}
      </Stack>

      {/* right – reserved for future icons / avatar */}
    </Box>
  );
}

/* ------------------------------------------------------------------ */
/* StageChip component                                                 */
/* ------------------------------------------------------------------ */
/* StageChip – aligned, readable, explicit                            */
/* ------------------------------------------------------------------ */
/* StageChip – scoped ‘isCurrent’ + vivid locked red                  */
function StageChip() {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleOpen  = (e) => setAnchorEl(e.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const LOCKED_RED = "#ff5252";   // bright red for locked stages

  return (
    <>
      <Chip
        icon={<TrackChangesIcon sx={{ fontSize: 18 }} />}
        label="Current • Stage 1 · Diagnosis"
        size="small"
        onClick={handleOpen}
        sx={{
          height: 28,
          bgcolor: "#BB86FC",
          color: "#000",
          fontWeight: 700,
          cursor: "pointer",
          "& .MuiChip-label": { px: 0.75, fontSize: 14 },
          "&:hover": { bgcolor: "#A57BF7", color: "#000" },
        }}
      />

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{ dense: true }}
        sx={{
          "& .MuiPaper-root": {
            bgcolor: "#222",
            color: "#fff",
            minWidth: 220,
          },
        }}
      >
       {STAGES.map((s) => {
  const isCurrent = s.num === CURRENT_STAGE;
  const LOCKED_RED = "#ff5252";
  const WIP_YELLOW = "#ffc107";       // Material amber

  return (
    <MenuItem
      key={s.num}
      disabled={!isCurrent}
      sx={
        !isCurrent
          ? { opacity: 1, pointerEvents: "none" }  // bright but locked
          : {}
      }
    >
      <ListItemIcon
        sx={{
          minWidth: 32,
          color: isCurrent ? WIP_YELLOW : LOCKED_RED,
        }}
      >
        {isCurrent ? <HourglassEmptyIcon /> : <ClearIcon />}
      </ListItemIcon>

      <ListItemText
        primary={`Stage ${s.num} — ${s.title}`}
        sx={!isCurrent ? { color: LOCKED_RED } : {}}
      />
    </MenuItem>
  );
})}

      </Menu>
    </>
  );
}
