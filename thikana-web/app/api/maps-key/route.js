import { NextResponse } from "next/server";

export async function GET() {
    // Only return the key to client requests, avoiding bundling it directly in the frontend build
    return NextResponse.json({
        key: process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    });
}
