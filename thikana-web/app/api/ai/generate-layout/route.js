import { NextResponse } from 'next/server';
import { generateLayout } from '@/lib/ai/gemini';
import { nanoid } from 'nanoid';

export async function POST(request) {
  try {
    const body = await request.json();
    const { description, businessType, pageType, brandKit } = body;

    if (!description || !businessType) {
      return NextResponse.json(
        { error: 'Description and business type are required' },
        { status: 400 }
      );
    }

    // Generate layout with Gemini natively using the standalone utility mapping the prompt
    const result = await generateLayout({
      description,
      businessType,
      pageType: pageType || 'home',
      brandKit  // Pass brand kit to AI
    });

    if (!result.success) {
      return NextResponse.json(
        { 
          error: result.error,
          fallback: result.fallback,
          message: 'AI generation failed, using fallback layout'
        },
        { status: 200 } // Still return 200 with fallback
      );
    }
    
    // Safety check: ensure robust Nanoid keys strictly enforced for Zustand hydration map
    if (result.layout && Array.isArray(result.layout)) {
      result.layout.forEach(container => {
        container.id = nanoid();
        container.settings = container.settings || { direction: "horizontal", contentWidth: "boxed", maxWidth: 1280, gap: 24, verticalAlign: "center" };
        container.styles = container.styles || { paddingTop: 60, paddingBottom: 60, paddingLeft: 0, paddingRight: 0, marginTop: 0, marginBottom: 0 };
        
        container.columns?.forEach(column => {
          column.id = nanoid();
          column.styles = column.styles || {};
          
          column.components?.forEach(component => {
             component.id = nanoid();
             component.styles = component.styles || {};
          });
        });
      });
    }

    return NextResponse.json({
      success: true,
      layout: result.layout,
      metadata: result.metadata
    });

  } catch (error) {
    console.error('AI generation API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate layout', details: error.message },
      { status: 500 }
    );
  }
}
