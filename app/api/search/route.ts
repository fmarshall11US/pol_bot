import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { createEmbedding } from "@/lib/openai";

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();

    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { error: "Search query is required" },
        { status: 400 }
      );
    }

    console.log('🔍 Policy search query:', query);

    const supabase = getSupabaseAdmin();

    // Generate embedding for the search query
    const queryEmbedding = await createEmbedding(query);

    // FIRST: Search only underwriter knowledge/hints
    const { data: knowledgeMatches, error: knowledgeError } = await supabase
      .rpc('search_underwriter_knowledge', {
        query_embedding: queryEmbedding,
        document_id_param: null,
        policy_type_param: null,
        match_count: 10
      });

    if (knowledgeError) {
      console.error('Knowledge search error:', knowledgeError);
      return NextResponse.json(
        { error: "Search failed" },
        { status: 500 }
      );
    }

    console.log('🧠 Knowledge search results:', {
      query,
      totalMatches: knowledgeMatches?.length || 0,
      matches: knowledgeMatches?.map((m: any) => ({
        title: m.title,
        category: m.category,
        similarity: m.similarity,
        source: m.source
      }))
    });

    // Only proceed if we found relevant hints
    if (!knowledgeMatches || knowledgeMatches.length === 0) {
      return NextResponse.json({
        query,
        recommendations: [],
        total_matches: 0,
        message: "No expert knowledge found for your query. Try different search terms or add underwriter hints to your policies."
      });
    }

    // Get document IDs and recommendations based only on hints
    const documentIds = new Set();
    const policyRecommendations = new Map();

    // Process knowledge matches - ONLY use hints as the source of truth
    for (const match of knowledgeMatches) {
      if (match.similarity > 0.2) { // Lower threshold since we're only using expert knowledge
        
        if (match.source === 'document_hint') {
          // Document-specific hint
          const { data: hintDoc } = await supabase
            .from('underwriter_hints')
            .select('document_id')
            .eq('id', match.id)
            .single();

          if (hintDoc?.document_id) {
            documentIds.add(hintDoc.document_id);
            
            const existing = policyRecommendations.get(hintDoc.document_id);
            
            if (!existing || match.similarity > existing.relevance_score) {
              policyRecommendations.set(hintDoc.document_id, {
                document_id: hintDoc.document_id,
                relevance_score: match.similarity,
                match_reason: `Expert insight: ${match.title} (${match.category})`,
                matched_content: match.content.substring(0, 150) + '...',
                source: 'underwriter_hint',
                hint_title: match.title,
                hint_category: match.category
              });
            }
          }
        } else if (match.source === 'policy_knowledge') {
          // Global policy knowledge - we'll need to find documents of this policy type
          // For now, we can note this but focus on document-specific hints
          console.log('📋 Found global policy knowledge:', {
            title: match.title,
            category: match.category,
            similarity: match.similarity
          });
        }
      }
    }

    // Get document details for all matched documents
    if (documentIds.size > 0) {
      const { data: documents, error: docsError } = await supabase
        .from('documents')
        .select('id, file_name, file_type, created_at')
        .in('id', Array.from(documentIds));

      if (!docsError && documents) {
        // Combine document info with recommendations
        const enrichedRecommendations = Array.from(policyRecommendations.values())
          .map(rec => {
            const doc = documents.find(d => d.id === rec.document_id);
            return {
              ...rec,
              file_name: doc?.file_name || 'Unknown Document',
              file_type: doc?.file_type || 'unknown',
              created_at: doc?.created_at,
              policy_type: getPolicyType(doc?.file_name || '')
            };
          })
          .sort((a, b) => b.relevance_score - a.relevance_score) // Sort by relevance
          .slice(0, 5); // Top 5 recommendations

        console.log('📊 Search results:', {
          query,
          totalMatches: enrichedRecommendations.length,
          topScore: enrichedRecommendations[0]?.relevance_score
        });

        return NextResponse.json({
          query,
          recommendations: enrichedRecommendations,
          total_matches: enrichedRecommendations.length
        });
      }
    }

    // No matches found
    return NextResponse.json({
      query,
      recommendations: [],
      total_matches: 0,
      message: "No relevant policies found. Try different search terms or upload more policies."
    });

  } catch (error) {
    console.error("Search API error:", error);
    return NextResponse.json(
      { error: "Failed to search policies" },
      { status: 500 }
    );
  }
}

function getPolicyType(fileName: string): string {
  const name = fileName.toLowerCase();
  if (name.includes('auto') || name.includes('car') || name.includes('vehicle')) {
    return 'Auto Policy';
  }
  if (name.includes('home') || name.includes('property')) {
    return 'Property Policy';
  }
  if (name.includes('cgl') || name.includes('general') || name.includes('liability')) {
    return 'General Liability';
  }
  if (name.includes('workers') || name.includes('comp')) {
    return 'Workers Comp';
  }
  return 'Insurance Policy';
}