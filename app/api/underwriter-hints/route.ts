import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { createEmbedding } from "@/lib/openai";

export async function POST(request: NextRequest) {
  try {
    const { documentId, policyType, title, content, category, tags, isGlobal } = await request.json();

    if (!title || !content || !category) {
      return NextResponse.json(
        { error: "Title, content, and category are required" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Generate embedding for the hint content
    const embedding = await createEmbedding(`${title} ${content} ${tags.join(' ')}`);

    if (isGlobal && policyType) {
      // Store as global policy knowledge
      const { data, error } = await supabase
        .from('policy_knowledge_base')
        .insert({
          policy_type: policyType,
          title,
          content,
          category,
          tags,
          underwriter_id: 'anonymous', // In production, get from auth
          embedding
        })
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json(data);
    } else {
      // Store as document-specific hint
      const { data, error } = await supabase
        .from('underwriter_hints')
        .insert({
          document_id: documentId,
          title,
          content,
          category,
          tags,
          is_global: isGlobal,
          underwriter_id: 'anonymous', // In production, get from auth
          embedding
        })
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json(data);
    }
  } catch (error) {
    console.error("Error saving underwriter hint:", error);
    return NextResponse.json(
      { error: "Failed to save hint" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get('documentId');

    const supabase = getSupabaseAdmin();

    const { data: hints, error } = await supabase
      .from('underwriter_hints')
      .select('*')
      .eq('document_id', documentId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json(hints || []);
  } catch (error) {
    console.error("Error fetching hints:", error);
    return NextResponse.json(
      { error: "Failed to fetch hints" },
      { status: 500 }
    );
  }
}