// src/components/HomeHub/blocks/ToolsBlock.jsx
import React from "react";
import { Card, CardHeader, CardContent, Grid, Button } from "@mui/material";
import BoltIcon   from "@mui/icons-material/FlashOn";
import Schedule   from "@mui/icons-material/Schedule";
import MapIcon    from "@mui/icons-material/Map";
import { cardSX, tokens } from "../theme";

const TOOLS = [
  { id:"planner", label:"Study Planner", icon:<Schedule/> },
  { id:"quick",   label:"Quick Revise",  icon:<BoltIcon/> },
  { id:"concept", label:"Concept Map",   icon:<MapIcon/> },
];

export default function ToolsBlock({ onOpenTool }) {
  return (
    <Card sx={cardSX}>
      <CardHeader title="Tools" />
      <CardContent>
        <Grid container spacing={2}>
          {TOOLS.map(t=>(
            <Grid item xs={12} key={t.id}>
              <Button
                fullWidth
                variant="outlined"
                sx={{
                  borderColor: tokens.accent1,
                  color: tokens.fg,
                  "&:hover":{ bgcolor: tokens.accent1, color:"#000" }
                }}
                startIcon={t.icon}
                onClick={()=>onOpenTool(t.id)}
              >
                {t.label}
              </Button>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );
}