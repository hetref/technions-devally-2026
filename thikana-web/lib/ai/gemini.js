/**
 * GEMINI AI UTILITY
 * High-accuracy JSON generation for layout builder
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Clean up common JSON issues
 */
function cleanupJSON(jsonText) {
  return jsonText
    .replace(/,(\s*[}\]])/g, '$1')  // Remove trailing commas
    .replace(/([{,]\s*)(\w+):/g, '$1"$2":')  // Quote unquoted keys
    .trim();
}

/**
 * Aggressive JSON cleanup as last resort
 */
function aggressiveJSONCleanup(jsonText) {
  let cleaned = jsonText;
  
  // Remove all trailing commas more aggressively
  cleaned = cleaned.replace(/,(\s*[}\]])/g, '$1');
  
  // Fix unquoted keys
  cleaned = cleaned.replace(/([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)(\s*):/g, '$1"$2"$3:');
  
  // Fix single quotes to double quotes (but not in content)
  cleaned = cleaned.replace(/'/g, '"');
  
  // Remove comments (// and /* */)
  cleaned = cleaned.replace(/\/\/.*$/gm, '');
  cleaned = cleaned.replace(/\/\*[\s\S]*?\*\//g, '');
  
  // Fix missing commas between properties
  cleaned = cleaned.replace(/"\s*\n\s*"/g, '",\n"');
  cleaned = cleaned.replace(/}\s*\n\s*"/g, '},\n"');
  cleaned = cleaned.replace(/]\s*\n\s*"/g, '],\n"');
  
  // Try to fix truncated JSON by closing open structures
  const openBraces = (cleaned.match(/{/g) || []).length;
  const closeBraces = (cleaned.match(/}/g) || []).length;
  const openBrackets = (cleaned.match(/\[/g) || []).length;
  const closeBrackets = (cleaned.match(/]/g) || []).length;
  
  // Add missing closing braces
  if (openBraces > closeBraces) {
    const missing = openBraces - closeBraces;
    console.log(`Adding ${missing} missing closing braces`);
    cleaned += '\n' + '}'.repeat(missing);
  }
  
  // Add missing closing brackets
  if (openBrackets > closeBrackets) {
    const missing = openBrackets - closeBrackets;
    console.log(`Adding ${missing} missing closing brackets`);
    cleaned += '\n' + ']'.repeat(missing);
  }
  
  return cleaned.trim();
}

/**
 * Generate layout JSON with strict validation
 */
export async function generateLayout({ description, businessType, pageType = 'home' }) {
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-2.5-flash',
    generationConfig: {
      temperature: 0.7,
      topP: 0.8,
      topK: 40,
      maxOutputTokens: 8192,
      responseMimeType: "application/json",  // Force JSON output
    }
  });

  const prompt = buildLayoutPrompt(description, businessType, pageType);
  
  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log('=== RAW AI RESPONSE ===');
    console.log(text);
    console.log('======================');
    
    // Extract JSON from response (handles markdown code blocks)
    let jsonText = text;
    
    // Try to extract from markdown code block first
    const codeBlockMatch = text.match(/```(?:json)?\s*\n([\s\S]*?)\n```/);
    if (codeBlockMatch) {
      jsonText = codeBlockMatch[1];
    } else {
      // Try to find JSON object
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonText = jsonMatch[0];
      }
    }
    
    console.log('=== EXTRACTED JSON ===');
    console.log(jsonText);
    console.log('=====================');
    
    // Clean up common JSON issues
    jsonText = jsonText
      .replace(/,(\s*[}\]])/g, '$1')  // Remove trailing commas
      .replace(/([{,]\s*)(\w+):/g, '$1"$2":')  // Quote unquoted keys
      .replace(/\n\s*\n/g, '\n')  // Remove empty lines
      .trim();
    
    // Parse and validate
    let layout;
    try {
      layout = JSON.parse(jsonText);
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      console.error('Error position:', parseError.message);
      console.error('JSON excerpt around error:', jsonText.substring(Math.max(0, 12300), 12400));
      
      // Try aggressive cleanup
      console.log('Attempting aggressive JSON cleanup...');
      const cleanedJson = aggressiveJSONCleanup(jsonText);
      
      try {
        layout = JSON.parse(cleanedJson);
        console.log('Successfully parsed after aggressive cleanup');
      } catch (secondError) {
        console.error('Still failed after cleanup:', secondError);
        throw new Error(`Invalid JSON from AI: ${parseError.message}`);
      }
    }
    
    // Sanitize to fix common AI mistakes
    layout = sanitizeLayout(layout);
    
    // Validate structure
    validateLayout(layout);
    
    return {
      success: true,
      layout: layout.containers,
      metadata: {
        businessType,
        pageType,
        generatedAt: new Date().toISOString()
      }
    };
  } catch (error) {
    console.error('Gemini generation error:', error);
    return {
      success: false,
      error: error.message,
      fallback: getFallbackLayout(businessType, pageType)
    };
  }
}

