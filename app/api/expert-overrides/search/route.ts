import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { createEmbedding } from "@/lib/openai";

export async function POST(request: NextRequest) {
  try {
    const { question, documentIds, similarityThreshold = 0.85 } = await request.json();
    
    if (!question) {
      return NextResponse.json(
        { error: "Question is required" },
        { status: 400 }
      );
    }
    
    console.log('🔍 Searching for expert overrides for:', question);
    
    // Generate embedding for the question
    const questionEmbedding = await createEmbedding(question);
    
    const supabase = getSupabaseAdmin();
    
    // Search for relevant overrides
    const { data: overrides, error: searchError } = await supabase
      .rpc('search_expert_overrides', {
        query_embedding: questionEmbedding,
        similarity_threshold: similarityThreshold,
        doc_ids: documentIds || null,
        limit_count: 1
      });
    
    if (searchError) {
      console.error('Override search error:', searchError);
      return NextResponse.json(
        { error: "Failed to search overrides" },
        { status: 500 }
      );
    }
    
    if (overrides && overrides.length > 0) {
      const override = overrides[0];
      console.log(`✅ Found override with ${(override.similarity * 100).toFixed(1)}% similarity`);
      
      // Record usage
      await supabase.rpc('record_override_usage', {
        override_id_param: override.id,
        question_asked_param: question,
        similarity_score_param: override.similarity,
        user_id_param: null // TODO: Pass actual user ID when auth is implemented
      });
      
      return NextResponse.json({
        found: true,
        override: override
      });
    }
    
    console.log('❌ No matching override found');
    return NextResponse.json({
      found: false,
      override: null
    });
    
  } catch (error) {
    console.error("Override search error:", error);
    return NextResponse.json(
      { error: "Failed to search overrides" },
      { status: 500 }
    );
  }
}