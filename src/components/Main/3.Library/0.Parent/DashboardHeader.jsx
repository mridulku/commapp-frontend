// -------------------------------------------------------------
// CompactDashboardHeader.jsx   – v4 (dark-theme + KPI pills)
// -------------------------------------------------------------
import React from "react";
import {
  Box,
  Typography,
  Stack,
  Tooltip,
  Button,
  Chip,          // still handy for other bits
} from "@mui/material";

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
  const pillSx = {
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
  };

  const valueSx = { fontWeight: 700, fontSize: 14, color: "#fff" };
  const labelSx = { fontSize: 12, color: "#aaa" };

  /* ---------- render ---------- */
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
        flexWrap: "wrap",           // so items don’t overflow on narrow widths
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
            Resume
          </Button>
        )}
      </Typography>

      {/* centre – KPI pills */}
      <Stack
        direction="row"
        spacing={1.5}
        useFlexGap
        sx={{ flexWrap: "wrap", ml: 4, flexGrow: 1 }}
      >
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