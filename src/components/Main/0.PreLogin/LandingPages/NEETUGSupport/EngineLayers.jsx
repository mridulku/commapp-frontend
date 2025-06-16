import * as React from "react";
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import BubbleChartIcon from "@mui/icons-material/BubbleChart";
import PersonSearchIcon from "@mui/icons-material/PersonSearch";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import CheckIcon from "@mui/icons-material/Check";

const layerData = [
  {
    title: "Concept Intelligence Layer",
    subtitle: "Splits every chapter into bite-size “concept atoms.”",
    bullets: [
      "Maps prerequisites & exam weightage",
      "Flags high-yield areas automatically",
    ],
    icon: <BubbleChartIcon sx={{ fontSize: 46, color: "#FFD54F" }} />,
    bg: "linear-gradient(180deg,#1e0035 0%,#160029 100%)",
  },
  {
    title: "Learner-Modelling Layer",
    subtitle: "Builds a real-time profile of you.",
    bullets: ["Tracks speed, accuracy & confidence", "Adjusts next task in < 1 s"],
    icon: <PersonSearchIcon sx={{ fontSize: 46, color: "#4FC3F7" }} />,
    bg: "linear-gradient(180deg,#160029 0%,#0f001f 100%)",
  },
];

export default function EngineLayers() {
  return (
    <Box sx={{ py: 10, bgcolor: "#120022" }}>
      <Container>
        <Typography
          variant="h4"
          sx={{ textAlign: "center", mb: 6, fontWeight: 700 }}
        >
          How the AI Coach Works
        </Typography>

        {/* make grid 3-column on desktop so the “+” sits naturally */}
        <Grid container spacing={4} alignItems="stretch">
          {/* layer 1 */}
          <Grid item xs={12} md={5}>
            <Paper
              elevation={3}
              sx={{ p: 4, height: "100%", background: layerData[0].bg, borderRadius: 3 }}
            >
              {layerData[0].icon}
              <Typography variant="h6" sx={{ fontWeight: 700, mt: 1 }}>
                {layerData[0].title}
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
                {layerData[0].subtitle}
              </Typography>
              <List dense>
                {layerData[0].bullets.map((b) => (
                  <ListItem key={b} sx={{ py: 0 }}>
                    <ListItemIcon sx={{ minWidth: 28 }}>
                      <CheckIcon sx={{ color: "#FFD700", fontSize: 18 }} />
                    </ListItemIcon>
                    <ListItemText primary={b} primaryTypographyProps={{ variant: "body2" }} />
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Grid>

          {/* plus icon */}
          <Grid
            item
            xs={12}
            md={2}
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              pb: { xs: 2, md: 0 },
            }}
          >
            <AddCircleOutlineIcon sx={{ fontSize: 56, color: "#FFD700" }} />
          </Grid>

          {/* layer 2 */}
          <Grid item xs={12} md={5}>
            <Paper
              elevation={3}
              sx={{ p: 4, height: "100%", background: layerData[1].bg, borderRadius: 3 }}
            >
              {layerData[1].icon}
              <Typography variant="h6" sx={{ fontWeight: 700, mt: 1 }}>
                {layerData[1].title}
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
                {layerData[1].subtitle}
              </Typography>
              <List dense>
                {layerData[1].bullets.map((b) => (
                  <ListItem key={b} sx={{ py: 0 }}>
                    <ListItemIcon sx={{ minWidth: 28 }}>
                      <CheckIcon sx={{ color: "#FFD700", fontSize: 18 }} />
                    </ListItemIcon>
                    <ListItemText primary={b} primaryTypographyProps={{ variant: "body2" }} />
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Grid>
        </Grid>

        <Typography
          variant="body1"
          sx={{
            mt: 6,
            textAlign: "center",
            color: "text.secondary",
            maxWidth: 720,
            mx: "auto",
          }}
        >
          These two brains work together—so the right content meets you at the right moment.
        </Typography>
      </Container>
    </Box>
  );
}