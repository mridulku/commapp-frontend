// -------------------------------------------------------------
// PlanDropdown.jsx – compact plan switcher for the top bar
// (v8: adds “Create new plan” item at the bottom of the menu)
// -------------------------------------------------------------
import React, { useState } from "react";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";

import {
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Box,
  Tooltip,
  Divider,                 // <-- NEW
} from "@mui/material";

/**
 * @param {string}   selectedId
 * @param {string[]} planIds
 * @param {Object}   metaMap      – key = planId, value = meta object
 * @param {Function} onSelect(id) – select an existing plan
 * @param {Function} onCreate()   – open “new plan” wizard
 */
export default function PlanDropdown({
  selectedId = "",
  planIds = [],
  metaMap = {},
  onSelect = () => {},
  onCreate = () => {},             // <-- NEW
}) {
  /* ---------- local menu state ---------- */
  const [anchorEl, setAnchorEl] = useState(null);
  const menuOpen = Boolean(anchorEl);

  /* ---------- helpers ---------- */
  const toText = (s) =>
    typeof s === "string"
      ? s
      : s?.title || s?.name || s?.subject || s?.label || String(s);

  const makeSummary = (arr = []) => {
    const items = arr.map(toText);
    if (!items.length) return { label: "", tooltip: "" };
    return {
      label:
        items.length === 1 ? items[0] : `${items[0]}  +${items.length - 1} more`,
      tooltip: items.join(", "),
    };
  };

  const selMeta      = metaMap[selectedId] || {};
  const subjSummary  = makeSummary(selMeta.subjects);
  const groupSummary = makeSummary(selMeta.groupings); // kept for future use

  /* ---------- render ---------- */
  return (
    <>
      {/* closed-state button shows plan name + subject summary (with tooltip) */}
      <Button
        size="large"
        variant="text"
        onClick={(e) => setAnchorEl(e.currentTarget)}
        endIcon="▾"
        sx={{
          color: "#fff",
          textTransform: "none",
          fontWeight: 700,
          px: 1,
          "&:hover": { bgcolor: "transparent" },
          justifyContent: "flex-start",
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            lineHeight: 1.2,
          }}
        >
          <span>
            {selMeta.emoji || "📘"}&nbsp;
            {selMeta.name || "Select plan"}
          </span>
          {subjSummary.label && (
            <Tooltip title={subjSummary.tooltip}>
              <span style={{ fontSize: 12, opacity: 0.8 }}>
                {subjSummary.label}
              </span>
            </Tooltip>
          )}
        </Box>
      </Button>

      <Menu
        anchorEl={anchorEl}
        open={menuOpen}
        onClose={() => setAnchorEl(null)}
        PaperProps={{
          sx: { bgcolor: "#1e1e1e", color: "#fff", minWidth: 260 },
        }}
      >
        {/* -------- existing plans -------- */}
        {planIds.map((pid) => {
          const m     = metaMap[pid] || {};
          const subj  = makeSummary(m.subjects);
          const group = makeSummary(m.groupings);

          const subjNode =
            subj.label && (
              <Tooltip title={subj.tooltip}>
                <Box component="span" sx={{ fontSize: 12, color: "#bbbbbb" }}>
                  {subj.label}
                </Box>
              </Tooltip>
            );

          const dailyNode =
            !!m.dailyMin && (
              <Box component="span" sx={{ fontSize: 11, opacity: 0.7 }}>
                ⏰ {m.dailyMin} min/day
              </Box>
            );

          return (
            <MenuItem
              key={pid}
              selected={pid === selectedId}
              onClick={() => {
                onSelect(pid);
                setAnchorEl(null);
              }}
              sx={{ gap: 1 }}
            >
              <ListItemIcon sx={{ minWidth: 26, fontSize: "1.2rem" }}>
                {m.emoji || "📘"}
              </ListItemIcon>

              <ListItemText
                primary={m.name}
                primaryTypographyProps={{ fontSize: 14 }}
                secondary={subjNode || dailyNode}
              />

              {group.label && (
                <Tooltip title={group.tooltip}>
                  <Chip
                    label={group.label}
                    size="small"
                    sx={{
                      height: 18,
                      bgcolor: "#263238",
                      color: "#80cbc4",
                      fontSize: 10,
                      cursor: "default",
                    }}
                  />
                </Tooltip>
              )}
            </MenuItem>
          );
        })}

        {/* -------- divider + create-new entry -------- */}
        <Divider sx={{ my: 0.5, borderColor: "#444" }} />

        <MenuItem
          onClick={() => {
            onCreate();
            setAnchorEl(null);
          }}
          sx={{ gap: 1 }}
        >
          <ListItemIcon sx={{ minWidth: 26 }}>
            <AddCircleOutlineIcon fontSize="small" />
          </ListItemIcon>

          <ListItemText
            primary="Create new plan"
            primaryTypographyProps={{ fontSize: 14 }}
          />
        </MenuItem>
      </Menu>
    </>
  );
}