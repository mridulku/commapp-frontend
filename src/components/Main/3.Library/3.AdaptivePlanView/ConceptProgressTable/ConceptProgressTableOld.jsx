/***********************************************************************
 * ConceptProgressTable.jsx
 *
 * — UI identical to before (filters, rows, chips, tool-tips…).
 * — Concepts are fetched from your backend just once on mount.
 * — Weight / Journey / Quiz-history / Confidence / Next-rev
 *   are still placeholder values, generated client-side so
 *   everything renders instantly.
 **********************************************************************/
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";

import useConceptGraph from "../../../7.NewHome/useConceptGraph";



import { Box, FormControl, Select, MenuItem, Typography,
         Table, TableHead, TableRow, TableCell, TableBody,
         Tooltip, Chip, Pagination } from "@mui/material";


import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

import PlanExplainerPanel from "../AdaptPGComponent/AdaptPG2/ExplainerStrips/ConceptMapExplainerStrip";

/* ───────── colour palette (unchanged) ───────── */
const CLR = {
  reading:"#BB86FC", remember:"#80DEEA", understand:"#FFD54F",
  apply:"#AED581",   analyze:"#F48FB1",
  hi:"#66BB6A", med:"#FFA726", low:"#EF5350",
  pass:"#4CAF50", fail:"#E53935", nt:"#999"
};


/* --- universal Pending chip --------------------------------------- */
const pendingChip = (
  <Chip
    size="small"
    label="Pending"
    sx={{
      bgcolor: "#FFA726",        // orange
      color:  "#000",
      fontSize: 11,
      fontWeight: 700,
      "& .MuiChip-label": { px: 0.8 }
    }}
  />
);


/* ───────── Hi / Med / Low helpers (Weight + Conf) ───────── */
const band = v => v==null?"—":v>=67?"High":v>=34?"Med":"Low";
const bandClr = t => t==="High"?CLR.hi:t==="Med"?CLR.med:CLR.low;
const bandChip = v => {
  const txt = band(v);
  return txt==="—" ? "—" :
    <Chip size="small" label={txt}
      sx={{bgcolor:bandClr(txt),color:"#000",fontSize:11,fontWeight:700,
           "& .MuiChip-label":{px:.8}}}/>;
};
const weightChip = bandChip;
const confChip   = bandChip;

/* ───────── Journey badge ───────── */
const STAGES = ["reading","remember","understand","apply","analyze"];
function JourneyCell({stages={}}){
  const cur = STAGES.find(k=>stages[k]==null||stages[k]<100) || "analyze";
  const pct = stages[cur]??0;
  const lbl = stages[cur]==null?"Locked":stages[cur]===100?"Done":`${pct}%`;

  const tip = (
    <Box sx={{fontSize:13}}>
      {STAGES.map(k=>{
        const v = stages[k];
        const txt = v==null?"🔒 locked":v===100?"✅ 100 %":`${v}%`;
        return <div key={k} style={{color:CLR[k]}}>
          <strong style={{textTransform:"capitalize"}}>{k}</strong>: {txt}
        </div>;
      })}
    </Box>
  );

  return (
    <Tooltip arrow title={tip}>
      <Box sx={{display:"inline-flex",alignItems:"center",gap:.5}}>
        <Chip size="small"
          label={`${cur[0].toUpperCase()}${cur.slice(1)} ${lbl}`}
          sx={{bgcolor:CLR[cur],color:"#000",fontSize:11,"& .MuiChip-label":{px:.8}}}/>
        <InfoOutlinedIcon sx={{fontSize:16,color:"#bbb"}}/>
      </Box>
    </Tooltip>
  );
}

/* ───────── Quiz-history cell ───────── */
const Dot = ({ok})=>(
  <Box sx={{
    width:10,height:10,borderRadius:"50%",
    bgcolor: ok==null?CLR.nt : ok?CLR.pass:CLR.fail,
    display:"inline-block"}}/>
);
function HistoryCell({attempts=[]}){
  const last3=[...attempts].slice(-3);
  while(last3.length<3) last3.unshift(null);

  const tip=(<Box sx={{fontSize:13}}>
    {attempts.length===0?"No attempts yet":
      attempts.map((ok,i)=>(<div key={i}>
        Attempt&nbsp;{i+1}: {ok===true?"✅ Pass":ok===false?"❌ Fail":"—"}
      </div>))}
  </Box>);

  return (
    <Tooltip arrow title={tip}>
      <Box sx={{display:"flex",gap:.6,justifyContent:"center"}}>
        {last3.map((ok,i)=><Dot key={i} ok={ok}/>)}
      </Box>
    </Tooltip>
  );
}

/* ───────── helper for Next-revision ───────── */
const daysFromNow = iso => Math.round((new Date(iso)-Date.now())/864e5);

