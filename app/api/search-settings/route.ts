import { NextRequest, NextResponse } from "next/server";

// In a real app, this would be stored in a database per user
// eslint-disable-next-line prefer-const
let searchSettings = {
  similarityThreshold: 0.3,
  maxResults: 15,
  contextChunks: 5
};

export async function GET() {
  return NextResponse.json(searchSettings);
}

export async function POST(request: NextRequest) {
  try {
    const { similarityThreshold, maxResults, contextChunks } = await request.json();
    
    // Validate inputs
    if (similarityThreshold !== undefined) {
      if (similarityThreshold < 0 || similarityThreshold > 1) {
        return NextResponse.json(
          { error: "Similarity threshold must be between 0 and 1" },
          { status: 400 }
        );
      }
      searchSettings.similarityThreshold = similarityThreshold;
    }
    
    if (maxResults !== undefined) {
      if (maxResults < 1 || maxResults > 50) {
        return NextResponse.json(
          { error: "Max results must be between 1 and 50" },
          { status: 400 }
        );
      }
      searchSettings.maxResults = maxResults;
    }
    
    if (contextChunks !== undefined) {
      if (contextChunks < 1 || contextChunks > 10) {
        return NextResponse.json(
          { error: "Context chunks must be between 1 and 10" },
          { status: 400 }
        );
      }
      searchSettings.contextChunks = contextChunks;
    }
    
    return NextResponse.json({
      success: true,
      settings: searchSettings
    });
    
  } catch {
    return NextResponse.json(
      { error: "Invalid request data" },
      { status: 400 }
    );
  }
}