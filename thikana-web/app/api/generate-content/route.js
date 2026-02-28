import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req) {
  try {
    const { componentType, fieldName, context, businessType } = await req.json();

    if (!componentType || !fieldName) {
      return NextResponse.json(
        { error: "Component type and field name are required." },
        { status: 400 }
      );
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Construct a context-aware system prompt
    let systemPrompt = `You are an expert copywriter for websites. Generate content for a specific part of a website component.
    
    Component: ${componentType}
    Field to generating for: ${fieldName}
    ${businessType ? `Business Type / Industry: ${businessType}` : ""}
    ${context ? `Additional Context / Instructions: ${context}` : ""}
    
    Instructions:
    1. Provide ONLY the final generated text.
    2. Do NOT use quotation marks.
    3. Keep it professional, engaging, and appropriate for the context.
    4. Size mapping hints:
       - 'title' / 'heading' -> Short, catchy, 3-7 words.
       - 'subtitle' -> 1 sentence summarizing value.
       - 'description' / 'content' -> 2-3 sentences.
       - 'ctaText' / 'buttonText' -> 2-4 actionable words (e.g., 'Get Started Now').
    `;

    const finalResult = await model.generateContent(systemPrompt);
    const content = finalResult.response.text();

    return NextResponse.json({ success: true, content: content.trim() });
  } catch (error) {
    console.error("[AI Generate Content Error]:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate content" },
      { status: 500 }
    );
  }
}