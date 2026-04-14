import OpenAI from "openai";
import { GoogleGenAI, Type } from "@google/genai";
import { localSynonyms } from "./localSynonyms.ts";

// Initialize Gemini
const geminiKey = process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenAI({ apiKey: geminiKey });

// Initialize DeepSeek (OpenAI compatible)
const deepseekKey = process.env.DEEPSEEK_API_KEY || "";
const deepseek = new OpenAI({
  apiKey: deepseekKey,
  baseURL: "https://api.deepseek.com",
  dangerouslyAllowBrowser: true // Required for client-side usage
});

export async function getSynonyms(word: string, context: string) {
  const normalizedWord = word.toLowerCase().trim();
  
  // 1. Check local dictionary first
  if (localSynonyms[normalizedWord]) {
    return {
      synonyms: localSynonyms[normalizedWord].list,
      explanation: localSynonyms[normalizedWord].explanation + " (Локальный словарь)"
    };
  }

  // 2. Try DeepSeek if key is available
  if (deepseekKey) {
    try {
      const response = await deepseek.chat.completions.create({
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant that provides synonyms in JSON format. Return only JSON."
          },
          {
            role: "user",
            content: `Find synonyms or related words for the word "${word}" in the following context: "${context}". 
            Return a JSON object with:
            - synonyms: string[]
            - explanation: string (briefly why)
            Language: match the input language (Russian or English).`
          }
        ],
        response_format: { type: "json_object" }
      });
      
      const content = response.choices[0].message.content;
      if (content) {
        return JSON.parse(content);
      }
    } catch (e) {
      console.error("DeepSeek Error:", e);
      // Fallback to Gemini if DeepSeek fails
    }
  }

  // 3. Try Gemini if key is available
  if (geminiKey) {
    try {
      const response = await genAI.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Find synonyms or related words for the word "${word}" in the following context: "${context}".`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              synonyms: { type: Type.ARRAY, items: { type: Type.STRING } },
              explanation: { type: Type.STRING }
            },
            required: ["synonyms"],
          },
        },
      });
      return JSON.parse(response.text);
    } catch (e) {
      console.error("Gemini Error:", e);
    }
  }

  // 4. Final Fallback
  return {
    synonyms: [],
    explanation: "API ключи не настроены. Доступны только базовые слова из локального словаря."
  };
}

export async function getImprovementSuggestions(selectedText: string, fullContext: string) {
  // Try DeepSeek
  if (deepseekKey) {
    try {
      const response = await deepseek.chat.completions.create({
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: "You are a professional editor. Suggest improvements in JSON format."
          },
          {
            role: "user",
            content: `The user has selected: "${selectedText}". Context: "${fullContext}". 
            Suggest 3-4 ways to rewrite this. Return JSON object with "suggestions" as a string array.`
          }
        ],
        response_format: { type: "json_object" }
      });
      const content = response.choices[0].message.content;
      if (content) return JSON.parse(content);
    } catch (e) {
      console.error("DeepSeek Error:", e);
    }
  }

  // Try Gemini
  if (geminiKey) {
    try {
      const response = await genAI.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Selected: "${selectedText}". Context: "${fullContext}". Suggest 3-4 improvements.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              suggestions: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["suggestions"],
          },
        },
      });
      return JSON.parse(response.text);
    } catch (e) {
      console.error("Gemini Error:", e);
    }
  }

  return {
    suggestions: ["API ключи не настроены. Функции улучшения через ИИ недоступны."]
  };
}

export async function chat(message: string, history: { role: "user" | "assistant", content: string }[]) {
  // Try DeepSeek
  if (deepseekKey) {
    try {
      const response = await deepseek.chat.completions.create({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: "You are a helpful assistant. Help the user generate descriptions and content." },
          ...history,
          { role: "user", content: message }
        ]
      });
      return response.choices[0].message.content || "No response from DeepSeek.";
    } catch (e) {
      console.error("DeepSeek Chat Error:", e);
    }
  }

  // Try Gemini
  if (geminiKey) {
    try {
      const chatSession = genAI.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          ...history.map(h => ({ role: h.role === "user" ? "user" : "model", parts: [{ text: h.content }] })),
          { role: "user", parts: [{ text: message }] }
        ],
        config: {
          systemInstruction: "You are a helpful assistant. Help the user generate descriptions and content."
        }
      });
      const response = await chatSession;
      return response.text || "No response from Gemini.";
    } catch (e) {
      console.error("Gemini Chat Error:", e);
    }
  }

  return "API ключи не настроены. Чат недоступен.";
}

