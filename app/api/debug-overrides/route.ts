import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { createEmbedding } from "@/lib/openai";

export async function POST(request: NextRequest) {
  try {
    const { question } = await request.json();
    
    if (!question) {
      return NextResponse.json({ error: "Question is required" }, { status: 400 });
    }

    console.log('🔍 Debugging overrides for question:', question);
    
    const supabase = getSupabaseAdmin();
    
    // Check if we have any overrides at all
    const { data: allOverrides } = await supabase
      .from('expert_overrides')
      .select('*')
      .eq('is_active', true);
    
    console.log('📊 Total active overrides:', allOverrides?.length || 0);
    
    if (!allOverrides || allOverrides.length === 0) {
      return NextResponse.json({
        debug: {
          totalOverrides: 0,
          message: "No active overrides found in database"
        }
      });
    }

    // Generate embedding for the question
    const questionEmbedding = await createEmbedding(question);
    console.log('🧠 Generated embedding, dimensions:', questionEmbedding.length);

    // Try to search for overrides using the function
    try {
      const { data: searchResults, error: searchError } = await supabase
        .rpc('search_expert_overrides', {
          query_embedding: questionEmbedding,
          similarity_threshold: 0.5, // Lower threshold for debugging
          document_ids: null,
          limit_count: 5
        });

      if (searchError) {
        console.error('RPC search error:', searchError);
        return NextResponse.json({
          debug: {
            totalOverrides: allOverrides.length,
            rpcError: searchError.message,
            functionExists: false
          }
        });
      }

      console.log('🔍 Search results:', searchResults?.length || 0);

      // Also do manual similarity calculation for comparison
      const manualResults = [];
      for (const override of allOverrides) {
        if (override.question_embedding) {
          // Calculate cosine similarity manually for debugging
          const similarity = 1 - cosineSimilarity(questionEmbedding, override.question_embedding);
          manualResults.push({
            id: override.id,
            original_question: override.original_question,
            corrected_answer: override.corrected_answer,
            similarity: similarity,
            confidence_threshold: override.confidence_threshold,
            would_trigger: similarity >= override.confidence_threshold
          });
        }
      }

      manualResults.sort((a, b) => b.similarity - a.similarity);

      return NextResponse.json({
        debug: {
          question: question,
          totalOverrides: allOverrides.length,
          rpcResults: searchResults?.length || 0,
          manualResults: manualResults.slice(0, 3),
          bestMatch: manualResults[0] || null,
          functionExists: true,
          embedDimensions: questionEmbedding.length
        }
      });

    } catch (rpcError) {
      console.error('RPC function error:', rpcError);
      return NextResponse.json({
        debug: {
          totalOverrides: allOverrides.length,
          rpcError: rpcError instanceof Error ? rpcError.message : 'Unknown RPC error',
          functionExists: false
        }
      });
    }

  } catch (error) {
    console.error('Debug override error:', error);
    return NextResponse.json(
      { error: 'Debug failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Simple cosine similarity calculation for debugging
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  if (normA === 0 || normB === 0) return 0;
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}