/* ───────── MAIN COMPONENT ───────── */
export default function ConceptProgressTableOld({ userId, onSelect = () => {} }){

/* 1 ▸ grab concepts via the same Firestore hook the explorer uses */
const { concepts: rawConcepts, loading, error } = useConceptGraph();
const concepts = rawConcepts;               // <-- single source of truth

/* 2 ▸ generate placeholder metrics for every concept   */
/* 2 ▸ normalise *once* + add placeholder metrics */
const withMetrics = useMemo(
  () =>
    concepts.map(c => {
      const norm = {
        // --- canonical field names the table expects ---
        subject : c.subject ?? "Uncategorised",
        topic   : c.grouping ?? c.topic ?? "Other",
        chapter : c.chapter  ?? "—",
        subch   : c.subChap  ?? c.subch ?? "—",
        name    : c.name     ?? "(unnamed)",

        // keep everything else the hook gave us
        ...c,
      };

      // --- stub analytics so UI looks filled-out ---
      return {
        ...norm,
        weight      : Math.floor(Math.random() * 100),
        confidence  : Math.floor(Math.random() * 100),
         stages: {
   reading   : 0,     // show “Reading 0 %”
   remember  : null,  // locked
   understand: null,
   apply     : null,
   analyze   : null,
 },
 quizAttempts: [],    // grey dots + “No attempts yet”
        nextRevDate :
          Math.random() < 0.4
            ? new Date(
                Date.now() + (3 + Math.random() * 20) * 864e5
              ).toISOString()
            : null,
      };
    }),
  [concepts]
);

  /* 3 ▸ build filter options out of live data */
  const subjects   = useMemo(()=>[...new Set(concepts.map(c=>c.subject))], [concepts]);
  const [subject ,setSubject ] = useState("__ALL__");
  const [topic   ,setTopic   ] = useState("__ALL__");
  const [chapter ,setChapter ] = useState("__ALL__");
  const [subch   ,setSubch   ] = useState("__ALL__");

  const [page, setPage] = useState(1);      // 1-based index
const rowsPerPage = 20;


  const topicOpt = useMemo(()=>{
    if(subject==="__ALL__") return ["__ALL__"];
    return ["__ALL__", ...new Set(concepts
      .filter(c=>c.subject===subject)
      .map(c=>c.topic))];
  },[concepts,subject]);

  const chapOpt = useMemo(()=>{
    if(subject==="__ALL__"||topic==="__ALL__") return ["__ALL__"];
    return ["__ALL__", ...new Set(concepts
      .filter(c=>c.subject===subject&&c.topic===topic)
      .map(c=>c.chapter))];
  },[concepts,subject,topic]);

  const subOpt = useMemo(()=>{
    if(subject==="__ALL__"||topic==="__ALL__"||chapter==="__ALL__") return ["__ALL__"];
    return ["__ALL__", ...new Set(concepts
      .filter(c=>c.subject===subject&&c.topic===topic&&c.chapter===chapter)
      .map(c=>c.subch))];
  },[concepts,subject,topic,chapter]);

  /* 4 ▸ apply filters */
  const rows = useMemo(()=>withMetrics.filter(c=>
    (subject==="__ALL__" || c.subject === subject)  &&
    (topic  ==="__ALL__" || c.topic   === topic)    &&
    (chapter==="__ALL__" || c.chapter === chapter)  &&
    (subch  ==="__ALL__" || c.subch   === subch)
  ).sort((a,b)=>`${a.subject}|${a.topic}|${a.chapter}|${a.subch}`
                 .localeCompare(`${b.subject}|${b.topic}|${b.chapter}|${b.subch}`))
  ,[withMetrics, subject, topic, chapter, subch]);

  useEffect(() => { setPage(1); }, [subject, topic, chapter, subch]);


  /* 5 ▸ render */
  return (
    <Box sx={{ p:2, color:"#fff", height:"100%", overflow:"auto" }}>
      {/* filters */}
      <Filters {...{
        subjects, subject, setSubject,
        topic, setTopic,
        chapter, setChapter,
        subch, setSubch,
        topicOpt, chapOpt, subOpt
      }}/>

      <PlanExplainerPanel sx={{ mb: 3 }} />

      {loading && <Typography>Loading concepts…</Typography>}
      {error   && <Typography color="error">{error}</Typography>}

      {!loading && rows.length===0 &&
        <Typography>No concepts match the filter.</Typography>}

      {!loading && rows.length>0 &&
        <Table size="small" sx={{bgcolor:"#111"}}>
          <TableHead>
            <TableRow sx={{ position:"sticky", top:0, zIndex:1,
                            bgcolor:"rgba(255,255,255,.05)",
                            backdropFilter:"blur(4px)" }}>
              <Head text="Concept"/>
              <Head text="Wt"           align="center"/>
              <Head text="Journey"      align="center"/>
              <Head text="Quiz Hist."   align="center"/>
              <Head text="Conf"         align="center"/>
              <Head text="Next Rev."    align="center"/>
            </TableRow>
          </TableHead>

          <TableBody>
            {rows
   .slice((page-1)*rowsPerPage, page*rowsPerPage)
   .map((r,i)=>{
    const paged = rows.slice((page-1)*rowsPerPage, page*rowsPerPage);
const prev  = paged[i-1];
              const hdr  = !prev||prev.subject!==r.subject
                         ||prev.topic  !==r.topic
                         ||prev.chapter!==r.chapter
                         ||prev.subch  !==r.subch;

              return (
                <React.Fragment key={`${r.subject}|${r.topic}|${r.chapter}|${r.subch}|${r.name}`}>
                  {hdr && (
                    <TableRow sx={{bgcolor:"#222"}}>
                      <TableCell colSpan={6}
                        sx={{color:"#FFD700",fontWeight:600}}>
                        {`${r.subject} › ${r.topic} › ${r.chapter} › ${r.subch}`}
                      </TableCell>
                    </TableRow>
                  )}

                  <TableRow hover>
                    
                    <TableCell sx={{ color:"#fff" }}>
  <Typography
    component="span"
    sx={{
      cursor: "pointer",
      fontWeight: 500,          // regular weight
      color: "#e0e0e0",         // same grey-white as body text
      "&:hover": {
        color: "#BB86FC",       // only turns violet on hover
        textDecoration: "underline"
      }
    }}
    onClick={() => onSelect(r)}
  >
    {r.name}
  </Typography>
</TableCell>


                    <Cell align="center">{weightChip(r.weight)}</Cell>
                    <TableCell align="center">
                      <JourneyCell stages={r.stages}/>
                    </TableCell>
                    <TableCell align="center">
                      <HistoryCell attempts={r.quizAttempts}/>
                    </TableCell>
                    <TableCell align="center">
  <Tooltip
    arrow
    title="This shows how confident the platform is that you can solve questions on this concept. It will be set after you complete the first reading cycle and a few quizzes."
  >
    <span>{pendingChip}</span>
  </Tooltip>
</TableCell>

                    <TableCell align="center">
  <Tooltip
    arrow
    title="The spaced-revision cycle starts after your first reading and quiz cycle are complete."
  >
    <span>{pendingChip}</span>
  </Tooltip>
</TableCell>

                  </TableRow>
                </React.Fragment>
              );
            })}
          </TableBody>
        </Table>}

        {/* page selector */}
<Box sx={{ display:"flex", justifyContent:"center", mt: 2 }}>
 <Pagination
  count={Math.ceil(rows.length / rowsPerPage)}
  page={page}
  onChange={(_, v) => setPage(v)}
  siblingCount={1}
  boundaryCount={1}
  sx={{
    /* every page / arrow button */
    "& .MuiPaginationItem-root": {
      bgcolor: "rgba(255,255,255,.08)",
      color : "#ccc",
      fontWeight: 600,
      "&:hover": { bgcolor: "rgba(255,255,255,.18)" }
    },
    /* ***** selected (needs BOTH classes) ***** */
    "& .MuiPaginationItem-root.Mui-selected": {
      bgcolor: "#4FC3F7",
      color:  "#000",
      "&:hover": { bgcolor: "#4FC3F7" }        // keep colour on hover
    },
    /* left / right arrows */
    "& .MuiPaginationItem-icon": {
      color: "#ccc"
    }
  }}
/>


</Box>

    </Box>
  );
}

