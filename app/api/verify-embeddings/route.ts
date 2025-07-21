import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    
    // Check documents
    const { data: documents, error: docError } = await supabase
      .from('documents')
      .select('id, file_name, created_at')
      .order('created_at', { ascending: false });
    
    if (docError) throw docError;
    
    // Check chunks and embeddings
    const { data: chunks, error: chunkError } = await supabase
      .from('document_chunks')
      .select('id, document_id, chunk_index, content, embedding')
      .limit(5);
    
    if (chunkError) throw chunkError;
    
    // Analyze embeddings
    const analysis = chunks?.map(chunk => ({
      id: chunk.id,
      chunk_index: chunk.chunk_index,
      content_preview: chunk.content?.substring(0, 100) + '...',
      embedding_length: chunk.embedding?.length || 0,
      has_correct_dimensions: chunk.embedding?.length === 1536,
      content_mentions_deductible: chunk.content?.toLowerCase().includes('deductible') || false,
      content_mentions_collision: chunk.content?.toLowerCase().includes('collision') || false
    }));
    
    // Search for deductible-related content
    const { data: deductibleChunks } = await supabase
      .from('document_chunks')
      .select('content')
      .or('content.ilike.%deductible%,content.ilike.%collision%')
      .limit(5);
    
    return NextResponse.json({
      documents: {
        count: documents?.length || 0,
        list: documents || []
      },
      chunks: {
        total_checked: chunks?.length || 0,
        analysis
      },
      deductible_content: {
        found: deductibleChunks?.length || 0,
        samples: deductibleChunks?.map(c => c.content.substring(0, 200) + '...') || []
      },
      diagnosis: {
        has_documents: (documents?.length || 0) > 0,
        has_chunks: (chunks?.length || 0) > 0,
        all_embeddings_correct: analysis?.every(a => a.has_correct_dimensions) || false,
        found_deductible_content: (deductibleChunks?.length || 0) > 0
      }
    });

  } catch (error) {
    console.error("Verify embeddings error:", error);
    return NextResponse.json({
      error: "Failed to verify embeddings",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}