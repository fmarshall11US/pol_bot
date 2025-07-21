import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { createEmbedding, generateAnswer } from "@/lib/openai";

export async function POST(request: NextRequest) {
  try {
    const { question } = await request.json();
    console.log('🤔 Smart Q&A Request:', { question });

    if (!question) {
      return NextResponse.json(
        { error: "Question is required" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Generate embedding for the question
    console.log('🧠 Creating question embedding...');
    const questionEmbedding = await createEmbedding(question);

    // Search ALL documents for relevant content (not just one document)
    console.log('🔍 Searching across ALL policies...');
    const { data: relevantChunks, error: searchError } = await supabase
      .rpc('search_document_chunks', {
        query_embedding: questionEmbedding,
        match_count: 8, // Get more results for better context
        document_id_filter: null // Search ALL documents
      });

    if (searchError) {
      console.error('Search error:', searchError);
      return NextResponse.json(
        { error: "Failed to search knowledge base" },
        { status: 500 }
      );
    }

    console.log(`📊 Found ${relevantChunks?.length || 0} relevant chunks`);

    // If no relevant content found
    if (!relevantChunks || relevantChunks.length === 0) {
      return NextResponse.json({
        answer: `I couldn't find specific information in your uploaded insurance policies to answer: "${question}". Try uploading more policy documents or asking about common insurance topics like coverage limits, deductibles, claims procedures, or exclusions.`,
        sources: [],
        confidence: "none"
      });
    }

    // Get document names for the relevant chunks
    const documentIds = [...new Set(relevantChunks.map(chunk => chunk.document_id))];
    const { data: documents } = await supabase
      .from('documents')
      .select('id, file_name')
      .in('id', documentIds);

    // Create a map of document ID to name
    const docMap = new Map(documents?.map(d => [d.id, d.file_name]) || []);

    // Filter chunks by similarity threshold and prepare context
    const goodChunks = relevantChunks.filter(chunk => chunk.similarity > 0.5);
    
    if (goodChunks.length === 0) {
      return NextResponse.json({
        answer: `I found some content in your policies, but none was closely related to your question: "${question}". Try rephrasing your question or asking about specific policy terms, coverage amounts, or claim procedures.`,
        sources: [],
        confidence: "low"
      });
    }

    // Build comprehensive context from the best chunks
    const contextChunks = goodChunks.slice(0, 5); // Top 5 most relevant
    const context = contextChunks
      .map((chunk, index) => {
        const docName = docMap.get(chunk.document_id) || 'Unknown Document';
        return `[${docName} - Section ${chunk.chunk_index + 1}]:\n${chunk.content}`;
      })
      .join('\n\n---\n\n');

    console.log('📝 Built context with', contextChunks.length, 'chunks');

    // Enhanced prompt for better AI understanding
    const enhancedPrompt = `You are a senior Property & Casualty insurance underwriter with 20+ years of experience. A policyholder has asked you a question about their insurance coverage. Use ONLY the policy information provided below to answer their question.

IMPORTANT INSTRUCTIONS:
1. Answer the question directly and conversationally
2. Reference specific policy sections when relevant
3. If the policy information doesn't fully answer the question, say so clearly
4. Use simple language while being precise about insurance terms
5. If you find conflicting information, explain the differences
6. Always base your answer on the provided policy content

POLICYHOLDER QUESTION: "${question}"

AVAILABLE POLICY INFORMATION:
${context}

Please provide a comprehensive answer based on the policy information above:`;

    // Generate intelligent answer
    console.log('🤖 Generating intelligent answer...');
    const answer = await generateAnswer(question, enhancedPrompt);

    // Prepare source information
    const sources = contextChunks.map(chunk => ({
      document: docMap.get(chunk.document_id) || 'Unknown Document',
      section: `Section ${chunk.chunk_index + 1}`,
      content: chunk.content.substring(0, 200) + '...',
      similarity: Math.round(chunk.similarity * 100),
      relevance: chunk.similarity > 0.8 ? 'High' : chunk.similarity > 0.6 ? 'Medium' : 'Low'
    }));

    // Determine confidence based on best similarity score
    const topSimilarity = contextChunks[0]?.similarity || 0;
    const confidence = topSimilarity > 0.8 ? 'high' : 
                     topSimilarity > 0.6 ? 'medium' : 'low';

    console.log('✅ Smart Q&A completed');

    return NextResponse.json({
      answer,
      sources,
      confidence,
      searchResults: contextChunks.length,
      documentsSearched: documentIds.length
    });

  } catch (error) {
    console.error("Smart Q&A error:", error);
    return NextResponse.json(
      { error: "Failed to process your question" },
      { status: 500 }
    );
  }
}