import type { Express } from "express";
import { createServer, type Server } from "http";

export async function registerRoutes(app: Express): Promise<Server> {
  // Provide API key to client (safe since it's for frontend-only usage)
  app.get('/api/config', (req, res) => {
    res.json({
      geminiApiKey: process.env.GEMINI_API_KEY || 'AIzaSyANh-lJeWiaTz1aH9dY22pvnNxhJwD3mP8'
    });
  });

  // Test Gemini API directly on server side
  app.post('/api/test-gemini', async (req, res) => {
    try {
      const { GoogleGenAI } = await import("@google/genai");
      const geminiApiKey = process.env.GEMINI_API_KEY || 'AIzaSyANh-lJeWiaTz1aH9dY22pvnNxhJwD3mP8';
      
      if (!geminiApiKey) {
        return res.status(500).json({ error: 'GEMINI_API_KEY not found' });
      }

      const ai = new GoogleGenAI({ apiKey: geminiApiKey });
      
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: "Hello! Please respond with a simple JSON: {\"success\": true, \"message\": \"API working\"}",
      });

      const text = response.text;
      res.json({ success: true, response: text });
    } catch (error) {
      console.error('Gemini test error:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });
  
  // Future backend endpoints could be added here for:
  // - Contract storage and retrieval
  // - User authentication and authorization
  // - Analysis history and sharing
  // - Collaborative features
  
  const httpServer = createServer(app);
  return httpServer;
}
