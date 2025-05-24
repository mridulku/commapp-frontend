/*  File: CostDashboard.jsx
    Very-first, lightweight OpenAI cost dashboard
    -------------------------------------------------------------- */

import React, { useEffect, useState, useMemo } from "react";
import {
  collection,
  getDocs,
  query,
  where,
  Timestamp,
} from "firebase/firestore";
import { db } from "../../../../firebase";          // ← adjust relative path
import {
  Box, Typography, Table, TableHead, TableBody,
  TableRow, TableCell, Paper, CircularProgress
} from "@mui/material";

/* ------------ tiny helpers ------------ */
function fmtUSD(n)    { return `$${n.toFixed(4)}`; }
function fmtTokens(n) { return n.toLocaleString(); }

/* ------------ main component ---------- */
export default function CostDashboard({ sinceDays = 30 }) {
  const [loading, setLoading] = useState(true);
  const [rows, setRows]       = useState([]);      // raw docs

  /* 1️⃣  fetch once on mount */
  useEffect(() => {
    async function fetchUsage() {
      setLoading(true);
      try {
        const since = Timestamp.fromDate(
          new Date(Date.now() - sinceDays * 864e5)
        );
        const snap = await getDocs(
          query(
            collection(db, "usage_events"),
            where("ts", ">=", since)
          )
        );
        const arr = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setRows(arr);
      } catch (err) { console.error("[CostDashboard] fetch →", err); }
      setLoading(false);
    }
    fetchUsage();
  }, [sinceDays]);

  /* 2️⃣  aggregates are recomputed whenever rows change */
  const { totals, byModel, byUser } = useMemo(() => {
    const blank = { calls:0, pTok:0, cTok:0, usd:0 };
    const t   = { ...blank };
    const mod = {};
    const usr = {};

    rows.forEach(r => {
      const pTok = r.prompt_tokens     ?? 0;
      const cTok = r.completion_tokens ?? 0;
      const usd  = r.cost_usd          ?? 0;
      const mdl  = r.model             ?? "unknown";
      const uid  = r.userId            ?? "unknown";

      /* global totals */
      t.calls++; t.pTok+=pTok; t.cTok+=cTok; t.usd+=usd;

      /* per-model */
      mod[mdl] ??= { model: mdl, ...blank };
      mod[mdl].calls++; mod[mdl].pTok+=pTok; mod[mdl].cTok+=cTok; mod[mdl].usd+=usd;

      /* per-user */
      usr[uid] ??= { userId: uid, ...blank };
      usr[uid].calls++; usr[uid].pTok+=pTok; usr[uid].cTok+=cTok; usr[uid].usd+=usd;
    });

    return {
      totals : t,
      byModel: Object.values(mod).sort((a,b)=>b.usd-a.usd),
      byUser : Object.values(usr).sort((a,b)=>b.usd-a.usd),
    };
  }, [rows]);

  /* 3️⃣  render */
  if (loading)
    return (
      <Box sx={{ p:4, textAlign:"center" }}>
        <CircularProgress /><br/>
        <Typography sx={{ mt:2 }}>Loading OpenAI usage…</Typography>
      </Box>
    );

  return (
    <Box sx={{ p:4 }}>
      <Typography variant="h5" gutterBottom>
        OpenAI Spend (last {sinceDays} day{sinceDays!==1 && "s"})
      </Typography>

      {/* --- overall totals --- */}
      <Paper sx={{ p:2, mb:4 }}>
        <Typography variant="subtitle1">Totals</Typography>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Calls</TableCell>
              <TableCell>Prompt&nbsp;tokens</TableCell>
              <TableCell>Completion&nbsp;tokens</TableCell>
              <TableCell>Cost&nbsp;USD</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell>{totals.calls}</TableCell>
              <TableCell>{fmtTokens(totals.pTok)}</TableCell>
              <TableCell>{fmtTokens(totals.cTok)}</TableCell>
              <TableCell>{fmtUSD(totals.usd)}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Paper>

      {/* --- breakdown by model --- */}
      <Paper sx={{ p:2, mb:4 }}>
        <Typography variant="subtitle1">By model</Typography>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Model</TableCell>
              <TableCell>Calls</TableCell>
              <TableCell>Prompt</TableCell>
              <TableCell>Completion</TableCell>
              <TableCell>USD</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {byModel.map(m => (
              <TableRow key={m.model}>
                <TableCell>{m.model}</TableCell>
                <TableCell>{m.calls}</TableCell>
                <TableCell>{fmtTokens(m.pTok)}</TableCell>
                <TableCell>{fmtTokens(m.cTok)}</TableCell>
                <TableCell>{fmtUSD(m.usd)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      {/* --- breakdown by user --- */}
      <Paper sx={{ p:2 }}>
        <Typography variant="subtitle1">By user</Typography>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>User&nbsp;ID</TableCell>
              <TableCell>Calls</TableCell>
              <TableCell>Prompt</TableCell>
              <TableCell>Completion</TableCell>
              <TableCell>USD</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {byUser.map(u => (
              <TableRow key={u.userId}>
                <TableCell sx={{ fontFamily:"monospace" }}>{u.userId}</TableCell>
                <TableCell>{u.calls}</TableCell>
                <TableCell>{fmtTokens(u.pTok)}</TableCell>
                <TableCell>{fmtTokens(u.cTok)}</TableCell>
                <TableCell>{fmtUSD(u.usd)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
}