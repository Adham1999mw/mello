import { createTheme } from "@mui/material/styles";
import { BREAKPOINTS, COLORS, FONTS, LAYOUT } from "./brand";

// Brand theme built from the constants in ./brand.ts.
// `cssVariables` exposes the palette as `--mui-*` CSS variables, which Tailwind
// reads in globals.css so both systems share the same colors.
// MUI breakpoints are min-width (`theme.breakpoints.up`), so styles stay mobile-first.
export default function createAppTheme(direction: "rtl" | "ltr") {
  const isRtl = direction === "rtl";
  const sans = isRtl ? `${FONTS.arSans}` : `${FONTS.sans}, ${FONTS.arSans}`;
  const display = isRtl ? FONTS.arDisplay : FONTS.display;

  return createTheme({
    direction,
    cssVariables: true,
    breakpoints: { values: { xs: BREAKPOINTS.xs, sm: BREAKPOINTS.sm, md: BREAKPOINTS.md, lg: BREAKPOINTS.lg, xl: BREAKPOINTS.xl } },
    palette: {
      mode: "light",
      primary: { main: COLORS.burgundy, dark: COLORS.burgundyDeep, contrastText: COLORS.champagne },
      secondary: { main: COLORS.champagne, contrastText: COLORS.burgundyDeep },
      background: { default: COLORS.ivory, paper: COLORS.white },
      text: { primary: COLORS.ink, secondary: COLORS.inkMuted },
    },
    shape: { borderRadius: LAYOUT.radius },
    typography: {
      fontFamily: sans,
      h1: { fontFamily: display, fontWeight: 400 },
      h2: { fontFamily: display, fontWeight: 400 },
      h3: { fontFamily: display, fontWeight: 400 },
      h4: { fontFamily: display, fontWeight: 400 },
      button: {
        textTransform: isRtl ? "none" : "uppercase",
        letterSpacing: isRtl ? 0 : "0.2em",
        fontWeight: 500,
      },
    },
    components: {
      MuiButton: {
        styleOverrides: { root: { minHeight: LAYOUT.minTapTarget } },
      },
      MuiIconButton: {
        styleOverrides: { root: { minWidth: LAYOUT.minTapTarget, minHeight: LAYOUT.minTapTarget } },
      },
    },
  });
}
