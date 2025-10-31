// Vercel serverless function: returns the GEMINI_API_KEY to the frontend (matches existing /api/config)
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(_req: VercelRequest, res: VercelResponse) {
  const key = process.env.GEMINI_API_KEY || '';
  res.setHeader('Content-Type', 'application/json');
  res.status(200).json({ geminiApiKey: key });
}
