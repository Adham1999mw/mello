"use client";

import { createTheme } from "@mui/material/styles";

// Brand theme. `cssVariables` exposes the palette as `--mui-*` CSS variables,
// which Tailwind reads in globals.css so both systems share the same colors.
const theme = createTheme({
  cssVariables: true,
  palette: {
    mode: "light",
    primary: { main: "#111111" },
    secondary: { main: "#c8a27a" },
    background: { default: "#ffffff", paper: "#ffffff" },
  },
  shape: { borderRadius: 8 },
  typography: {
    fontFamily: "var(--font-geist-sans), Arial, Helvetica, sans-serif",
    button: { textTransform: "none", fontWeight: 600 },
  },
});

export default theme;
