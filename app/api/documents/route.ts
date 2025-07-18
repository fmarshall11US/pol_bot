import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    
    // Fetch all documents with chunk count
    const { data: documents, error } = await supabase
      .from('documents')
      .select(`
        id,
        file_name,
        file_type,
        file_size,
        created_at,
        document_chunks (count)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching documents:', error);
      return NextResponse.json(
        { error: "Failed to fetch documents" },
        { status: 500 }
      );
    }

    // Transform the data to include chunk count
    const documentsWithStats = documents?.map(doc => ({
      ...doc,
      chunk_count: doc.document_chunks?.[0]?.count || 0
    })) || [];

    return NextResponse.json(documentsWithStats);
  } catch (error) {
    console.error("Error in documents API:", error);
    return NextResponse.json(
      { error: "Failed to fetch documents" },
      { status: 500 }
    );
  }
}