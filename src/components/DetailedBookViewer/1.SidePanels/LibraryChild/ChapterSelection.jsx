// src/components/DetailedBookViewer/ChapterSelection.jsx

import React from "react";
import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

/**
 * ChapterSelection
 *
 * Step 0 UI: Select Chapters/Subchapters
 * 
 * Props:
 *  - chapters (array): array of chapters, each with subchapters
 *  - onAccordionToggle (func): toggles expansion of a chapter
 *  - onToggleChapter (func): toggles an entire chapter
 *  - onToggleSubchapter (func): toggles a single subchapter
 */
export default function ChapterSelection({
  chapters,
  onAccordionToggle,
  onToggleChapter,
  onToggleSubchapter,
}) {
  return (
    <Box>
      <Typography
        variant="h6"
        sx={{ mb: 2, fontWeight: "bold", color: "#fff" }}
      >
        Select Chapters/Subchapters:
      </Typography>

      {chapters.length === 0 && (
        <Typography variant="body2" sx={{ color: "#ccc" }}>
          No chapters found or not yet loaded.
        </Typography>
      )}

      {chapters.map((ch, idx) => (
        <Accordion
          key={ch.id}
          expanded={ch.expanded}
          onChange={() => onAccordionToggle(idx)}
          sx={{
            marginBottom: 1,
            backgroundColor: "#262626",
            color: "#fff",
          }}
        >
          <AccordionSummary
            expandIcon={
              <ExpandMoreIcon sx={{ color: "#fff", fontSize: "1.5rem" }} />
            }
          >
            <FormControlLabel
              sx={{ color: "#fff" }}
              control={
                <Checkbox
                  checked={ch.selected}
                  onChange={() => onToggleChapter(idx)}
                  onClick={(e) => e.stopPropagation()}
                  sx={{
                    color: "#B39DDB",
                    "&.Mui-checked": { color: "#B39DDB" },
                  }}
                />
              }
              label={
                <Typography sx={{ fontWeight: "bold", color: "#fff" }}>
                  {ch.title}
                </Typography>
              }
            />
          </AccordionSummary>

          <AccordionDetails sx={{ backgroundColor: "#1f1f1f", color: "#fff" }}>
            {ch.subchapters.map((sub, sidx) => (
              <FormControlLabel
                key={sub.id}
                control={
                  <Checkbox
                    checked={sub.selected}
                    onChange={() => onToggleSubchapter(idx, sidx)}
                    sx={{
                      color: "#B39DDB",
                      "&.Mui-checked": { color: "#B39DDB" },
                    }}
                  />
                }
                label={sub.title}
                sx={{ display: "block", marginLeft: 3, color: "#fff" }}
              />
            ))}
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );
}