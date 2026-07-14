import { createGroq } from '@ai-sdk/groq';
import { generateObject, generateText } from 'ai';

// Initialize the Groq provider
// The API key is automatically picked up from process.env.GROQ_API_KEY
const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
});

// We recommend using llama-3.3-70b-versatile or llama-3.1-8b-instant for fast/cheap tasks
export const models = {
  versatile: groq('llama-3.3-70b-versatile'),
  fast: groq('llama-3.1-8b-instant'),
};

export { generateObject, generateText };
