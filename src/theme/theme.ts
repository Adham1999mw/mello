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
  // Arabic letters need more line height than Latin ones.
  const headingLineHeight = isRtl ? 1.5 : 1.12;
  // Arabic headings use Markazi Text at 500 (see docs/design-guidelines.md).
  const headingWeight = isRtl ? 500 : 400;

  return createTheme({
    direction,
    cssVariables: true,
    breakpoints: { values: { xs: BREAKPOINTS.xs, sm: BREAKPOINTS.sm, md: BREAKPOINTS.md, lg: BREAKPOINTS.lg, xl: BREAKPOINTS.xl } },
    palette: {
      mode: "light",
      primary: {
        main: COLORS.burgundy,
        dark: COLORS.burgundyDeep,
        light: COLORS.wine,
        contrastText: COLORS.champagne,
      },
      secondary: { main: COLORS.champagne, contrastText: COLORS.burgundyDeep },
      error: { main: COLORS.danger, contrastText: COLORS.white },
      background: { default: COLORS.ivory, paper: COLORS.white },
      text: { primary: COLORS.ink, secondary: COLORS.inkMuted },
    },
    shape: { borderRadius: LAYOUT.radius },
    typography: {
      fontFamily: sans,
      h1: { fontFamily: display, fontWeight: headingWeight, lineHeight: headingLineHeight },
      h2: { fontFamily: display, fontWeight: headingWeight, lineHeight: headingLineHeight },
      h3: { fontFamily: display, fontWeight: headingWeight, lineHeight: headingLineHeight },
      h4: { fontFamily: display, fontWeight: headingWeight, lineHeight: headingLineHeight },
      // English: small uppercase with wide spacing. Arabic has no capitals, so it gets
      // a bigger size and normal spacing instead.
      button: isRtl
        ? { fontWeight: 500, fontSize: "15px", textTransform: "none", letterSpacing: 0 }
        : { fontWeight: 500, fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.2em" },
    },
    components: {
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: { root: { minHeight: LAYOUT.minTapTarget } },
      },
      MuiIconButton: {
        styleOverrides: { root: { minWidth: LAYOUT.minTapTarget, minHeight: LAYOUT.minTapTarget } },
      },
    },
  });
}
