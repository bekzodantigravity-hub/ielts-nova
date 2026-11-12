import { GoogleGenAI } from '@google/genai';
import fs from 'fs';

const env = fs.readFileSync('.env.local', 'utf8');
const keyMatch = env.match(/GEMINI_API_KEY=(.*)/);
const apiKey = keyMatch ? keyMatch[1].trim() : '';

const ai = new GoogleGenAI({ apiKey });

async function testFast() {
  const candidates = ['gemini-3.1-flash-lite', 'gemini-3.5-flash', 'gemini-3.8-flash', 'gemini-2.5-flash-lite'];
  for (const m of candidates) {
    try {
      const start = Date.now();
      const res = await ai.models.generateContent({
        model: m,
        contents: 'Return JSON: {"status": "ok"}',
        config: { responseMimeType: 'application/json' },
      });
      console.log(`[${m}] SUCCESS in ${Date.now() - start}ms:`, res.text.trim());
    } catch (e) {
      console.log(`[${m}] ERROR:`, e.message);
    }
  }
}

testFast();
