// Builds the favicons, app icons and the social share (Open Graph) image from the logo files
// in public/brand, using the brand colors from src/theme/brand.ts.
//
//   node scripts/generate-brand-assets.mjs
//
// Run it again after changing the logo or the brand colors, and commit the files it writes:
//   public/favicon.ico, public/icons/*.png, public/og/needle-og.jpg, public/site.webmanifest
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { BRAND, COLORS } from "../src/theme/brand.ts";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const pub = (...p) => path.join(root, "public", ...p);

const MONOGRAM = pub("brand", "needle-monogram-cream.webp");
const LOGO = pub("brand", "needle-logo-cream.webp");

/** Burgundy background with a soft lighter center, like the hero. */
function background(width, height) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    <defs><radialGradient id="g" cx="50%" cy="45%" r="75%">
      <stop offset="0" stop-color="${COLORS.burgundy}"/>
      <stop offset="1" stop-color="${COLORS.burgundyDeep}"/>
    </radialGradient></defs>
    <rect width="100%" height="100%" fill="url(#g)"/>
  </svg>`;
  return sharp(Buffer.from(svg)).png();
}

/** `src` scaled to fit `boxW`×`boxH`, centered on a `width`×`height` burgundy canvas. */
async function compose(src, width, height, boxW, boxH) {
  const logo = await sharp(src).resize(Math.round(boxW), Math.round(boxH), { fit: "inside" }).toBuffer();
  const bg = await background(width, height).toBuffer();
  return sharp(bg).composite([{ input: logo, gravity: "centre" }]);
}

/** Square icon. `scale` = share of the side the monogram may take (maskable icons need ≤ 0.6). */
const icon = (size, scale = 0.78) => compose(MONOGRAM, size, size, size * scale, size * scale);

/** .ico file holding PNG images (supported by every current browser). */
function toIco(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  let offset = 6 + images.length * 16;
  const entries = images.map(({ size, data }) => {
    const e = Buffer.alloc(16);
    e.writeUInt8(size >= 256 ? 0 : size, 0);
    e.writeUInt8(size >= 256 ? 0 : size, 1);
    e.writeUInt16LE(1, 4); // color planes
    e.writeUInt16LE(32, 6); // bits per pixel
    e.writeUInt32LE(data.length, 8);
    e.writeUInt32LE(offset, 12);
    offset += data.length;
    return e;
  });
  return Buffer.concat([header, ...entries, ...images.map((i) => i.data)]);
}

async function main() {
  await mkdir(pub("icons"), { recursive: true });
  await mkdir(pub("og"), { recursive: true });

  const pngs = {
    "favicon-16.png": await icon(16, 0.92),
    "favicon-32.png": await icon(32, 0.88),
    "apple-touch-icon.png": await icon(180),
    "icon-192.png": await icon(192),
    "icon-512.png": await icon(512),
    "icon-maskable-512.png": await icon(512, 0.58),
  };
  for (const [name, img] of Object.entries(pngs)) {
    await img.png({ compressionLevel: 9 }).toFile(pub("icons", name));
  }

  const ico = await Promise.all(
    [16, 32, 48].map(async (size) => ({
      size,
      data: await (await icon(size, size <= 16 ? 0.92 : 0.88)).png().toBuffer(),
    })),
  );
  await writeFile(pub("favicon.ico"), toIco(ico));

  // 1200×630 is the size Facebook, WhatsApp, X and LinkedIn all crop well.
  const og = await compose(LOGO, 1200, 630, 1200 * 0.6, 630 * 0.72);
  await og.jpeg({ quality: 88, mozjpeg: true }).toFile(pub("og", "needle-og.jpg"));

  // Paths are relative to the manifest, so they also work under /mello on GitHub Pages.
  const manifest = {
    name: `${BRAND.name} | ${BRAND.tagline}`,
    short_name: BRAND.name,
    start_url: "./",
    scope: "./",
    display: "standalone",
    dir: "rtl",
    lang: "ar",
    background_color: COLORS.burgundy,
    theme_color: COLORS.burgundy,
    icons: [
      { src: "icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
  await writeFile(pub("site.webmanifest"), `${JSON.stringify(manifest, null, 2)}\n`);

  console.log("Brand assets written to public/ (favicon.ico, icons/, og/, site.webmanifest)");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
