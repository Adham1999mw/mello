"use client";

import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter";
import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material/styles";
import StoreProvider from "@/store/StoreProvider";
import theme from "@/theme/theme";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    // enableCssLayer wraps all MUI styles in `@layer mui` so Tailwind can override them.
    <AppRouterCacheProvider options={{ enableCssLayer: true }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <StoreProvider>{children}</StoreProvider>
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
}
