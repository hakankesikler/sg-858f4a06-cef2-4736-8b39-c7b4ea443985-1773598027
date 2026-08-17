import type { NextApiRequest, NextApiResponse } from "next";

// This endpoint used to send a real e-mail on every public GET request.
// It is intentionally disabled in production to prevent mail abuse and cost spikes.
export default function handler(_req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Cache-Control", "no-store");
  return res.status(404).json({ error: "Not found" });
}
