import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { createEmbedding, generateAnswer } from "@/lib/openai";

interface DocumentChunk {
  document_id: string;
  content: string;
  similarity: number;
  chunk_index: number;
}

export async function POST(request: NextRequest) {
  try {
    const { question, documentIds } = await request.json();
    console.log('🤔 Smart Q&A Request:', { question });

    if (!question) {
      return NextResponse.json(
        { error: "Question is required" },
        { status: 400 }
      );
    }

    // First, check for expert overrides
    console.log('🔍 Checking for expert overrides...');
    try {
      // Import the search function directly to avoid fetch issues
      const { POST: searchOverrides } = await import('../expert-overrides/search/route');
      const searchRequest = new NextRequest(new URL('http://localhost:3000/api/expert-overrides/search'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          question, 
          documentIds,
          similarityThreshold: 0.85
        })
      });
      
      const overrideResponse = await searchOverrides(searchRequest);
      
      if (overrideResponse.ok) {
        const overrideData = await overrideResponse.json();
        if (overrideData.found && overrideData.override) {
          console.log('✅ Using expert override');
          return NextResponse.json({
            answer: overrideData.override.corrected_answer,
            sources: [{
              document: 'Expert Override',
              section: 'Expert Knowledge',
              content: overrideData.override.expert_explanation || 'This answer has been verified and corrected by an expert.',
              similarity: Math.round(overrideData.override.similarity * 100),
              relevance: 'Expert'
            }],
            confidence: "expert",
            searchResults: 1,
            documentsSearched: 0,
            isExpertOverride: true,
            overrideDetails: {
              originalQuestion: overrideData.override.original_question,
              timesUsed: overrideData.override.times_used,
              similarity: overrideData.override.similarity
            }
          });
        }
      }
    } catch (overrideError) {
      console.error('Error checking overrides:', overrideError);
      // Continue with normal AI processing if override check fails
    }

    // Get current search settings (use internal call in production)
    let searchSettings = { similarityThreshold: 0.3, maxResults: 15, contextChunks: 5 };
    
    try {
      if (process.env.NODE_ENV === 'development') {
        const settingsResponse = await fetch('http://localhost:3000/api/search-settings');
        if (settingsResponse.ok) {
          searchSettings = await settingsResponse.json();
        }
      } else {
        // In production, import the settings directly to avoid fetch issues
        const { GET } = await import('../search-settings/route');
        const response = await GET();
        const responseData = await response.json();
        searchSettings = responseData;
      }
    } catch (error) {
      console.log('⚠️ Using default search settings due to fetch error:', error);
    }
    
    const { similarityThreshold = 0.3, maxResults = 15, contextChunks: maxContextChunks = 5 } = searchSettings;

    console.log('🎯 Using search settings:', { similarityThreshold, maxResults, maxContextChunks });

    const supabase = getSupabaseAdmin();

    // Generate embedding for the question
    console.log('🧠 Creating question embedding...');
    const questionEmbedding = await createEmbedding(question);

    // Search ALL documents for relevant content (not just one document)
    console.log('🔍 Searching across ALL policies...');
    const { data: relevantChunks, error: searchError } = await supabase
      .rpc('search_document_chunks', {
        query_embedding: questionEmbedding,
        match_count: maxResults, // Use configurable max results
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
    if (relevantChunks && relevantChunks.length > 0) {
      console.log('Top 3 search results:');
      relevantChunks.slice(0, 3).forEach((chunk: DocumentChunk, index: number) => {
        console.log(`${index + 1}. Similarity: ${chunk.similarity.toFixed(3)}, Content: ${chunk.content.substring(0, 100)}...`);
      });
    }

    // If no relevant content found
    if (!relevantChunks || relevantChunks.length === 0) {
      return NextResponse.json({
        answer: `I couldn't find specific information in your uploaded insurance policies to answer: "${question}". Try uploading more policy documents or asking about common insurance topics like coverage limits, deductibles, claims procedures, or exclusions.`,
        sources: [],
        confidence: "none"
      });
    }

    // Get document names for the relevant chunks
    const documentIds = [...new Set(relevantChunks.map((chunk: DocumentChunk) => chunk.document_id))];
    const { data: documents } = await supabase
      .from('documents')
      .select('id, file_name')
      .in('id', documentIds);

    // Create a map of document ID to name
    const docMap = new Map(documents?.map(d => [d.id, d.file_name]) || []);

    // Filter chunks by similarity threshold and prepare context
    const goodChunks = relevantChunks.filter((chunk: DocumentChunk) => chunk.similarity > similarityThreshold);
    
    if (goodChunks.length === 0) {
      // If no good chunks, show what we did find for debugging
      const debugInfo = relevantChunks?.slice(0, 3).map((chunk: DocumentChunk) => 
        `Similarity: ${chunk.similarity.toFixed(3)}, Content: "${chunk.content.substring(0, 100)}..."`
      ).join('\n') || 'No chunks found';
      
      return NextResponse.json({
        answer: `I found some content in your policies, but none was closely related to your question: "${question}". 

Here's what I found (with similarity scores):
${debugInfo}

Try rephrasing your question or asking about specific policy terms, coverage amounts, or claim procedures.`,
        sources: [],
        confidence: "low"
      });
    }

    // Build comprehensive context from the best chunks
    const contextChunks = goodChunks.slice(0, maxContextChunks); // Use configurable number of context chunks
    const context = contextChunks
      .map((chunk: DocumentChunk) => {
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
    const sources = contextChunks.map((chunk: DocumentChunk) => ({
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
      documentsSearched: documentIds.length,
      originalQuestion: question,
      isExpertOverride: false
    });

  } catch (error) {
    console.error("Smart Q&A error:", error);
    return NextResponse.json(
      { error: "Failed to process your question" },
      { status: 500 }
    );
  }
}