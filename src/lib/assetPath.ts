// Files in /public live under the site's base path on GitHub Pages ("/mello/brand/...").
// Next adds it to links, but not to next/image `src` or CSS `url()`, so wrap those paths:
//   <Image src={assetPath("/brand/needle-label.webp")} ... />
export function assetPath(path: string): string {
  return `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}${path}`;
}
