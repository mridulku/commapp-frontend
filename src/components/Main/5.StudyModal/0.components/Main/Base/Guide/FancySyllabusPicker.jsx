// -----------------------------------------------------------------------------
// File: FancySyllabusPicker.jsx   (v8 – objects for chapters, auto-lock)
// -----------------------------------------------------------------------------
import React, { useState, useEffect } from "react";
import {
  Box, Card, CardActionArea, CardContent, Typography,
  Collapse, Checkbox, IconButton, Grid, Chip, alpha
} from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import CheckIcon   from "@mui/icons-material/CheckCircle";
import { motion }  from "framer-motion";

const MotionCard = motion(Card);
const g = ([a,b]) => `linear-gradient(135deg,${a} 0%,${b} 100%)`;
const ACCENT = "#BB86FC";

/* ------------------------------------------------------------------ */
/*  PROPS
      data   : [{ subject, icon, buckets:[{id,label,grad,comingSoon?,chapters:[{id,name}]}] }]
      value  : Set<chapterId>
      onChange(newSet)
   ------------------------------------------------------------------ */
export default function FancySyllabusPicker({ data=[], value=new Set(), onChange, showSubjectHeader = true   }) {

  /* local <Set> copy so we can tick/untick instantly ------------- */
  const [sel,setSel] = useState(new Set(value));
  useEffect(()=>setSel(new Set(value)),[value]);

  /* helper fns ---------------------------------------------------- */
  const bucketActive   = b => b.chapters?.some(c => sel.has(c.id));
  const bucketFull     = b => b.chapters?.every(c => sel.has(c.id));
  const bucketSubtitle = b => {
    const selCnt = b.chapters.filter(c=>sel.has(c.id)).length;
    const tot    = b.chapters.length;
    if (selCnt===0) return `${tot} chapter${tot!==1?"s":""}`;
    return `${selCnt} chapter${selCnt!==1?"s":""}`;
  };

  /* mutate selection --------------------------------------------- */
  const setFrom = newSet => {
    setSel(new Set(newSet));
    onChange && onChange(new Set(newSet));
  };

  const toggleBucket = b => {
    if (b.comingSoon) return;
    const next = new Set(sel);
    if (bucketActive(b)) b.chapters.forEach(c=>next.delete(c.id));
    else                 b.chapters.forEach(c=>next.add(c.id));
    setFrom(next);
  };

  const toggleChap = (b,chap) => {
    const next = new Set(sel);
    next.has(chap.id) ? next.delete(chap.id) : next.add(chap.id);
    setFrom(next);
  };

  /* UI ------------------------------------------------------------ */
  const [openId,setOpenId] = useState(null);

  return (
    <Box>
      {data.map(sub=>(
        <Box key={sub.subject} sx={{mb:5}}>
                    {showSubjectHeader && (              /* ▸ only when allowed */
            <Typography
              variant="h6"
              sx={{ fontWeight: 700, mb: 1.5, display: "flex",
                   alignItems: "center", gap: 1 }}
            >
              <span style={{ fontSize: 22 }}>{sub.icon}</span>
              {sub.subject}
            </Typography>
          )}

          <Grid container spacing={2}>
            {sub.buckets.map(b=>{
              const active = bucketActive(b);
              const dim    = !active && !b.comingSoon;
              const overlay= b.comingSoon ? alpha("#000",.6)
                          : dim          ? alpha("#000",.45)
                                         : "transparent";
              const expanded = openId===b.id;

              return (
                <Grid item xs={12} sm={6} md={4} key={b.id}>
                  <MotionCard
                    whileHover={!b.comingSoon&&dim?{y:-4,boxShadow:"0 12px 28px rgba(0,0,0,.6)"}:{}}
                    sx={{
                      position:"relative",borderRadius:3,overflow:"hidden",
                      background:g(b.grad),
                      boxShadow: active
                        ?`0 0 0 3px ${ACCENT},0 4px 18px rgba(0,0,0,.6)`
                        :"0 4px 14px rgba(0,0,0,.35)",
                      transition:".25s",
                      filter:b.comingSoon?"grayscale(60%)":"none"
                    }}
                  >
                    <CardActionArea onClick={()=>toggleBucket(b)}>
                      <Box sx={{position:"relative","&:before":{
                        content:'""',position:"absolute",inset:0,background:overlay}}}>
                        <CardContent sx={{position:"relative"}}>
                          <Typography sx={{fontWeight:700,color:active?"#000":"#fff"}}>
                            {b.label}
                          </Typography>
                          {b.chapters?.length>0 &&
                            <Typography variant="caption"
                              sx={{color:active?"#000":"#f0f0f0"}}>
                              {bucketSubtitle(b)}
                            </Typography>}
                        </CardContent>
                      </Box>
                    </CardActionArea>

                    {active &&
                      <CheckIcon sx={{
                        position:"absolute",top:8,right:8,fontSize:22,color:"#4ade80"}}/>}

                    {b.comingSoon &&
                      <Chip label="Coming soon" size="small" sx={{
                        position:"absolute",top:8,right:8,bgcolor:alpha("#000",.55),
                        color:"#eee",fontWeight:600 }} />}

                    {b.chapters?.length>0 && !b.comingSoon &&
                      <IconButton size="small"
                        onClick={e=>{e.stopPropagation();setOpenId(o=>o===b.id?null:b.id);}}
                        sx={{position:"absolute",bottom:6,right:6,bgcolor:alpha("#000",.5),
                             color:"#fff","&:hover":{bgcolor:alpha("#000",.7)},
                             transform:expanded?"rotate(180deg)":"none",transition:".3s"}}>
                        <KeyboardArrowDownIcon sx={{fontSize:22}}/>
                      </IconButton>}

                    <Collapse in={expanded} unmountOnExit>
                      <Box sx={{p:2,pt:0,background:g(b.grad)}}>
                        {b.chapters.map(ch=>(
                          <Box key={ch.id}
                            sx={{display:"flex",alignItems:"center",gap:1,mb:.5,color:"#fff"}}>
                            <Checkbox size="small"
                              checked={sel.has(ch.id)}
                              onChange={()=>toggleChap(b,ch)}
                              sx={{p:.5,color:"#fff"}}/>
                            <Typography variant="caption">{ch.name}</Typography>
                          </Box>
                        ))}
                      </Box>
                    </Collapse>
                  </MotionCard>
                </Grid>
              );
            })}
          </Grid>
        </Box>
      ))}
    </Box>
  );
}