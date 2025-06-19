import React from "react";
import { Box, Stack, Typography, Chip, Avatar, IconButton } from "@mui/material";
import EditIcon       from "@mui/icons-material/Edit";
import ArrowBackIos   from "@mui/icons-material/ArrowBackIos";

const GLASS_BG="rgba(255,255,255,.06)";
const headerAvatar={ width:30, height:30, bgcolor:"rgba(255,255,255,.15)" };
const chipStyle = (bg="rgba(255,255,255,.12)")=>({
  bgcolor:bg, color:"#fff", fontWeight:600, height:20
});
const frame={ borderRadius:4, p:3, bgcolor:GLASS_BG,
              backdropFilter:"blur(6px)",
              boxShadow:"0 8px 24px rgba(0,0,0,.55)", color:"#f0f0f0" };

const YEARS=[...Array(15)].map((_,i)=>2024-i);

export default function PastPapersPage({ onBack=()=>{} }){
  return(
    <Box sx={frame}>
      <Header icon={<EditIcon/>} title="Past papers parsed" onBack={onBack}/>
      <Stack direction="row" spacing={1} flexWrap="wrap">
        {YEARS.map(y=><Chip key={y} label={y} size="small" sx={chipStyle()}/>)}
      </Stack>
    </Box>
  );
}

function Header({icon,title,onBack}){
  return(
    <Stack direction="row" spacing={1} alignItems="center" mb={2}>
      <IconButton onClick={onBack} sx={{ color:"#fff", mr:1 }}><ArrowBackIos/></IconButton>
      <Avatar sx={headerAvatar}>{icon}</Avatar>
      <Typography variant="h5" sx={{ fontWeight:800 }}>{title}</Typography>
    </Stack>
  );
}