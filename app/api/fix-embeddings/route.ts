import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { createEmbedding } from "@/lib/openai";

export async function POST() {
  try {
    console.log('🔧 Starting embedding fix process...');
    const supabase = getSupabaseAdmin();

    // First, let's see what we have
    const { data: chunks, error: fetchError } = await supabase
      .from('document_chunks')
      .select('id, document_id, content, chunk_index')
      .order('document_id, chunk_index');

    if (fetchError) {
      console.error('Error fetching chunks:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch chunks' }, { status: 500 });
    }

    console.log(`📊 Found ${chunks?.length || 0} chunks to fix`);

    if (!chunks || chunks.length === 0) {
      return NextResponse.json({ message: 'No chunks found to fix' });
    }

    let fixedCount = 0;
    let errorCount = 0;

    // Process each chunk
    for (const chunk of chunks) {
      try {
        console.log(`🔄 Processing chunk ${chunk.id} (${chunk.content.substring(0, 50)}...)`);
        
        // Generate new embedding
        const newEmbedding = await createEmbedding(chunk.content);
        console.log(`✅ Generated embedding with ${newEmbedding.length} dimensions`);

        // Update the chunk with correct embedding
        const { error: updateError } = await supabase
          .from('document_chunks')
          .update({ embedding: newEmbedding })
          .eq('id', chunk.id);

        if (updateError) {
          console.error(`❌ Failed to update chunk ${chunk.id}:`, updateError);
          errorCount++;
        } else {
          console.log(`✅ Fixed chunk ${chunk.id}`);
          fixedCount++;
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.error(`❌ Error processing chunk ${chunk.id}:`, error);
        errorCount++;
      }
    }

    console.log(`🎉 Embedding fix complete! Fixed: ${fixedCount}, Errors: ${errorCount}`);

    return NextResponse.json({
      success: true,
      totalChunks: chunks.length,
      fixedCount,
      errorCount,
      message: `Successfully fixed ${fixedCount} out of ${chunks.length} chunks`
    });

  } catch (error) {
    console.error('Embedding fix error:', error);
    return NextResponse.json(
      { error: 'Failed to fix embeddings' },
      { status: 500 }
    );
  }
}