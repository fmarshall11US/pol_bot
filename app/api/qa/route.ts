import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { createEmbedding, generateAnswer } from "@/lib/openai";

interface DocumentChunk {
  id: string;
  content: string;
  similarity: number;
  chunk_index: number;
}

interface UnderwriterKnowledge {
  id: string;
  title: string;
  category: string;
  content: string;
  similarity: number;
}

export async function POST(request: NextRequest) {
  try {
    const { question, documentId } = await request.json();
    console.log('🔍 Q&A Request:', { question, documentId });

    if (!question || !documentId) {
      return NextResponse.json(
        { error: "Question and document ID are required" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Verify document exists
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('id, file_name')
      .eq('id', documentId)
      .single();

    if (docError || !document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    // Generate embedding for the question
    console.log('🧠 Generating embedding for question...');
    const questionEmbedding = await createEmbedding(question);
    console.log('✅ Embedding generated, length:', questionEmbedding.length);

    // Search for similar document chunks using the Supabase function
    console.log('🔎 Searching for similar chunks...');
    const { data: similarChunks, error: searchError } = await supabase
      .rpc('search_document_chunks', {
        query_embedding: questionEmbedding,
        match_count: 5,
        document_id_filter: documentId
      });

    // Also search for underwriter knowledge
    console.log('🧠 Searching for underwriter knowledge...');
    const { data: underwriterKnowledge, error: knowledgeError } = await supabase
      .rpc('search_underwriter_knowledge', {
        query_embedding: questionEmbedding,
        document_id_param: documentId,
        policy_type_param: null, // Could determine from document metadata
        match_count: 3
      });

    console.log('📊 Search results:', { 
      chunksFound: similarChunks?.length || 0, 
      knowledgeFound: underwriterKnowledge?.length || 0,
      searchError,
      knowledgeError,
      firstChunk: similarChunks?.[0] ? {
        content: similarChunks[0].content.substring(0, 100) + '...',
        similarity: similarChunks[0].similarity
      } : null,
      firstKnowledge: underwriterKnowledge?.[0] ? {
        title: underwriterKnowledge[0].title,
        category: underwriterKnowledge[0].category,
        similarity: underwriterKnowledge[0].similarity
      } : null
    });

    // Additional debugging: Let's check if we have any chunks at all for this document
    const { data: allChunks, error: allChunksError } = await supabase
      .from('document_chunks')
      .select('id, chunk_index, content')
      .eq('document_id', documentId)
      .limit(3);
    
    console.log('📋 All chunks for document:', {
      documentId,
      totalChunks: allChunks?.length || 0,
      error: allChunksError,
      sampleChunk: allChunks?.[0] ? {
        content: allChunks[0].content.substring(0, 100) + '...'
      } : null
    });

    if (searchError) {
      console.error('Vector search error:', searchError);
      return NextResponse.json(
        { error: "Failed to search document content" },
        { status: 500 }
      );
    }

    // If no relevant chunks found, provide a helpful response
    if ((!similarChunks || similarChunks.length === 0) && (!underwriterKnowledge || underwriterKnowledge.length === 0)) {
      const fallbackAnswer = `I couldn't find specific information in your document "${document.file_name}" that directly answers your question: "${question}". This could mean:

1. The information might not be covered in this document
2. The question might need to be phrased differently
3. The content might be in a different section

Try rephrasing your question or asking about general topics covered in insurance policies like coverage limits, deductibles, or claim procedures.`;

      return NextResponse.json({
        answer: fallbackAnswer,
        relevantChunks: [],
        underwriterKnowledge: [],
        confidence: "low"
      });
    }

    // Combine document content and underwriter knowledge
    let context = '';
    
    // Add document chunks
    if (similarChunks && similarChunks.length > 0) {
      const documentContext = similarChunks
        .slice(0, 3)
        .map((chunk: DocumentChunk) => chunk.content)
        .join('\n\n');
      context += `POLICY DOCUMENT CONTENT:\n${documentContext}\n\n`;
    }
    
    // Add underwriter knowledge
    if (underwriterKnowledge && underwriterKnowledge.length > 0) {
      const knowledgeContext = underwriterKnowledge
        .slice(0, 2) // Top 2 most relevant knowledge items
        .map((knowledge: UnderwriterKnowledge) => `UNDERWRITER INSIGHT - ${knowledge.title} (${knowledge.category}):\n${knowledge.content}`)
        .join('\n\n');
      context += `EXPERT UNDERWRITER KNOWLEDGE:\n${knowledgeContext}`;
    }

    console.log('📝 Context being sent to AI:', {
      contextLength: context.length,
      contextPreview: context.substring(0, 200) + '...'
    });

    // Generate answer using OpenAI with the context
    console.log('🤖 Generating AI answer...');
    const answer = await generateAnswer(question, context);
    console.log('✅ AI answer generated:', answer.substring(0, 100) + '...');

    // Store the Q&A in the database
    const { data: questionRecord, error: storeError } = await supabase
      .from('questions')
      .insert({
        document_id: documentId,
        user_id: 'anonymous', // In production, get from auth
        question: question,
        answer: answer,
        relevant_chunks: similarChunks.slice(0, 3)
      })
      .select()
      .single();

    if (storeError) {
      console.error('Error storing Q&A:', storeError);
      // Continue anyway - the user still gets their answer
    }

    // Return the answer with metadata
    return NextResponse.json({
      answer,
      relevantChunks: similarChunks?.slice(0, 3) || [],
      underwriterKnowledge: underwriterKnowledge?.slice(0, 2) || [],
      confidence: (similarChunks?.[0]?.similarity || 0) > 0.8 ? "high" : 
                 (similarChunks?.[0]?.similarity || 0) > 0.6 ? "medium" : "low",
      questionId: questionRecord?.id
    });

  } catch (error) {
    console.error("Q&A API error:", error);
    return NextResponse.json(
      { error: "Failed to process question" },
      { status: 500 }
    );
  }
}