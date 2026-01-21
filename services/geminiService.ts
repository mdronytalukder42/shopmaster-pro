
import { GoogleGenAI, Type } from "@google/genai";

// Initialize the Gemini AI client with the API key from environment variables.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const geminiService = {
  /**
   * Summarizes daily sales performance and provides insights.
   */
  async summarizeDailyActivity(data: any) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analyze this shop daily data and provide a short, professional summary in Bengali for the owner: ${JSON.stringify(data)}`,
        config: {
          systemInstruction: "You are an expert business accountant. Provide insights on sales, expenses, and cash flow in Bengali."
        }
      });
      return response.text || "No summary available.";
    } catch (error) {
      console.error("Gemini summary error:", error);
      return "Unable to generate summary at this time.";
    }
  },

  /**
   * Parses unstructured item descriptions into structured JSON.
   */
  async parseItemsDescription(description: string) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Parse this item description into a list of objects with name, qty, and price: "${description}"`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                qty: { type: Type.NUMBER },
                price: { type: Type.NUMBER }
              },
              required: ["name", "qty", "price"]
            }
          }
        }
      });
      return JSON.parse(response.text || "[]");
    } catch (error) {
      console.error("Gemini parse error:", error);
      return [];
    }
  }
};
