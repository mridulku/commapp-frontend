/***********************************************************************
 * ConceptProgressTable.jsx – v15
 * --------------------------------------------------------------------
 * • On first mount the 1st sub-chapter is selected automatically.
 * • If the current scope would render >400 concept rows we first
 *   display a “Loading concepts…” spinner for one animation frame.
 ***********************************************************************/

import React, {
  useEffect, useMemo, useState, useLayoutEffect, useRef
} from "react";
import { useDispatch, useSelector }            from "react-redux";
import {
  fetchSubSummary,
} from "../../../../../../store/planSummarySlice";
import { selectSubChList }                     from "../../../../../../store/planSlice";

import {
  Box, Typography, FormControl, Select, MenuItem,
  Table, TableHead, TableRow, TableCell, TableBody,
  Chip, Tooltip, LinearProgress, CircularProgress
} from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

/* ───────────── palette ───────────── */
const CLR = {
  reading:"#BB86FC", remember:"#80DEEA", understand:"#FFD54F",
  apply:"#AED581",   analyze:"#F48FB1",
  hi:"#66BB6A", med:"#FFA726", low:"#EF5350",
  pass:"#4CAF50", fail:"#E53935", nt:"#888",
  lock:"#c62828", done:"#2e7d32", dark:"#444"
};
const STAGES = ["reading","remember","understand","apply","analyze"];

/* tiny chip ---------------------------------------------------------- */
const ChipTiny=({label,bg="#444",color="#fff"})=>(
  <Chip size="small" label={label}
        sx={{bgcolor:bg,color,fontSize:11,m:0.15,"& .MuiChip-label":{px:.8}}}/>
);

/* Journey pill ------------------------------------------------------- */
function JourneyPill({ pct }){
  const state={}, cur=(()=>{let g=true,c="analyze";
    STAGES.forEach(st=>{
      const v=pct[st];
      if(st==="reading"){const r=v??0;state[st]=r===100?100:r;g=r===100;return;}
      if(!g){state[st]="LOCKED";return;}
      if(v==null){state[st]=0;g=false;}
      else if(v>=100){state[st]=100;}
      else{state[st]=v;g=false;}
      if(state[st]!=="LOCKED"&&state[st]<100) c=st;
    });return c;
  })();
  const lbl=state[cur]==="LOCKED"?"Locked":state[cur]===100?"Done":`${state[cur]}%`;
  const tip=(<Box sx={{fontSize:13}}>
    {STAGES.map(k=>{
      const v=state[k],t=v==="LOCKED"?"🔒 locked":v===100?"✅ 100 %":`${v}%`;
      return <div key={k} style={{color:CLR[k]}}>
        <strong style={{textTransform:"capitalize"}}>{k}</strong>: {t}
      </div>;
    })}
  </Box>);
  return(
    <Tooltip arrow title={tip}>
      <Box sx={{display:"inline-flex",alignItems:"center",gap:.6}}>
        <ChipTiny label={`${cur[0].toUpperCase()}${cur.slice(1)} ${lbl}`}
                  bg={CLR[cur]} color="#000"/>
        <InfoOutlinedIcon sx={{fontSize:16,color:"#bbb"}}/>
      </Box>
    </Tooltip>
  );
}

/* status chip -------------------------------------------------------- */
function statusChip({stage,readingDone,res}){
  if(!readingDone)    return <ChipTiny label="📖 Reading…" bg={CLR.reading} color="#000"/>;
  if(stage==="done")  return <ChipTiny label="🎉 Done"     bg={CLR.done}    color="#000"/>;
  if(res==="PASS")    return <ChipTiny label="✅"          bg={CLR.apply}   color="#000"/>;
  if(res==="FAIL")    return <ChipTiny label="❌"          bg={CLR.lock}    color="#fff"/>;
  return <ChipTiny label="—" bg={CLR.dark}/>;
}

/* static placeholders ------------------------------------------------ */
const weightChip=<ChipTiny label="Med"  bg={CLR.med} color="#000"/>;
const confChip  =<ChipTiny label="High" bg={CLR.hi}  color="#000"/>;
const HistDots  =()=>(
  <Tooltip arrow title={<Box sx={{fontSize:13,lineHeight:1.4}}>
     Attempt&nbsp;1&nbsp;: ✅<br/>Attempt&nbsp;2&nbsp;: ✅
  </Box>}>
    <Box sx={{display:"flex",gap:.6,justifyContent:"center"}}>
      {[0,1,2].map(i=>
        <Box key={i} sx={{width:10,height:10,borderRadius:"50%",bgcolor:CLR.pass}}/>
      )}
    </Box>
  </Tooltip>
);

