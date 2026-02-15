
import { GoogleGenAI } from "@google/genai";
import { Product } from '../types';
import { BRAND_CONFIG } from '../config/brandConfig';

export const getStreamingRecommendation = async (userQuery: string, currentProducts: Product[]): Promise<string> => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
  if (!apiKey) {
    throw new Error('VITE_GEMINI_API_KEY is not configured');
  }

  const ai = new GoogleGenAI({ apiKey });
  const model = (import.meta.env.VITE_GEMINI_MODEL as string | undefined) || 'gemini-2.5-flash';

  const productContext = currentProducts.map(p => 
    `- ${p.name} (${p.duration}): $${p.price} (Stock: ${p.stock}). Features: ${p.features.join(', ')}. Description: ${p.description}`
  ).join('\n');

  const systemInstruction = `
    You are ${BRAND_CONFIG.identity.botName}, a helpful sales assistant for "${BRAND_CONFIG.identity.storeName}", a website selling discounted streaming accounts and digital goods.
    
    Here is our current live product inventory:
    ${productContext}

    Your goal is to recommend the best plan for the user based on their preferences.
    
    Rules:
    1. Be concise and friendly.
    2. Highlight price savings.
    3. ONLY recommend products that are in stock (Stock > 0). If a requested item is out of stock, suggest an alternative.
    4. Keep response under 100 words.
  `;

  try {
    // Calling generateContent with the appropriate model name and direct prompt input.
    const response = await ai.models.generateContent({
      model,
      contents: userQuery,
      config: {
        systemInstruction,
        temperature: 0.7,
      }
    });

    // Extracting generated text using the .text property accessor as required.
    return response.text || "I'm having trouble connecting to the recommendation engine. Please browse our catalog below!";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Sorry, I'm currently offline. Please check our 'Ultimate Stream Bundle' for the best value!";
  }
};
