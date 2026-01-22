
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function getFireChiefReport(score: number, level: number, fireFocus: number) {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are a tough but caring Israeli Fire Chief. Give a short status report in Hebrew based on: Score: ${score}, Level: ${level}, Strategy Focus: ${fireFocus}% firefighting vs ${100 - fireFocus}% rescuing. Keep it under 2 sentences. Be motivating.`,
    });
    return response.text || "תמשיך לעבוד, המצב תחת שליטה!";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "המצב קשה בשטח, תמשיך להציל אנשים!";
  }
}
