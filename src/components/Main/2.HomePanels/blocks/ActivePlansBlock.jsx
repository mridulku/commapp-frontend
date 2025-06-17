// src/components/HomeHub/blocks/ActivePlansBlock.jsx
import React from "react";
import { Card, CardHeader, CardContent } from "@mui/material";
import PanelC      from "./4.PanelC";
import { cardSX }  from "../theme";

export default function ActivePlansBlock(props) {
  return (
    <Card sx={{ ...cardSX, height:"100%" }}>
      <CardHeader title="Active Plans" />
      <CardContent sx={{ p:0 }}>
        <PanelC {...props} />
      </CardContent>
    </Card>
  );
}