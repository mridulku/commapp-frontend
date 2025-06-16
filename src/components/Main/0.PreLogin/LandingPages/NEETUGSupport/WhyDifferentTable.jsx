import * as React from "react";
import {
  Box,
  Container,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Typography,
} from "@mui/material";
import CheckIcon from "@mui/icons-material/CheckCircle";
import CloseIcon from "@mui/icons-material/Cancel";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";

const rows = [
  {
    feature: "Personalised daily plan (60 s)",
    ours: "check",
    theirs: "warning",
  },
  {
    feature: "Concept-level mapping",
    ours: "check",
    theirs: "cross",
  },
  {
    feature: "Adaptive quiz loops",
    ours: "check",
    theirs: "warning",
  },
  {
    feature: "Retention scheduling",
    ours: "check",
    theirs: "cross",
  },
  {
    feature: "Confidence modelling",
    ours: "check",
    theirs: "cross",
  },
];

function icon(type) {
  if (type === "check")
    return <CheckIcon sx={{ color: "#FFD700" }} />;
  if (type === "warning")
    return <WarningAmberIcon sx={{ color: "#b3b3b3" }} />;
  return <CloseIcon sx={{ color: "#555" }} />;
}

export default function WhyDifferentTable() {
  return (
    <Box sx={{ py: 8, bgcolor: "#0d0020" }}>
      <Container>
        <Typography
          variant="h4"
          sx={{ textAlign: "center", mb: 3, fontWeight: 700 }}
        >
          Talk-AI vs. Typical Study Apps
        </Typography>

        <Table
          sx={{
            maxWidth: 900,
            mx: "auto",
            "& th, & td": { borderColor: "#25133a" },
          }}
        >
          <TableHead>
            <TableRow>
              <TableCell />
              <TableCell align="center" sx={{ fontWeight: 700 }}>
                Talk-AI
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: 700 }}>
                Typical Apps
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.feature}>
                <TableCell sx={{ color: "text.secondary", fontWeight: 600 }}>
                  {r.feature}
                </TableCell>
                <TableCell align="center">{icon(r.ours)}</TableCell>
                <TableCell align="center">{icon(r.theirs)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <Typography
          variant="body2"
          sx={{ textAlign: "center", mt: 3, color: "text.secondary" }}
        >
          Everything in one place—no shuffling between planners, video apps, and
          flash-card tools.
        </Typography>
      </Container>
    </Box>
  );
}