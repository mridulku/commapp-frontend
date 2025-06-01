/* ───────────── DEV toolbar ───────────── */
import React, { useState }   from "react";
import axios                 from "axios";
import { useDispatch }       from "react-redux";
import { setPlanDoc } from "../../../../../../store/planSlice";
import {
  Chip, Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Box, Typography
} from "@mui/material";

const backendURL=import.meta.env.VITE_BACKEND_URL;

/**
 * Show only when `showDevRebalance` prop is true (see usage below)
 */
export default function DevRebalanceTool({ planId, userId, defaultTodayISO, onCloseDialog }) {
  const dispatch = useDispatch();



  /* floating chip state */
  const [dlgOpen, setDlgOpen] = useState(false);
  const [todayISO, setTodayISO] = useState(defaultTodayISO);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const handleRun = async () => {
    try {
      setBusy(true); setMsg("Running …");
      const { data } = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/rebalancePlan`, {
        planId,
        userId,
        todayISO           // “pretend it is this day now”
      });

      if (data?.plan) {                     // ← API already returns the plan
        dispatch(setPlanDoc({ ...data.plan, id: planId }));
        setMsg("✅  Plan updated & pushed to Redux");
      } else {
        // fallback: hit normal fetch-plan route
        const res = await axios.get("/api/adaptive-plan", { params:{ planId } });
        dispatch(setPlanDoc({ ...res.data.planDoc, id: planId }));
        setMsg("✅  Rebalanced – fresh plan fetched");
      }
    } catch (err) {
      console.error(err);
      setMsg(`❌  ${err.response?.data?.error || err.message}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      {/* floating chip top-right */}
      <Chip
        label="🔧 Rebalance"
        size="small"
        onClick={() => setDlgOpen(true)}
        sx={{
          position:"fixed", top:90, right:16, zIndex:2000,
          bgcolor:"#424242", color:"#fff", cursor:"pointer",
          "&:hover":{ bgcolor:"#616161" }
        }}
      />

      {/* modal */}
      <Dialog open={dlgOpen} onClose={()=>setDlgOpen(false)}>
        <DialogTitle>DEV Rebalance Run</DialogTitle>
        <DialogContent sx={{display:"flex",flexDirection:"column",gap:2,pt:1}}>
          <TextField
            label='Pretend today is'
            type='date'
            value={todayISO}
            onChange={e=>setTodayISO(e.target.value)}
            sx={{ mt:1 }}
            InputLabelProps={{shrink:true}}
          />
          {msg && <Typography variant="body2">{msg}</Typography>}
        </DialogContent>
        <DialogActions>
          <Button onClick={()=>setDlgOpen(false)} disabled={busy}>Close</Button>
          <Button variant="contained" onClick={handleRun} disabled={busy}>
            {busy ? "Running…" : "Run"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}