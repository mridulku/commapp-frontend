import { Card, Box, useTheme } from "@mui/material";
import { tokens }              from "./localTheme";

export default function AccentStripCard({ accent="primary", hoverLift=true, children, ...rest }) {
  const accentColor = {
    primary: tokens.primary500,
    blue   : tokens.accentBlue,
    pink   : tokens.accentPink,
  }[accent] || tokens.primary500;

  return (
    <Card
      {...rest}
      sx={{
        position:"relative",
        bgcolor:"background.paper",
        p:2,
        transition:"transform .18s, box-shadow .18s",
        ...(hoverLift && {
          "&:hover":{ transform:"translateY(-4px)", boxShadow:`0 6px 20px -6px ${accentColor}88` }
        })
      }}
    >
      <Box sx={{
        position:"absolute", left:0, top:0, width:4, height:"100%",
        bgcolor: accentColor, borderTopLeftRadius:12, borderBottomLeftRadius:12
      }}/>
      {children}
    </Card>
  );
}