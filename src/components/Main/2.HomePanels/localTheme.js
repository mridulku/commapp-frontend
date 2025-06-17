// localTheme.js  (scoped palette only used inside HomeHub)
import { createTheme } from "@mui/material/styles";

export const tokens = {
  primary500 : "#6F4CFF",
  primary600 : "#5A3AE6",
  surface000 : "#0F0F0F",
  surface100 : "#181818",
  surfaceElevated : "#1F1F1F",
  onSurface : "#FFFFFF",
  onDisabled: "#9E9E9E",
  accentBlue: "#3FA9F5",
  accentPink: "#FF5FA8",
};

export default createTheme({
  palette: {
    mode : "dark",
    primary:   { main: tokens.primary500, dark: tokens.primary600 },
    background:{ default: tokens.surface000, paper: tokens.surface100 },
    text:      { primary: tokens.onSurface, secondary: tokens.onDisabled },
  },
  shape:{ borderRadius: 12 },
});