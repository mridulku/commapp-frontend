import * as React from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
} from "@mui/material";
import Slider from "react-slick";

/* slick basic styles already imported globally */

const tasks = [
  { id: 1, title: "Rapid-Fire: Trigonometry", eta: "3 min" },
  { id: 2, title: "Quick Revise: Photosynthesis", eta: "5 min" },
  { id: 3, title: "Mock-to-Drill: Genetics", eta: "7 min" },
];

export default function NextTasksCarousel() {
  const settings = {
    dots: true,
    arrows: false,
    infinite: tasks.length > 1,
    speed: 400,
    slidesToShow: 1,
  };

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
        What’s Next?
      </Typography>

      <Slider {...settings}>
        {tasks.map((t) => (
          <Box key={t.id} sx={{ px: 1 }}>
            <Paper
              elevation={3}
              sx={{
                p: 3,
                borderRadius: 4,
                bgcolor: "#1b1234",
              }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1, color:"#fff" }}>

                {t.title}
              </Typography>
             <Typography variant="body2" sx={{ mb: 2, color:"#b3b3b3" }}>
                ETA {t.eta}
              </Typography>
              <Button variant="contained" color="secondary" size="small">
                Start
              </Button>
            </Paper>
          </Box>
        ))}
      </Slider>
    </Box>
  );
}