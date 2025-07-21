import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET() {
  try {
    // First, check environment variables
    const envCheck = {
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      hasOpenAIKey: !!process.env.OPENAI_API_KEY,
      nodeEnv: process.env.NODE_ENV
    };
    
    console.log('Environment check:', envCheck);
    
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return NextResponse.json({
        error: 'Environment variables missing',
        envCheck,
        details: 'NEXT_PUBLIC_SUPABASE_URL is not set'
      }, { status: 500 });
    }
    
    const supabase = getSupabaseAdmin();

    // Check if documents exist
    const { data: documents, error: docsError } = await supabase
      .from('documents')
      .select('id, file_name, created_at')
      .limit(10);

    if (docsError) {
      return NextResponse.json({ 
        error: 'Documents query failed', 
        details: docsError 
      }, { status: 500 });
    }

    // Check if document chunks exist with embeddings
    const { data: chunks, error: chunksError } = await supabase
      .from('document_chunks')
      .select('id, document_id, chunk_index, embedding')
      .limit(5);

    if (chunksError) {
      return NextResponse.json({ 
        error: 'Chunks query failed', 
        details: chunksError 
      }, { status: 500 });
    }

    // Check if the search function exists
    const { data: searchTest, error: searchError } = await supabase
      .rpc('search_document_chunks', {
        query_embedding: Array(1536).fill(0.1),
        match_count: 1,
        document_id_filter: null
      });

    const debugInfo = {
      environment: {
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasSupabaseServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        hasOpenAIKey: !!process.env.OPENAI_API_KEY,
        nodeEnv: process.env.NODE_ENV
      },
      documents: {
        count: documents?.length || 0,
        list: documents?.map(d => ({
          id: d.id,
          name: d.file_name,
          created: d.created_at
        })) || []
      },
      chunks: {
        count: chunks?.length || 0,
        hasEmbeddings: chunks?.filter(c => c.embedding && c.embedding.length > 0).length || 0,
        samples: chunks?.map(c => ({
          id: c.id,
          document_id: c.document_id,
          chunk_index: c.chunk_index,
          embedding_length: c.embedding ? c.embedding.length : 0
        })) || []
      },
      searchFunction: {
        exists: !searchError,
        error: searchError?.message,
        testResults: searchTest?.length || 0
      },
      database: {
        connected: true,
        timestamp: new Date().toISOString()
      }
    };

    return NextResponse.json(debugInfo);

  } catch (error) {
    console.error("Database debug error:", error);
    return NextResponse.json({
      error: "Failed to debug database",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}