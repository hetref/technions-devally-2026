import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req) {
  try {
    const { businessName, callType, language } = await req.json();

    if (!businessName || !callType) {
      return NextResponse.json(
        { error: "Business name and call type are required." },
        { status: 400 }
      );
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const systemPrompt = `You are an expert sales and customer service script writer. You write scripts for AI voice assistants to use during phone calls.

    Generate a complete, professional, and natural-sounding call script for the following:
    Business Name: ${businessName}
    Call Purpose/Type: ${callType}
    Language: ${language === "hi" ? "Hindi" : "English"}
    
    Instructions:
    1. Write the script as a continuous flowing text but separate different parts with clear brackets for context, like [Wait for response] or [If customer says yes].
    2. Use placeholders like [Customer Name] whenever appropriate.
    3. The script should start with a greeting mentioning the AI assistant's name (e.g., "[AI Assistant Name]") and the business name.
    4. Provide only the script text. Do not provide any introduction, explanation, or markdown formatting outside of the script itself.
    5. Ensure the script sounds natural and conversational, not robotic. Include a proper sign-off or closing statement.
    `;

    const result = await model.generateContent(systemPrompt);
    const content = result.response.text();

    return NextResponse.json({ success: true, script: content.trim() });
  } catch (error) {
    console.error("[AI Generate Script Error]:", error);
    return NextResponse.json(
      { error: "Failed to generate script" },
      { status: 500 }
    );
  }
}
