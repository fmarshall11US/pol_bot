import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  try {
    const { documentId } = await params;
    const supabase = getSupabaseAdmin();
    
    // Get document info
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .single();

    // Get document chunks
    const { data: chunks, error: chunksError } = await supabase
      .from('document_chunks')
      .select('*')
      .eq('document_id', documentId)
      .order('chunk_index');

    // Test the search function with a simple query
    const testEmbedding = Array(1536).fill(0.5); // Simple test embedding
    const { data: searchTest, error: searchError } = await supabase
      .rpc('search_document_chunks', {
        query_embedding: testEmbedding,
        match_count: 3,
        document_id_filter: documentId
      });

    return NextResponse.json({
      document,
      chunks: chunks?.map(chunk => ({
        id: chunk.id,
        chunk_index: chunk.chunk_index,
        content: chunk.content.substring(0, 200) + '...',
        hasEmbedding: !!chunk.embedding,
        embeddingLength: chunk.embedding ? chunk.embedding.length : 0
      })),
      searchTest: {
        results: searchTest?.length || 0,
        error: searchError,
        sample: searchTest?.[0] ? {
          content: searchTest[0].content.substring(0, 100) + '...',
          similarity: searchTest[0].similarity
        } : null
      },
      errors: {
        docError,
        chunksError
      }
    });
  } catch (error) {
    console.error("Debug error:", error);
    return NextResponse.json(
      { error: "Failed to debug document" },
      { status: 500 }
    );
  }
}