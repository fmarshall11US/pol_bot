import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { createEmbedding } from "@/lib/openai";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const documentId = searchParams.get('documentId');
    
    const supabase = getSupabaseAdmin();
    
    // First, let's search for chunks containing specific keywords
    console.log('🔍 Searching for specific content related to "60 days" and "replacement auto"...');
    
    // Search for chunks containing "60 days"
    const { data: sixtyDaysChunks, error: error1 } = await supabase
      .from('document_chunks')
      .select('id, document_id, chunk_index, content')
      .ilike('content', '%60 days%')
      .eq(documentId ? 'document_id' : 'id', documentId || supabase.from('document_chunks').select('id'));
    
    // Search for chunks containing "replacement auto" or "replace auto"
    const { data: replacementAutoChunks, error: error2 } = await supabase
      .from('document_chunks')
      .select('id, document_id, chunk_index, content')
      .or('content.ilike.%replacement auto%,content.ilike.%replace auto%,content.ilike.%replacing auto%')
      .eq(documentId ? 'document_id' : 'id', documentId || supabase.from('document_chunks').select('id'));
    
    // Search for chunks containing "acquire" 
    const { data: acquireChunks, error: error3 } = await supabase
      .from('document_chunks')
      .select('id, document_id, chunk_index, content')
      .ilike('content', '%acquire%')
      .eq(documentId ? 'document_id' : 'id', documentId || supabase.from('document_chunks').select('id'));
    
    // Search for chunks containing "notify" or "tell us"
    const { data: notifyChunks, error: error4 } = await supabase
      .from('document_chunks')
      .select('id, document_id, chunk_index, content')
      .or('content.ilike.%notify%,content.ilike.%tell us%')
      .eq(documentId ? 'document_id' : 'id', documentId || supabase.from('document_chunks').select('id'));
    
    // Now let's test vector search with different queries
    const testQueries = [
      "what happens if you acquire a replacement auto",
      "60 days replacement auto",
      "notify within 60 days",
      "acquire additional or replacement auto",
      "when to tell us about replacement auto"
    ];
    
    const vectorSearchResults: any[] = [];
    
    for (const query of testQueries) {
      console.log(`🧪 Testing vector search for: "${query}"`);
      
      const embedding = await createEmbedding(query);
      
      const { data: results, error: searchError } = await supabase
        .rpc('search_document_chunks', {
          query_embedding: embedding,
          match_count: 5,
          document_id_filter: documentId || null
        });
      
      vectorSearchResults.push({
        query,
        embeddingLength: embedding.length,
        results: results?.map((r: any) => ({
          similarity: r.similarity,
          chunkIndex: r.chunk_index,
          contentPreview: r.content.substring(0, 200) + '...',
          hasTargetContent: r.content.includes('60 days') || r.content.includes('replacement auto')
        })) || [],
        error: searchError?.message
      });
    }
    
    // Get total chunk count
    const { count: totalChunks } = await supabase
      .from('document_chunks')
      .select('*', { count: 'exact', head: true })
      .eq(documentId ? 'document_id' : 'id', documentId || supabase.from('document_chunks').select('id'));
    
    // Check embedding dimensions
    const { data: sampleChunk } = await supabase
      .from('document_chunks')
      .select('id, embedding')
      .eq(documentId ? 'document_id' : 'id', documentId || supabase.from('document_chunks').select('id'))
      .limit(1)
      .single();
    
    const debugInfo = {
      keywordSearchResults: {
        "60 days": {
          found: sixtyDaysChunks?.length || 0,
          chunks: sixtyDaysChunks?.map(c => ({
            chunkIndex: c.chunk_index,
            content: c.content.substring(0, 300) + '...'
          })) || [],
          error: error1?.message
        },
        "replacement auto": {
          found: replacementAutoChunks?.length || 0,
          chunks: replacementAutoChunks?.map(c => ({
            chunkIndex: c.chunk_index,
            content: c.content.substring(0, 300) + '...'
          })) || [],
          error: error2?.message
        },
        "acquire": {
          found: acquireChunks?.length || 0,
          chunks: acquireChunks?.map(c => ({
            chunkIndex: c.chunk_index,
            content: c.content.substring(0, 300) + '...'
          })) || [],
          error: error3?.message
        },
        "notify/tell us": {
          found: notifyChunks?.length || 0,
          chunks: notifyChunks?.map(c => ({
            chunkIndex: c.chunk_index,
            content: c.content.substring(0, 300) + '...'
          })) || [],
          error: error4?.message
        }
      },
      vectorSearchResults,
      documentStats: {
        totalChunks,
        documentId,
        sampleEmbeddingDimensions: sampleChunk?.embedding?.length || 0
      },
      targetContentAnalysis: {
        expectedContent: "You must tell us within 60 days when you acquire an additional or replacement auto.",
        foundInKeywordSearch: (sixtyDaysChunks?.some(c => c.content.includes('replacement auto')) || 
                               replacementAutoChunks?.some(c => c.content.includes('60 days'))) || false,
        bestMatchingSimilarity: Math.max(...vectorSearchResults.flatMap(r => 
          r.results.filter((res: any) => res.hasTargetContent).map((res: any) => res.similarity) || [0]
        ))
      }
    };
    
    return NextResponse.json(debugInfo);
    
  } catch (error) {
    console.error("Debug search content error:", error);
    return NextResponse.json({
      error: "Failed to debug search content",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}