import { createEmotionCache as createMuiEmotionCache } from "@mui/material-nextjs/v16-pagesRouter";
import { prefixer } from "stylis";
import rtlPlugin from "stylis-plugin-rtl";

/**
 * Emotion cache for MUI.
 * - `enableCssLayer` puts MUI styles in `@layer mui` so Tailwind utilities win.
 * - For RTL, stylis-plugin-rtl flips left/right in MUI's generated CSS.
 */
export default function createEmotionCache(direction: "rtl" | "ltr") {
  return direction === "rtl"
    ? createMuiEmotionCache({
        key: "muirtl",
        enableCssLayer: true,
        stylisPlugins: [prefixer, rtlPlugin],
      })
    : createMuiEmotionCache({ key: "mui", enableCssLayer: true });
}
