import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export const runtime = 'edge';

export async function POST(req) {
  try {
    const { message, context } = await req.json();

    if (!message) {
      return new Response(JSON.stringify({ error: "Message is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const { layoutJSON, chatHistory } = context || {};
    
    // Convert to gemini conversation history format
    const history = [];
    if (chatHistory && chatHistory.length > 0) {
       for (const msg of chatHistory) {
         if (msg.role === 'user' || msg.role === 'model') {
           history.push({
             role: msg.role === 'assistant' ? 'model' : msg.role, 
             parts: [{ text: msg.content }]
           });
         }
       }
    }

    let activePageSnippet = "Empty Page.";
    if (layoutJSON && layoutJSON.pages && layoutJSON.pages.length > 0) {
        const activePage = layoutJSON.pages.find(p => p.id === layoutJSON.currentPageId) || layoutJSON.pages[0];
        activePageSnippet = JSON.stringify(activePage, null, 2).substring(0, 3000); 
    }

    const systemInstruction = `
You are the Thikana AI Assistant, a highly skilled website builder copilot.
Your job is to help users design their websites by conversing naturally AND executing programmatic actions on their canvas.

Current Page Context Snippet:
${activePageSnippet}

When the user asks you to modify the page (add a component, change colors, rewrite text, etc.), you MUST append a JSON execution block at the very end of your response inside a standard json code block.

Available Action Types for JSON:
- ADD_COMPONENT: { type: "ADD_COMPONENT", payload: { componentType: "Hero|Features|Pricing|CTA|Contact|Navbar|Footer|Text|Heading", position: "bottom", props: {...} } }
- UPDATE_COMPONENT: { type: "UPDATE_COMPONENT", payload: { componentId: "id", props: {...} } }
- UPDATE_THEME: { type: "UPDATE_THEME", payload: { themeUpdates: { primaryColor: "#hex" } } }

Example response to "Add a pricing section at the bottom":
Sure, I'll add a beautiful pricing section to the bottom of the page right now. I've included 3 dynamic tiers!

\`\`\`json
{
  "actions": [
    {
      "type": "ADD_COMPONENT",
      "payload": {
        "componentType": "Pricing",
        "position": "bottom",
        "props": {
           "title": "Simple Pricing",
           "description": "Choose the perfect plan.",
           "plans": [{ "name": "Basic", "price": "$10" }]
        }
      }
    }
  ]
}
\`\`\`

If answering a question that doesn't require modifying the page, just respond naturally without a JSON block.
Keep your conversational response brief and friendly!
`;

    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      systemInstruction: systemInstruction 
    });

    const chat = model.startChat({
       history: history
    });

    const resultStream = await chat.sendMessageStream(message);

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of resultStream) {
            const chunkText = chunk.text();
            if (chunkText) {
              controller.enqueue(encoder.encode(chunkText));
            }
          }
          controller.close();
        } catch (error) {
          console.error("Streaming error inside response:", error);
          controller.error(error);
        }
      }
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive"
      }
    });

  } catch (error) {
    console.error("[AI Chat Streaming Error]:", error);
    return new Response(JSON.stringify({ error: "Failed to stream chat" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
