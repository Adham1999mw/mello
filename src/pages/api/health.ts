import type { NextApiRequest, NextApiResponse } from "next";

// Example API route. Store logic (products, cart, orders) will live under /api.
// Runs on the real server only; GitHub Pages builds skip API routes.
export default function handler(_req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json({ ok: true });
}
