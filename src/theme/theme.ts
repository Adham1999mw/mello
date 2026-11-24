import { createTheme } from "@mui/material/styles";
import { COLORS, FONTS, LAYOUT } from "./brand";

// MUI theme built from the brand tokens. `cssVariables` exposes the palette as
// `--mui-*` CSS variables, which Tailwind reads in globals.css.
export default function createAppTheme(direction: "rtl" | "ltr") {
  const isArabic = direction === "rtl";

  return createTheme({
    direction,
    cssVariables: true,
    palette: {
      mode: "light",
      primary: {
        main: COLORS.burgundy,
        dark: COLORS.burgundyDeep,
        light: COLORS.wine,
        contrastText: COLORS.champagne,
      },
      secondary: { main: COLORS.champagne, contrastText: COLORS.burgundyDeep },
      background: { default: COLORS.ivory, paper: COLORS.ivory },
      text: { primary: COLORS.ink },
    },
    shape: { borderRadius: LAYOUT.radius },
    typography: {
      fontFamily: FONTS.sans,
      // Headings use the serif. Arabic letters need more line height.
      h1: { fontFamily: FONTS.display, fontWeight: 400, lineHeight: isArabic ? 1.5 : 1.12 },
      h2: { fontFamily: FONTS.display, fontWeight: 400, lineHeight: isArabic ? 1.5 : 1.15 },
      h3: { fontFamily: FONTS.display, fontWeight: 400, lineHeight: isArabic ? 1.5 : 1.2 },
      h4: { fontFamily: FONTS.display, fontWeight: 500, lineHeight: isArabic ? 1.5 : 1.25 },
      // English buttons: small, uppercase, wide spacing. Arabic has no capitals, so
      // it gets a bigger size and normal spacing instead.
      button: isArabic
        ? { fontWeight: 500, fontSize: "15px", textTransform: "none", letterSpacing: 0 }
        : { fontWeight: 500, fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.24em" },
    },
    components: {
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: { root: { minHeight: LAYOUT.minTapTarget } },
      },
    },
  });
}
