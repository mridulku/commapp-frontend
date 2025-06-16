import * as React from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  IconButton,
  Drawer,
  Button,
  Stack,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/CloseRounded";
import googleIcon from "../../logo.png";          // adjust if your path differs

const GoogleLogo = () => (
  <img src={googleIcon} alt="G" width={18} height={18}
       style={{marginRight:8,verticalAlign:"middle"}}/>
);

export default function NavBar({ examType, onGoogle }) {
  const [open, setOpen] = React.useState(false);
  const cta = `Start Learning`;

  return (
    <>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          bgcolor: "transparent",
          backdropFilter: "none",
          transition: "all .3s",
          "&.scrolled": {
            bgcolor: "rgba(10,0,30,.6)",
            backdropFilter: "blur(8px)",
          },
        }}
      >
        <Toolbar sx={{ justifyContent: "space-between" }}>
          <Typography
            variant="h6"
            sx={{ fontWeight: 700, cursor: "pointer" }}
            onClick={() => (window.location = "/")}
          >
            🚀 talk-ai.co
          </Typography>

          <Box sx={{ display: { xs: "none", md: "block" } }}>
            <Button variant="outlined" color="primary" onClick={onGoogle}>
              <GoogleLogo />
              {cta}
            </Button>
          </Box>

          <IconButton
            sx={{ display: { xs: "flex", md: "none" } }}
            onClick={() => setOpen(true)}
          >
            <MenuIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* mobile drawer */}
      <Drawer
        anchor="top"
        open={open}
        onClose={() => setOpen(false)}
        PaperProps={{ sx: { bgcolor: "background.default" } }}
      >
        <Box sx={{ p: 3 }}>
          <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
            <IconButton onClick={() => setOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>

          <Stack spacing={2} sx={{ mt: 2 }}>
            <Button
              variant="outlined"
              color="primary"
              onClick={() => {
                setOpen(false);
                onGoogle();
              }}
            >
              <GoogleLogo />
              {cta}
            </Button>
          </Stack>
        </Box>
      </Drawer>
    </>
  );
}