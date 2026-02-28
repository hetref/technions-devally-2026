import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req) {
  try {
    const { prompt, type, currentText } = await req.json();

    if (!prompt && !currentText) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    let systemPrompt = "";

    switch (type) {
      case "rewrite":
        systemPrompt = `You are an expert copywriter. Rewrite the following text to be more engaging, professional, and clear.
        ${prompt ? `Consider this specific instruction: ${prompt}` : ""}
        Do not include quotes or surrounding conversational text. ONLY return the rewritten text.
        
        Original text:
        "${currentText}"`;
        break;

      case "shorten":
        systemPrompt = `You are an expert copywriter. Shorten the following text while keeping the main message intact.
        Do not include quotes or surrounding conversational text. ONLY return the shortened text.
        
        Original text:
        "${currentText}"`;
        break;

      case "lengthen":
        systemPrompt = `You are an expert copywriter. Expand on the following text, adding more descriptive and engaging details.
        Do not include quotes or surrounding conversational text. ONLY return the expanded text.
        
        Original text:
        "${currentText}"`;
        break;

      case "tone-professional":
        systemPrompt = `You are an expert copywriter. Rewrite the following text to sound extremely professional and corporate.
        Do not include quotes or surrounding conversational text. ONLY return the rewritten text.
        
        Original text:
        "${currentText}"`;
        break;

      case "generate":
      default:
        systemPrompt = `You are an expert website copywriter. Generate website content based on the following prompt:
        "${prompt}"
        
        Keep the tone professional, engaging, and suitable for a modern website. Do not include introductory conversational text, just the generated copy.`;
        break;
    }

    const finalResult = await model.generateContent(systemPrompt);
    const content = finalResult.response.text();

    return NextResponse.json({ content: content.trim() });
  } catch (error) {
    console.error("[AI Generate Content Error]:", error);
    return NextResponse.json(
      { error: "Failed to generate content" },
      { status: 500 }
    );
  }
}