/* ───────── small presentational helpers ───────── */
const Head=({text,align="left"})=>
  <TableCell align={align}
    sx={{color:"#FFD700",fontWeight:700,borderBottom:"2px solid #555"}}>
    {text}
  </TableCell>;

const Cell=({children,align="left"})=>
  <TableCell align={align} sx={{color:"#fff"}}>{children}</TableCell>;

const FilterBox = ({label,value,options,onChange})=>(
  <FormControl variant="standard" sx={{minWidth:140}}>
    <Typography sx={{fontSize:12,mb:.3,color:"#bbb"}}>{label}</Typography>
    <Select value={value} onChange={e=>onChange(e.target.value)} disableUnderline
      sx={{bgcolor:"#222",borderRadius:1,color:"#fff",fontSize:14,px:1,py:0.3,
           "& .MuiSelect-icon":{color:"#fff"}}}
      MenuProps={{PaperProps:{sx:{bgcolor:"#222",color:"#fff"}}}}>
      {options.map(o=><MenuItem key={o} value={o}>
        {o==="__ALL__"?"All":o}
      </MenuItem>)}
    </Select>
  </FormControl>
);

const Filters = (p)=>(
  <Box sx={{display:"flex",gap:2,flexWrap:"wrap",mb:3}}>
    <FilterBox label="Subject" value={p.subject}
      options={["__ALL__",...p.subjects]}
      onChange={v=>{p.setSubject(v);p.setTopic("__ALL__");p.setChapter("__ALL__");p.setSubch("__ALL__");}}/>
    <FilterBox label="Topic"   value={p.topic}   options={p.topicOpt}
      onChange={v=>{p.setTopic(v);p.setChapter("__ALL__");p.setSubch("__ALL__");}}/>
    <FilterBox label="Chapter" value={p.chapter} options={p.chapOpt}
      onChange={v=>{p.setChapter(v);p.setSubch("__ALL__");}}/>
    <FilterBox label="Sub-chapter" value={p.subch} options={p.subOpt}
      onChange={p.setSubch}/>
  </Box>
);
