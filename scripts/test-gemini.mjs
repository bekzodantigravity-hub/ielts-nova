import { GoogleGenAI } from '@google/genai';
import fs from 'fs';

const env = fs.readFileSync('.env.local', 'utf8');
const keyMatch = env.match(/GEMINI_API_KEY=(.*)/);
const apiKey = keyMatch ? keyMatch[1].trim() : '';

const ai = new GoogleGenAI({ apiKey });

async function test() {
  for (const model of ['gemini-3.8-flash', 'gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-2.5-pro']) {
    try {
      console.log(`Testing model: ${model}...`);
      const res = await ai.models.generateContent({
        model,
        contents: 'Say hello in valid JSON: {"hello": "world"}',
        config: {
          responseMimeType: 'application/json',
        },
      });
      console.log(`Success with ${model}:`, res.text);
      return model;
    } catch (err) {
      console.log(`Failed with ${model}:`, err.message);
    }
  }
}

test().catch(console.error);
