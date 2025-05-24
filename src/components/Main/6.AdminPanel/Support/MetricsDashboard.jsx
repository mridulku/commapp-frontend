// components/Main/6.AdminPanel/Support/MetricsDashboard.jsx
import React from "react";
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Box,
  Chip,
  Grid,
  Stack,
  Typography,
  ThemeProvider,
  createTheme,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { DataGrid } from "@mui/x-data-grid";
import dayjs from "dayjs";

/* ────────────────────────────────────────────────────── */
/*  1) DUMMY DATA  – one row per day / user / stage       */
/*     (replace later with Firestore query)               */
/* ────────────────────────────────────────────────────── */
const dummyData = [
  {
    id: 1,
    user: "learner_A",
    date: "2025-05-23",
    sessions: 2,
    minutes: 60,
    quizzes: 1,
    readings: 2,
    revisions: 1,
    signedUp: "2025-05-20",
  },
  {
    id: 2,
    user: "learner_A",
    date: "2025-05-24",
    sessions: 1,
    minutes: 25,
    quizzes: 0,
    readings: 1,
    revisions: 0,
    signedUp: "2025-05-20",
  },
  {
    id: 3,
    user: "learner_B",
    date: "2025-05-23",
    sessions: 3,
    minutes: 95,
    quizzes: 2,
    readings: 3,
    revisions: 2,
    signedUp: "2025-05-22",
  },
  {
    id: 4,
    user: "learner_C",
    date: "2025-05-23",
    sessions: 0,
    minutes: 0,
    quizzes: 0,
    readings: 0,
    revisions: 0,
    signedUp: "2025-05-23",
  },
];

/* ────────────────────────────────────────────────────── */
/*  2) util – group rows by userId                        */
/* ────────────────────────────────────────────────────── */
function groupByUser(rows) {
  const map = new Map();
  rows.forEach((r) => {
    if (!map.has(r.user)) map.set(r.user, []);
    map.get(r.user).push(r);
  });
  return map;
}

/* ────────────────────────────────────────────────────── */
/*  3) MUI dark theme + DataGrid overrides                */
/* ────────────────────────────────────────────────────── */
const darkTheme = createTheme({
  palette: { mode: "dark" },
  components: {
    MuiDataGrid: {
      styleOverrides: {
        root: { border: "1px solid #333", "--DataGrid-rowHoverBackground": "#222" },
        columnHeaders: { backgroundColor: "#1c1c1c", color: "#e0e0e0" },
        virtualScroller: { backgroundColor: "#111" },
        cell: { borderColor: "#333", color: "#e0e0e0" },
      },
    },
  },
});

/* ────────────────────────────────────────────────────── */
/*  4) Daily-detail DataGrid columns                      */
/* ────────────────────────────────────────────────────── */
const dailyCols = [
  {
    field: "date",
    headerName: "Date",
    flex: 1,
    valueGetter: ({ value }) => dayjs(value).format("MMM DD"),
  },
  { field: "sessions", headerName: "Sessions", flex: 1 },
  { field: "minutes", headerName: "Minutes", flex: 1 },
  { field: "quizzes", headerName: "Quizzes", flex: 1 },
  { field: "readings", headerName: "Readings", flex: 1 },
  { field: "revisions", headerName: "Revisions", flex: 1 },
];

/* ────────────────────────────────────────────────────── */
/*  5) Component                                          */
/* ────────────────────────────────────────────────────── */
export default function MetricsDashboard() {
  /* group rows */
  const grouped = groupByUser(dummyData);

  /* quick global counters */
  const uniqueUsers = grouped.size;
  const totalSessions = dummyData.reduce((a, r) => a + r.sessions, 0);
  const totalMinutes = dummyData.reduce((a, r) => a + r.minutes, 0);
  const totalQuizzes = dummyData.reduce((a, r) => a + r.quizzes, 0);

  const pill = (label) => (
    <Chip
      key={label}
      label={label}
      size="small"
      sx={{ bgcolor: "#263238", color: "#fff", fontWeight: 500 }}
    />
  );

  return (
    <ThemeProvider theme={darkTheme}>
      <Box sx={{ p: 3, bgcolor: "#000", minHeight: "100vh" }}>
        {/* ----- Title & global summary ----- */}
        <Typography variant="h4" sx={{ mb: 2, color: "#fff" }}>
          Metrics dashboard{" "}
          <Typography component="span" sx={{ color: "#888" }}>
            (dummy data)
          </Typography>
        </Typography>
        <Stack direction="row" spacing={1} sx={{ mb: 3 }}>
          {pill(`${uniqueUsers} users`)}
          {pill(`${totalSessions} sessions`)}
          {pill(`${totalMinutes} mins`)}
          {pill(`${totalQuizzes} quizzes`)}
        </Stack>

        {/* ----- one accordion per learner ----- */}
        {[...grouped.entries()].map(([user, rows]) => {
          const sum = (key) => rows.reduce((a, r) => a + r[key], 0);
          const first = rows[0] || {};
          return (
            <Accordion
              key={user}
              disableGutters
              sx={{
                mb: 1,
                bgcolor: "#111",
                border: "1px solid #333",
                "&:before": { display: "none" },
              }}
            >
              {/* ─── Summary row ─── */}
              <AccordionSummary
                expandIcon={<ExpandMoreIcon sx={{ color: "#fff" }} />}
                sx={{ "& .MuiAccordionSummary-content": { m: 0 } }}
              >
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} md={2}>
                    <Chip
                      label={user}
                      size="small"
                      sx={{ bgcolor: "#263238", color: "#80cbc4" }}
                    />
                  </Grid>
                  <Grid item xs={6} md={2}>
                    <Typography>Sessions: {sum("sessions")}</Typography>
                  </Grid>
                  <Grid item xs={6} md={2}>
                    <Typography>Minutes: {sum("minutes")}</Typography>
                  </Grid>
                  <Grid item xs={6} md={2}>
                    <Typography>Quizzes: {sum("quizzes")}</Typography>
                  </Grid>
                  <Grid item xs={6} md={2}>
                    <Typography>Readings: {sum("readings")}</Typography>
                  </Grid>
                  <Grid item xs={6} md={2}>
                    <Typography>Revisions: {sum("revisions")}</Typography>
                  </Grid>
                </Grid>
              </AccordionSummary>

              {/* ─── Detail table ─── */}
              <AccordionDetails sx={{ bgcolor: "#000" }}>
                <Typography sx={{ mb: 1, color: "#ccc" }}>
                  Signed-up on {dayjs(first.signedUp).format("MMM DD, YYYY")}
                </Typography>
                <DataGrid
                  autoHeight
                  rows={rows}
                  columns={dailyCols}
                  pageSize={100}
                  hideFooter
                  disableSelectionOnClick
                />
              </AccordionDetails>
            </Accordion>
          );
        })}
      </Box>
    </ThemeProvider>
  );
}