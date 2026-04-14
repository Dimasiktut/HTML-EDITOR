import { GoogleGenAI, Type } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY || "";
if (!apiKey) {
  console.warn("GEMINI_API_KEY is not defined in the environment. AI features will not work.");
}
const ai = new GoogleGenAI({ apiKey });

export async function getSynonyms(word: string, context: string) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is missing. Please add it in the 'Secrets' panel in AI Studio settings.");
  }

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Find synonyms or related words for the word "${word}" in the following context: "${context}". 
    Return a list of words that could replace it or are thematically similar.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          synonyms: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "List of synonyms or related words",
          },
          explanation: {
            type: Type.STRING,
            description: "Brief explanation of why these words are relevant",
          }
        },
        required: ["synonyms"],
      },
    },
  });

  return JSON.parse(response.text);
}

export async function getImprovementSuggestions(selectedText: string, fullContext: string) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is missing. Please add it in the 'Secrets' panel in AI Studio settings.");
  }

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `The user has selected the following text: "${selectedText}". 
    The full context is: "${fullContext}". 
    Suggest 3-4 ways to rewrite or replace this selection to make it sound better, more professional, or more concise. 
    Return the suggestions as a JSON array of strings.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          suggestions: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "List of improved versions of the text",
          }
        },
        required: ["suggestions"],
      },
    },
  });

  return JSON.parse(response.text);
}
