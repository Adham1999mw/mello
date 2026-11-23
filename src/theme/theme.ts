import { createTheme } from "@mui/material/styles";

// Brand theme. `cssVariables` exposes the palette as `--mui-*` CSS variables,
// which Tailwind reads in globals.css so both systems share the same colors.
export default function createAppTheme(direction: "rtl" | "ltr") {
  return createTheme({
    direction,
    cssVariables: true,
    palette: {
      mode: "light",
      primary: { main: "#111111" },
      secondary: { main: "#c8a27a" },
      background: { default: "#ffffff", paper: "#ffffff" },
    },
    shape: { borderRadius: 8 },
    typography: {
      fontFamily:
        direction === "rtl"
          ? "var(--font-arabic), var(--font-geist-sans), Arial, sans-serif"
          : "var(--font-geist-sans), var(--font-arabic), Arial, sans-serif",
      button: { textTransform: "none", fontWeight: 600 },
    },
  });
}
