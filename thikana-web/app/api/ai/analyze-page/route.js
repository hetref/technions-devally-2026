import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { nanoid } from "nanoid";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req) {
  try {
    const { layoutJSON, brandKit, siteInfo } = await req.json();

    if (!layoutJSON || !layoutJSON.pages) {
      return NextResponse.json(
        { error: "Valid layout JSON is required" },
        { status: 400 }
      );
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            suggestions: {
              type: SchemaType.ARRAY,
              items: {
                type: SchemaType.OBJECT,
                properties: {
                  id: { type: SchemaType.STRING },
                  title: { type: SchemaType.STRING },
                  description: { type: SchemaType.STRING },
                  priority: { type: SchemaType.STRING, enum: ["high", "medium", "low"] },
                  action: {
                    type: SchemaType.OBJECT,
                    properties: {
                      type: { type: SchemaType.STRING, enum: ["add_component"] },
                      componentType: { type: SchemaType.STRING },
                      position: { type: SchemaType.STRING, enum: ["top", "bottom"] },
                      props: { type: SchemaType.OBJECT },
                      styles: { type: SchemaType.OBJECT }
                    },
                    required: ["type"]
                  }
                },
                required: ["id", "title", "description", "priority", "action"]
              }
            }
          },
          required: ["suggestions"]
        }
      }
    });

    const activePage = layoutJSON.pages.find(p => p.id === layoutJSON.currentPageId) || layoutJSON.pages[0];
    const pageDataStr = JSON.stringify(activePage, null, 2).substring(0, 5000); 

    const systemPrompt = `
      You are an expert AI Web Design Copilot analyzing a website layout.
      Review the current page structure and suggest improvements.
      
      Current Site: ${siteInfo?.name || "Website"}
      Current Page Layout Snippet:
      ${pageDataStr}
      
      Identify missing crucial elements (like Hero sections, Footers, Contact Forms, Call to Actions).
      Return an array of actionable suggestions. Each suggestion must include a specific 'add_component' action holding props to automatically inject the missing element.
      
      Valid Component Types: 'Hero', 'CTA', 'Features', 'Contact', 'Heading', 'FormEmbed', 'Footer'
      Make sure to fill out properties (props) appropriately for the suggested component. Include realistic copy!
      Give the suggestion a randomized ID.
    `;

    const result = await model.generateContent(systemPrompt);
    const text = result.response.text();

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
       return NextResponse.json({ suggestions: [] });
    }

    // Ensure nanoids
    if (parsed.suggestions) {
       parsed.suggestions = parsed.suggestions.map(s => ({
          ...s,
          id: s.id || nanoid()
       }));
    }

    return NextResponse.json(parsed);

  } catch (error) {
    console.error("[AI Analyze Error]:", error);
    return NextResponse.json({ suggestions: [] });
  }
}
