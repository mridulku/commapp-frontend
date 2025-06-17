// src/components/HomeHub/blocks/ConceptGraphBlock.jsx
import React from "react";
import { Card, CardHeader, CardContent, Button, Stack, Typography } from "@mui/material";
import PublicIcon from "@mui/icons-material/Public";
import { cardSX, tokens } from "../theme";

export default function ConceptGraphBlock({ onOpenGraph }) {
  return (
    <Card sx={cardSX}>
      <CardHeader title="Concept Graph" />
      <CardContent>
        <Stack alignItems="center" spacing={2} sx={{ py:4 }}>
          <PublicIcon sx={{ fontSize:64, color:tokens.accent2 }} />
          <Typography variant="body2" sx={{ color:tokens.fg2 }}>
            Visualise how topics connect.<br/>Coming soon — beta preview.
          </Typography>
          <Button
            variant="contained"
            sx={{ bgcolor:tokens.accent1, color:"#000",
                  "&:hover":{ bgcolor:tokens.accent1 } }}
            onClick={onOpenGraph}
          >
            Explore
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}