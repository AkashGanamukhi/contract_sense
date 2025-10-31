// Vercel serverless function: simple test that attempts to call the GenAI SDK using the server's env key
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return res.status(500).json({ error: 'GEMINI_API_KEY not set' });
  }

  try {
    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({ apiKey: key });
    // lightweight test request (short prompt)
    const response = await ai.models.generateContent({
      model: 'gemini-1.5',
      input: 'Hello from test endpoint'
    });

    res.status(200).json({ ok: true, result: response });
  } catch (err: any) {
    res.status(500).json({ error: String(err?.message || err) });
  }
}
