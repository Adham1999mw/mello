import type { NextApiRequest, NextApiResponse } from "next";

// Example API route. Store logic (products, cart, orders) will live under /api.
export default function handler(_req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json({ ok: true });
}