/* helpers ------------------------------------------------------------ */
const pctFromStats=s=>{
  const vals=Object.values(s||{}); if(!vals.length) return null;
  return Math.round(vals.filter(v=>v==="PASS").length/vals.length*100);
};
const conceptNamesFromSummary=s=>{
  if(!s?.conceptStats) return [];
  const first = s.conceptStats.remember
             || s.conceptStats.understand
             || s.conceptStats.apply
             || s.conceptStats.analyze
             || {};
  return Object.keys(first).sort((a,b)=>a.localeCompare(b));
};

/* main component ----------------------------------------------------- */
export default function ConceptProgressTable(){

  const dispatch   = useDispatch();
  const planId     = useSelector(s=>s.plan.planDoc?.id);
  const allSubs    = useSelector(selectSubChList);
  const summaries  = useSelector(s=>s.planSummary.entities);

  /* ---------- auto-pick first sub on first load ---------- */
  const firstPickDone = useRef(false);
  useEffect(()=>{
    if(firstPickDone.current) return;
    if(allSubs.length){
      const first = allSubs[0];
      setBook(first.book); setSubject(first.subject);
      setGrouping(first.grouping); setChapter(first.chapter);
      setSubId(first.subChapterId);
      firstPickDone.current = true;
    }
  },[allSubs]);

  /* filters ------------------------------------------------ */
  const [book,setBook]         = useState("__ALL__");
  const [subject,setSubject]   = useState("__ALL__");
  const [grouping,setGrouping] = useState("__ALL__");
  const [chapter,setChapter]   = useState("__ALL__");
  const [subId,setSubId]       = useState("__ALL__");

  const match=(w,v)=>w==="__ALL__"||w===v;
  const books     = useMemo(()=>Array.from(new Set(allSubs.map(s=>s.book))),[allSubs]);
  const subjects  = useMemo(()=>Array.from(new Set(allSubs.filter(s=>match(book ,s.book))
                                                           .map(s=>s.subject))),[book,allSubs]);
  const groupings = useMemo(()=>Array.from(new Set(allSubs.filter(s=>match(book ,s.book)
                                                                   && match(subject,s.subject))
                                                         .map(s=>s.grouping))),[book,subject,allSubs]);
  const chapters  = useMemo(()=>Array.from(new Set(allSubs.filter(s=>match(book ,s.book)
                                                                   && match(subject,s.subject)
                                                                   && match(grouping,s.grouping))
                                                         .map(s=>s.chapter))),[book,subject,grouping,allSubs]);
  const subs      = useMemo(()=>allSubs.filter(s=>match(book ,s.book)
                                            && match(subject,s.subject)
                                            && match(grouping,s.grouping)
                                            && match(chapter ,s.chapter)),[book,subject,grouping,chapter,allSubs]);

  const rows = useMemo(()=>{
    if(subId!=="__ALL__"){
      const sub = subs.find(s=>s.subChapterId===subId);
      return sub ? [sub] : [];
    }
    return subs;
  },[subs,subId]);

  /* fetch needed summaries --------------------------------- */
  useEffect(()=>{
    if(!planId) return;
    rows.forEach(r=>{
      if(!summaries?.[r.subChapterId])
        dispatch(fetchSubSummary({planId,subId:r.subChapterId}));
    });
  },[rows,planId,summaries,dispatch]);

  /* wait until summaries present */
  const ready = rows.every(r=>!!summaries?.[r.subChapterId]);

  /* ---------- build concept rows ---------- */
  const conceptRows = ready ? rows.flatMap(sub=>{
    const summary = summaries[sub.subChapterId];
    const list    = conceptNamesFromSummary(summary);
    return list.map(c=>({sub,summary,concept:c}));
  }) : [];

  /* ---------- deferred heavy render if >400 rows ---------- */
  const [deferredReady,setDeferredReady]=useState(false);
  const giant = conceptRows.length>400;
  useLayoutEffect(()=>{
    if(!giant) { setDeferredReady(true); return; }
    // defer one animation frame so UI can paint spinner
    setDeferredReady(false);
    const id=requestAnimationFrame(()=>setDeferredReady(true));
    return()=>cancelAnimationFrame(id);
  },[giant,conceptRows.length]);

  /* ---------- loading states ---------- */
  if(!ready || !deferredReady){
    return(
      <Box sx={{p:3,color:"#fff",display:"flex",justifyContent:"center",mt:6}}>
        <CircularProgress size={28} sx={{mr:1}}/>
        <Typography>Loading concepts…</Typography>
      </Box>
    );
  }

  /* progress bar stub */
  const fakePct=30;

  return(
    <Box sx={{p:3,color:"#fff"}}>
      <Typography variant="h6" gutterBottom>Concept Catalogue</Typography>

      <FilterRow {...{
        book,books,setBook,
        subject,subjects,setSubject,
        grouping,groupings,setGrouping,
        chapter,chapters,setChapter,
        subId,setSubId,subs
      }}/>

      <Box sx={{mt:1,mb:3}}>
        <LinearProgress variant="determinate" value={fakePct}
          sx={{height:8,borderRadius:1,bgcolor:"#333",
              "& .MuiLinearProgress-bar":{bgcolor:"#FFD700"}}}/>
        <Typography sx={{fontSize:12,mt:.4}}>{fakePct}% completed</Typography>
      </Box>

      <Table size="small" sx={{bgcolor:"#111"}}>
        <TableHead><TableRow sx={{bgcolor:"#222"}}>
          <Th>Concept</Th><Th align="center">Weight</Th>
          <Th align="center">Status</Th><Th align="center">Quiz&nbsp;Hist.</Th>
          <Th align="center">Conf.</Th><Th align="center">Next&nbsp;Rev.</Th>
        </TableRow></TableHead>
        <TableBody>
          {conceptRows.length===0 && (
            <TableRow><Td colSpan={6} align="center">No concepts.</Td></TableRow>)}

          {conceptRows.map(({sub,summary,concept})=>{
            const pctObj={
              reading:summary.readingPct??0,
              remember:pctFromStats(summary.conceptStats?.remember),
              understand:pctFromStats(summary.conceptStats?.understand),
              apply:pctFromStats(summary.conceptStats?.apply),
              analyze:pctFromStats(summary.conceptStats?.analyze)
            };
            const readingDone=pctObj.reading===100;
            let active="reading";
            if(readingDone){
              for(const st of ["remember","understand","apply","analyze"])
                if(pctObj[st]==null||pctObj[st]<100){active=st;break;}
              if(pctObj.analyze===100) active="done";
            }
            const conceptMap=summary.conceptStats?.[active]||{};
            return(
              <TableRow key={`${sub.subChapterId}|${concept}`}
                        hover sx={{"&:nth-of-type(odd)":
                                   {bgcolor:"#181818"}}}>
                <Td>{concept}</Td>
                <Td align="center">{weightChip}</Td>
                <Td align="center">
                  {statusChip({stage:active,readingDone,
                               res:conceptMap[concept]})}
                </Td>
                <Td align="center"><HistDots/></Td>
                <Td align="center">{confChip}</Td>
                <Td align="center">—</Td>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Box>
  );
}

/* ────────── filter helpers ────────── */
const FilterBox=({label,value,setValue,options})=>(
  <FormControl variant="standard" sx={{minWidth:150}}>
    <Typography sx={{fontSize:12,mb:.3,color:"#bbb"}}>{label}</Typography>
    <Select value={value} onChange={e=>setValue(e.target.value)} disableUnderline
      sx={{bgcolor:"#222",borderRadius:1,color:"#fff",fontSize:14,px:1,py:.3,
           "& .MuiSelect-icon":{color:"#fff"}}}
      MenuProps={{PaperProps:{sx:{bgcolor:"#222",color:"#fff"}}}}>
      <MenuItem value="__ALL__">All</MenuItem>
      {options.map(o=><MenuItem key={o} value={o}>{o}</MenuItem>)}
    </Select>
  </FormControl>
);

function FilterRow(p){
  return(
    <Box sx={{display:"flex",gap:2,flexWrap:"wrap"}}>
      <FilterBox label="Book"      value={p.book}
        setValue={v=>{p.setBook(v);p.setSubject("__ALL__");p.setGrouping("__ALL__");p.setChapter("__ALL__");p.setSubId("__ALL__");}}
        options={p.books}/>
      <FilterBox label="Subject"   value={p.subject}
        setValue={v=>{p.setSubject(v);p.setGrouping("__ALL__");p.setChapter("__ALL__");p.setSubId("__ALL__");}}
        options={p.subjects}/>
      <FilterBox label="Grouping"  value={p.grouping}
        setValue={v=>{p.setGrouping(v);p.setChapter("__ALL__");p.setSubId("__ALL__");}}
        options={p.groupings}/>
      <FilterBox label="Chapter"   value={p.chapter}
        setValue={v=>{p.setChapter(v);p.setSubId("__ALL__");}}
        options={p.chapters}/>
      <FilterBox label="Sub-chapter" value={p.subId}
        setValue={p.setSubId}
        options={p.subs.map(s=>s.subChapterId)}/>
    </Box>
  );
}

/* ───────────── tiny cells ───────────── */
const Th=({children,align="left"})=>
  <TableCell align={align} sx={{fontWeight:700,color:"#FFD700"}}>{children}</TableCell>;
const Td=({children,align="left"})=>
  <TableCell align={align} sx={{color:"#fff"}}>{children}</TableCell>;