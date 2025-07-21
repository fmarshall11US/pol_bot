import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { createEmbedding } from "@/lib/openai";

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    
    // Check documents
    const { data: documents, error: docError } = await supabase
      .from('documents')
      .select('*')
      .order('created_at', { ascending: false });
    
    // Check chunks
    const { data: chunks, error: chunkError } = await supabase
      .from('document_chunks')
      .select('*')
      .limit(3);
    
    // Test embedding creation
    let testEmbedding = null;
    let embeddingError = null;
    try {
      testEmbedding = await createEmbedding("test collision deductible");
    } catch (err) {
      embeddingError = err instanceof Error ? err.message : 'Unknown error';
    }
    
    // Test search if we have chunks
    let searchTest = null;
    if (chunks && chunks.length > 0 && testEmbedding) {
      try {
        const { data: searchResults, error: searchError } = await supabase
          .rpc('search_document_chunks', {
            query_embedding: testEmbedding,
            match_count: 3,
            document_id_filter: null
          });
        
        searchTest = {
          success: !searchError,
          error: searchError?.message,
          resultCount: searchResults?.length || 0,
          results: searchResults?.map(r => ({
            content: r.content.substring(0, 100) + '...',
            similarity: r.similarity
          })) || []
        };
      } catch (err) {
        searchTest = {
          success: false,
          error: err instanceof Error ? err.message : 'Unknown error'
        };
      }
    }
    
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      documents: {
        count: documents?.length || 0,
        error: docError?.message,
        list: documents?.map(d => ({
          id: d.id,
          name: d.file_name,
          size: d.file_size,
          created: d.created_at
        })) || []
      },
      chunks: {
        count: chunks?.length || 0,
        error: chunkError?.message,
        samples: chunks?.map(c => ({
          id: c.id,
          chunk_index: c.chunk_index,
          content_preview: c.content?.substring(0, 100) + '...',
          embedding_dimensions: c.embedding?.length || 0,
          has_embedding: !!c.embedding
        })) || []
      },
      embedding_test: {
        success: !!testEmbedding && !embeddingError,
        error: embeddingError,
        dimensions: testEmbedding?.length || 0
      },
      search_test: searchTest,
      diagnosis: {
        has_documents: (documents?.length || 0) > 0,
        has_chunks: (chunks?.length || 0) > 0,
        embedding_creation_works: !!testEmbedding && !embeddingError,
        search_function_works: searchTest?.success || false
      }
    });

  } catch (error) {
    console.error("Current state debug error:", error);
    return NextResponse.json({
      error: "Failed to debug current state",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}