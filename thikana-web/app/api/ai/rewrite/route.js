import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req) {
  try {
    const { text, instruction, tone } = await req.json();

    if (!text) {
      return NextResponse.json(
        { error: "Original text is required" },
        { status: 400 }
      );
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    let toneInstruction = tone ? `Tone: ${tone}` : "Tone: Professional and clear";
    
    let promptText = `
    You are an expert copywriter modifying text for a professional website.
    Please rewrite the following text according to these instructions:
    
    Original Text: "${text}"
    Instruction: ${instruction || "Improve the clarity and flow."}
    ${toneInstruction}
    
    IMPORTANT: Provide ONLY the rewritten text without any quotes, conversational filler, or formatting.
    `;

    const finalResult = await model.generateContent(promptText);
    const content = finalResult.response.text();

    return NextResponse.json({ content: content.trim() });
  } catch (error) {
    console.error("[AI Rewrite Error]:", error);
    return NextResponse.json(
      { error: "Failed to rewrite content" },
      { status: 500 }
    );
  }
}
