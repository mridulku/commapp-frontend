// src/components/HomeHub/blocks/ProfileBlock.jsx
import React from "react";
import { Card, CardHeader, CardContent } from "@mui/material";
import ProfilePanel from "./ProfilePanel";
import { cardSX } from "../theme";

export default function ProfileBlock(props) {
  return (
    <Card sx={cardSX}>
      <CardHeader title="Profile" />
      <CardContent>
        <ProfilePanel {...props} />
      </CardContent>
    </Card>
  );
}