import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { createEmbedding } from "@/lib/openai";

export async function POST(request: NextRequest) {
  try {
    const { query, documentId } = await request.json();

    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { error: "Query is required" },
        { status: 400 }
      );
    }

    console.log('🧪 Test search:', { query, documentId });

    const supabase = getSupabaseAdmin();

    // Generate embedding for the query
    const queryEmbedding = await createEmbedding(query);
    console.log('✅ Query embedding created');

    // Search for similar chunks
    const { data: results, error: searchError } = await supabase
      .rpc('search_document_chunks', {
        query_embedding: queryEmbedding,
        match_count: 10,
        document_id_filter: documentId || null
      });

    if (searchError) {
      console.error('Search error:', searchError);
      return NextResponse.json(
        { error: "Search failed" },
        { status: 500 }
      );
    }

    console.log(`📊 Found ${results?.length || 0} results`);

    // Add similarity analysis
    const analyzedResults = results?.map(result => ({
      ...result,
      similarity_percentage: (result.similarity * 100).toFixed(1),
      relevance: result.similarity > 0.8 ? 'high' : 
                 result.similarity > 0.6 ? 'medium' : 'low'
    })) || [];

    // Check if we're getting good matches
    const highQualityMatches = analyzedResults.filter(r => r.similarity > 0.7).length;
    const avgSimilarity = analyzedResults.length > 0 
      ? analyzedResults.reduce((sum, r) => sum + r.similarity, 0) / analyzedResults.length
      : 0;

    return NextResponse.json({
      query,
      documentId,
      results: analyzedResults,
      stats: {
        totalResults: analyzedResults.length,
        highQualityMatches,
        averageSimilarity: avgSimilarity.toFixed(3),
        embeddingLength: queryEmbedding.length
      },
      debug: {
        message: highQualityMatches === 0 
          ? "No high-quality matches found. Consider: 1) Checking if documents are properly indexed, 2) Adjusting chunk size, 3) Rephrasing the query"
          : `Found ${highQualityMatches} high-quality matches`
      }
    });

  } catch (error) {
    console.error("Test search error:", error);
    return NextResponse.json(
      { error: "Failed to perform test search" },
      { status: 500 }
    );
  }
}