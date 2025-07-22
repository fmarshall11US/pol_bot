import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { createEmbedding, generateAnswer } from "@/lib/openai";

export async function POST(request: NextRequest) {
  try {
    const { documentId } = await request.json();
    
    const supabase = getSupabaseAdmin();
    
    // Test with the exact question
    const testQuestion = "what happens if you acquire a replacement auto";
    console.log('🔍 Testing Q&A with question:', testQuestion);
    
    // Generate embedding
    const questionEmbedding = await createEmbedding(testQuestion);
    console.log('✅ Embedding generated, length:', questionEmbedding.length);
    
    // Search for similar chunks
    const { data: similarChunks, error: searchError } = await supabase
      .rpc('search_document_chunks', {
        query_embedding: questionEmbedding,
        match_count: 10,
        document_id_filter: documentId || null
      });
    
    console.log('📊 Found chunks:', similarChunks?.length || 0);
    
    // Check if any chunks contain the expected content
    const targetContent = "60 days";
    const replacementAutoContent = "replacement auto";
    
    const relevantChunks = similarChunks?.filter((chunk: any) => 
      chunk.content.includes(targetContent) || 
      chunk.content.includes(replacementAutoContent)
    ) || [];
    
    console.log('🎯 Relevant chunks with target content:', relevantChunks.length);
    
    // Generate answer with the best chunks
    let answer = '';
    if (similarChunks && similarChunks.length > 0) {
      const context = similarChunks
        .slice(0, 3)
        .map((chunk: any) => chunk.content)
        .join('\n\n');
      
      answer = await generateAnswer(testQuestion, context);
    }
    
    // Also search directly for the content
    const { data: directSearch60Days } = await supabase
      .from('document_chunks')
      .select('id, chunk_index, content')
      .ilike('content', '%60 days%')
      .eq(documentId ? 'document_id' : 'id', documentId || supabase.from('document_chunks').select('id'))
      .limit(5);
    
    const { data: directSearchReplacement } = await supabase
      .from('document_chunks')
      .select('id, chunk_index, content')
      .ilike('content', '%replacement auto%')
      .eq(documentId ? 'document_id' : 'id', documentId || supabase.from('document_chunks').select('id'))
      .limit(5);
    
    return NextResponse.json({
      question: testQuestion,
      expectedAnswer: "You must tell us within 60 days when you acquire an additional or replacement auto.",
      actualAnswer: answer,
      searchResults: {
        totalChunksFound: similarChunks?.length || 0,
        relevantChunksFound: relevantChunks.length,
        topSimilarities: similarChunks?.slice(0, 5).map((c: any) => ({
          similarity: c.similarity,
          hasTargetContent: c.content.includes(targetContent) || c.content.includes(replacementAutoContent),
          contentPreview: c.content.substring(0, 200) + '...'
        })) || []
      },
      directSearchResults: {
        "60 days": {
          found: directSearch60Days?.length || 0,
          chunks: directSearch60Days?.map(c => ({
            chunkIndex: c.chunk_index,
            content: c.content.substring(0, 300) + '...'
          })) || []
        },
        "replacement auto": {
          found: directSearchReplacement?.length || 0,
          chunks: directSearchReplacement?.map(c => ({
            chunkIndex: c.chunk_index,
            content: c.content.substring(0, 300) + '...'
          })) || []
        }
      },
      diagnosis: {
        embeddingWorking: questionEmbedding.length === 1536,
        vectorSearchWorking: !searchError && similarChunks !== null,
        contentExists: (directSearch60Days?.length || 0) > 0 || (directSearchReplacement?.length || 0) > 0,
        vectorSearchFindingContent: relevantChunks.length > 0,
        answerContainsExpectedInfo: answer.includes('60 days') || answer.includes('sixty days')
      }
    });
    
  } catch (error) {
    console.error("Test Q&A error:", error);
    return NextResponse.json({
      error: "Failed to test Q&A",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}