/**
 * Generate content for a specific component
 */
export async function generateComponentContent({ componentType, context, businessType }) {
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-2.5-flash',
    generationConfig: {
      temperature: 0.8,
      maxOutputTokens: 1024,
    }
  });

  const prompt = buildContentPrompt(componentType, context, businessType);
  
  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Extract JSON
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/\{[\s\S]*\}/);
    const jsonText = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : text;
    
    const content = JSON.parse(jsonText);
    
    return {
      success: true,
      content
    };
  } catch (error) {
    console.error('Content generation error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Build detailed prompt for layout generation
 */
function buildLayoutPrompt(description, businessType, pageType) {
  return `You are an elite, award-winning web designer and Art Director creating a state-of-the-art ${pageType} page for a ${businessType} business.

DESCRIPTION: ${description}

AESTHETIC & THEME RULES - MANDATORY:
1. You MUST design a premium, modern SaaS look. The default theme should be a sleek Dark Mode unless explicitly requested otherwise.
2. For container background colors, use deep rich darks: "#09090b", "#020817", or "#000000". Alternate slightly between containers (e.g., "#09090b" then "#0f172a") to establish visual depth.
3. For text colors, use high contrast aesthetic colors: predominantly "#ffffff", "#f8fafc", or "#cbd5e1".
4. For Button backgrounds or small component accents, use vibrant glowing gradients or vivid solid colors (like "#ec4899", "#8b5cf6", or "#3b82f6") tailored to the business brand.
5. Injected typography: ALWAYS set the "fontFamily" on text/heading styles to '"Inter", system-ui, sans-serif' or '"Plus Jakarta Sans", ui-sans-serif'.
6. Do NOT use standard boring colors like "#f3f4f6" or "#1f2937" (those are for legacy enterprise apps). We are building V0/Lovable tier aesthetic websites.

CRITICAL: Use ONLY these 9 component types. DO NOT create any other components:
1. Hero
2. Features
3. CTA
4. Text
5. Heading
6. Image
7. Button
8. Gallery
9. Navbar

DO NOT USE: Footer, Video, Map, or any other components not listed above.

CRITICAL JSON STRUCTURE - Follow EXACTLY:

{
  "containers": [
    {
      "id": "container-1",
      "type": "container",
      "settings": {
        "direction": "horizontal",
        "contentWidth": "boxed",
        "maxWidth": 1280,
        "gap": 16,
        "verticalAlign": "stretch"
      },
      "styles": {
        "backgroundColor": "#ffffff",
        "paddingTop": 60,
        "paddingBottom": 60
      },
      "columns": [
        {
          "id": "col-1",
          "width": 12,
          "components": [
            {
              "id": "hero-1",
              "type": "Hero",
              "props": {
                "title": "Your Compelling Title",
                "subtitle": "Engaging subtitle text",
                "ctaText": "Get Started",
                "ctaLink": "#contact",
                "backgroundImage": ""
              },
              "styles": {
                "backgroundColor": "#f3f4f6",
                "textColor": "#1f2937",
                "paddingTop": 80,
                "paddingBottom": 80
              }
            }
          ]
        }
      ]
    }
  ]
}

COMPONENT SCHEMAS - USE EXACTLY AS SHOWN:

1. Hero (Main banner):
{
  "id": "hero-1",
  "type": "Hero",
  "props": {
    "title": "Your Main Headline",
    "subtitle": "Supporting text here",
    "ctaText": "Button Text",
    "ctaLink": "#contact"
  },
  "styles": {
    "backgroundColor": "#f3f4f6",
    "textColor": "#1f2937",
    "paddingTop": 80,
    "paddingBottom": 80
  }
}

2. Features (Feature grid):
{
  "id": "features-1",
  "type": "Features",
  "props": {
    "heading": "Why Choose Us",
    "items": [
      {"icon": "⚡", "title": "Fast", "description": "Lightning fast performance"},
      {"icon": "🔒", "title": "Secure", "description": "Bank-level security"},
      {"icon": "💡", "title": "Smart", "description": "Intelligent features"}
    ]
  },
  "styles": {
    "backgroundColor": "#ffffff",
    "paddingTop": 60,
    "paddingBottom": 60
  }
}

3. CTA (Call to action):
{
  "id": "cta-1",
  "type": "CTA",
  "props": {
    "title": "Ready to Get Started?",
    "description": "Join us today",
    "buttonText": "Sign Up Now",
    "buttonLink": "#signup"
  },
  "styles": {
    "backgroundColor": "#3b82f6",
    "textColor": "#ffffff",
    "paddingTop": 60,
    "paddingBottom": 60
  }
}

4. Heading:
{
  "id": "heading-1",
  "type": "Heading",
  "props": {
    "text": "Section Title",
    "level": "h2"
  },
  "styles": {
    "textColor": "#1f2937",
    "marginBottom": 20
  }
}
IMPORTANT: level MUST be string "h1", "h2", "h3", "h4", "h5", or "h6"

5. Text:
{
  "id": "text-1",
  "type": "Text",
  "props": {
    "content": "Your paragraph text here. Make it engaging and professional.",
    "variant": "p"
  },
  "styles": {
    "textColor": "#4b5563",
    "lineHeight": 1.6
  }
}
IMPORTANT: variant MUST be string "p", "h1", "h2", "h3", "h4", "h5", or "h6"

6. Button:
{
  "id": "button-1",
  "type": "Button",
  "props": {
    "text": "Click Me",
    "link": "#contact",
    "variant": "primary"
  },
  "styles": {
    "backgroundColor": "#3b82f6",
    "textColor": "#ffffff"
  }
}
IMPORTANT: variant MUST be string "primary", "secondary", or "outline"

7. Image:
{
  "id": "image-1",
  "type": "Image",
  "props": {
    "src": "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800",
    "alt": "Description of image",
    "width": 800,
    "height": 400
  },
  "styles": {
    "borderRadius": 8
  }
}
IMPORTANT: width and height MUST be numbers (not strings)

8. Gallery:
{
  "id": "gallery-1",
  "type": "Gallery",
  "props": {
    "images": [
      {"src": "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400", "alt": "Image 1"},
      {"src": "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400", "alt": "Image 2"},
      {"src": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400", "alt": "Image 3"}
    ],
    "columns": 3,
    "gap": 16
  },
  "styles": {
    "paddingTop": 40,
    "paddingBottom": 40
  }
}
IMPORTANT: columns and gap MUST be numbers

9. Navbar:
{
  "id": "navbar-1",
  "type": "Navbar",
  "props": {
    "brandName": "Your Brand",
    "links": [
      {"text": "Home", "link": "#home"},
      {"text": "About", "link": "#about"},
      {"text": "Services", "link": "#services"},
      {"text": "Contact", "link": "#contact"}
    ]
  },
  "styles": {
    "backgroundColor": "#ffffff",
    "textColor": "#1f2937"
  }
}

RULES - FOLLOW STRICTLY:
1. Use ONLY the 9 components listed above (Hero, Features, CTA, Text, Heading, Image, Button, Gallery, Navbar)
2. DO NOT create Footer, Video, Map, or any other components
3. Each container MUST have unique id starting with "container-"
4. Each column MUST have unique id starting with "col-"
5. Each component MUST have unique id like "hero-1", "features-1", "heading-1"
6. Column widths MUST sum to 12 in horizontal containers
7. Use realistic, professional content (no placeholders like "Lorem ipsum")
8. Include 3-5 containers for a complete page
9. Vary component types for visual interest
10. Use appropriate colors (hex codes as strings like "#ffffff") according to the AESTHETIC & THEME RULES above. Default to gorgeous Dark Mode styling.
11. Numeric values (paddingTop, width, height, gap, maxWidth, columns) MUST be numbers without quotes
12. String values (level, variant, text, title, link) MUST be strings with quotes
13. For Heading: level MUST be string "h1", "h2", "h3", "h4", "h5", or "h6"
14. For Text: variant MUST be string "p", "h1", "h2", "h3", "h4", "h5", or "h6"
15. For Button: variant MUST be string "primary", "secondary", or "outline"
16. For images, use Unsplash URLs: https://images.unsplash.com/photo-[id]?w=800
17. Return ONLY valid JSON matching the structure above
18. NO trailing commas in arrays or objects
19. ALL property names MUST be in double quotes
20. NO comments in JSON

EXAMPLE COMPLETE LAYOUT:

{
  "containers": [
    {
      "id": "container-1",
      "type": "container",
      "settings": {
        "direction": "horizontal",
        "contentWidth": "boxed",
        "maxWidth": 1280,
        "gap": 16,
        "verticalAlign": "stretch"
      },
      "styles": {
        "backgroundColor": "#ffffff",
        "paddingTop": 60,
        "paddingBottom": 60
      },
      "columns": [
        {
          "id": "col-1-1",
          "width": 12,
          "components": [
            {
              "id": "navbar-1",
              "type": "Navbar",
              "props": {
                "brandName": "My Business",
                "links": [
                  {"text": "Home", "link": "#home"},
                  {"text": "About", "link": "#about"},
                  {"text": "Contact", "link": "#contact"}
                ]
              },
              "styles": {
                "backgroundColor": "#ffffff",
                "textColor": "#1f2937"
              }
            }
          ]
        }
      ]
    },
    {
      "id": "container-2",
      "type": "container",
      "settings": {
        "direction": "horizontal",
        "contentWidth": "full",
        "gap": 0
      },
      "styles": {
        "backgroundColor": "#f3f4f6",
        "paddingTop": 80,
        "paddingBottom": 80
      },
      "columns": [
        {
          "id": "col-2-1",
          "width": 12,
          "components": [
            {
              "id": "hero-1",
              "type": "Hero",
              "props": {
                "title": "Welcome to Our Business",
                "subtitle": "We provide excellent service",
                "ctaText": "Get Started",
                "ctaLink": "#contact"
              },
              "styles": {
                "backgroundColor": "transparent",
                "textColor": "#1f2937"
              }
            }
          ]
        }
      ]
    },
    {
      "id": "container-3",
      "type": "container",
      "settings": {
        "direction": "horizontal",
        "contentWidth": "boxed",
        "maxWidth": 1280,
        "gap": 16
      },
      "styles": {
        "backgroundColor": "#ffffff",
        "paddingTop": 60,
        "paddingBottom": 60
      },
      "columns": [
        {
          "id": "col-3-1",
          "width": 12,
          "components": [
            {
              "id": "features-1",
              "type": "Features",
              "props": {
                "heading": "Our Services",
                "items": [
                  {"icon": "⚡", "title": "Fast", "description": "Quick service"},
                  {"icon": "🔒", "title": "Secure", "description": "Safe and secure"},
                  {"icon": "💡", "title": "Smart", "description": "Intelligent solutions"}
                ]
              },
              "styles": {
                "backgroundColor": "transparent"
              }
            }
          ]
        }
      ]
    }
  ]
}

Generate a complete, valid JSON layout now. Remember: ONLY use the 9 allowed components!`;
}

/**
 * Build prompt for component content generation
 */
function buildContentPrompt(componentType, context, businessType) {
  const prompts = {
    Hero: `Generate Hero section content for a ${businessType}. Context: ${context}
    
Return JSON:
{
  "title": "Compelling headline (max 60 chars)",
  "subtitle": "Engaging description (max 120 chars)",
  "ctaText": "Action button text (max 20 chars)",
  "ctaLink": "#contact"
}`,

    Features: `Generate 3-4 feature items for a ${businessType}. Context: ${context}

Return JSON:
{
  "heading": "Section title",
  "items": [
    {
      "icon": "⚡",
      "title": "Feature name",
      "description": "Brief description"
    }
  ]
}`,

    CTA: `Generate call-to-action content for a ${businessType}. Context: ${context}

Return JSON:
{
  "title": "Compelling CTA headline",
  "description": "Supporting text",
  "buttonText": "Action text",
  "buttonLink": "#contact"
}`,

    Text: `Generate paragraph content for a ${businessType}. Context: ${context}

Return JSON:
{
  "content": "Professional paragraph text (2-3 sentences)"
}`,

    Heading: `Generate section heading for a ${businessType}. Context: ${context}

Return JSON:
{
  "text": "Section heading"
}`
  };

  return prompts[componentType] || `Generate content for ${componentType} component. Return valid JSON only.`;
}

/**
 * Sanitize AI-generated layout to fix common issues
 */
function sanitizeLayout(layout) {
  if (!layout || !layout.containers) return layout;

  const validComponents = ['Hero', 'Features', 'CTA', 'Text', 'Heading', 'Image', 'Button', 'Gallery', 'Navbar'];

  layout.containers.forEach(container => {
    container.columns?.forEach(column => {
      // Filter out invalid components
      column.components = column.components?.filter(component => {
        if (!validComponents.includes(component.type)) {
          console.warn(`Removing invalid component type: ${component.type}`);
          return false;
        }
        return true;
      }) || [];

      column.components.forEach(component => {
        // Fix Heading component - ensure level is a string
        if (component.type === 'Heading' && component.props) {
          if (typeof component.props.level === 'number') {
            component.props.level = `h${component.props.level}`;
          }
          if (!component.props.level || !['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(component.props.level)) {
            component.props.level = 'h2';
          }
        }

        // Fix Text component - ensure variant is a string
        if (component.type === 'Text' && component.props) {
          if (typeof component.props.variant === 'number') {
            component.props.variant = `h${component.props.variant}`;
          }
          if (!component.props.variant) {
            component.props.variant = 'p';
          }
        }

        // Fix Button component - ensure variant is valid
        if (component.type === 'Button' && component.props) {
          if (!['primary', 'secondary', 'outline'].includes(component.props.variant)) {
            component.props.variant = 'primary';
          }
        }

        // Fix Gallery component - ensure columns and gap are numbers
        if (component.type === 'Gallery' && component.props) {
          if (typeof component.props.columns === 'string') {
            component.props.columns = parseInt(component.props.columns) || 3;
          }
          if (typeof component.props.gap === 'string') {
            component.props.gap = parseInt(component.props.gap) || 16;
          }
        }

        // Fix Image component - ensure width and height are numbers
        if (component.type === 'Image' && component.props) {
          if (typeof component.props.width === 'string') {
            component.props.width = parseInt(component.props.width) || 800;
          }
          if (typeof component.props.height === 'string') {
            component.props.height = parseInt(component.props.height) || 400;
          }
        }

        // Ensure all numeric style values are numbers
        if (component.styles) {
          ['paddingTop', 'paddingBottom', 'paddingLeft', 'paddingRight', 'marginTop', 'marginBottom', 'borderRadius', 'lineHeight'].forEach(key => {
            if (component.styles[key] && typeof component.styles[key] === 'string') {
              component.styles[key] = parseFloat(component.styles[key]) || 0;
            }
          });
        }

        // Ensure all props are defined
        if (!component.props) {
          component.props = {};
        }
        if (!component.styles) {
          component.styles = {};
        }
      });
    });
  });

  return layout;
}

/**
 * Validate layout structure
 */
function validateLayout(layout) {
  if (!layout || !layout.containers || !Array.isArray(layout.containers)) {
    throw new Error('Invalid layout structure: missing containers array');
  }

  layout.containers.forEach((container, idx) => {
    if (!container.id || !container.type) {
      throw new Error(`Container ${idx}: missing id or type`);
    }
    
    if (!container.columns || !Array.isArray(container.columns)) {
      throw new Error(`Container ${container.id}: missing columns array`);
    }

    container.columns.forEach((column, colIdx) => {
      if (!column.id || typeof column.width !== 'number') {
        throw new Error(`Container ${container.id}, column ${colIdx}: invalid structure`);
      }

      if (!column.components || !Array.isArray(column.components)) {
        throw new Error(`Container ${container.id}, column ${column.id}: missing components array`);
      }

      column.components.forEach((component, compIdx) => {
        if (!component.id || !component.type) {
          throw new Error(`Container ${container.id}, column ${column.id}, component ${compIdx}: missing id or type`);
        }
      });
    });
  });

  return true;
}

/**
 * Fallback layouts for common business types
 */
function getFallbackLayout(businessType, pageType) {
  const fallbacks = {
    restaurant: [
      {
        id: 'container-1',
        type: 'container',
        settings: { direction: 'horizontal', contentWidth: 'boxed', maxWidth: 1280, gap: 16 },
        styles: { backgroundColor: '#ffffff', paddingTop: 60, paddingBottom: 60 },
        columns: [{
          id: 'col-1',
          width: 12,
          components: [{
            id: 'hero-1',
            type: 'Hero',
            props: {
              title: 'Welcome to Our Restaurant',
              subtitle: 'Experience culinary excellence',
              ctaText: 'View Menu',
              ctaLink: '#menu'
            },
            styles: { backgroundColor: '#f3f4f6', paddingTop: 80, paddingBottom: 80 }
          }]
        }]
      }
    ],
    gym: [
      {
        id: 'container-1',
        type: 'container',
        settings: { direction: 'horizontal', contentWidth: 'boxed', maxWidth: 1280, gap: 16 },
        styles: { backgroundColor: '#ffffff', paddingTop: 60, paddingBottom: 60 },
        columns: [{
          id: 'col-1',
          width: 12,
          components: [{
            id: 'hero-1',
            type: 'Hero',
            props: {
              title: 'Transform Your Body',
              subtitle: 'Join our fitness community today',
              ctaText: 'Start Free Trial',
              ctaLink: '#signup'
            },
            styles: { backgroundColor: '#1f2937', textColor: '#ffffff', paddingTop: 80, paddingBottom: 80 }
          }]
        }]
      }
    ]
  };

  return fallbacks[businessType.toLowerCase()] || fallbacks.restaurant;
}
