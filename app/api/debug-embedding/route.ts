import { NextResponse } from "next/server";
import { createEmbedding } from "@/lib/openai";

export async function POST() {
  try {
    // Test creating a simple embedding
    const testText = "This is a test of the OpenAI embedding system.";
    console.log('Testing embedding for:', testText);
    
    const embedding = await createEmbedding(testText);
    
    const debugInfo = {
      testText,
      embedding: {
        length: embedding.length,
        first5Values: embedding.slice(0, 5),
        last5Values: embedding.slice(-5),
        type: typeof embedding,
        isArray: Array.isArray(embedding),
        sample: embedding[0]
      },
      expected: {
        length: 1536,
        type: "number[]"
      },
      diagnosis: {
        correctLength: embedding.length === 1536,
        correctType: Array.isArray(embedding) && typeof embedding[0] === 'number',
        issue: embedding.length !== 1536 ? `Wrong length: expected 1536, got ${embedding.length}` : null
      }
    };

    console.log('Embedding debug:', debugInfo);
    
    return NextResponse.json(debugInfo);

  } catch (error) {
    console.error("Embedding debug error:", error);
    return NextResponse.json({
      error: "Failed to test embedding",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}