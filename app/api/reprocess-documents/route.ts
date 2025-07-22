import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { createEmbedding } from "@/lib/openai";
import { processDocument } from "@/lib/document-processor";

export async function POST() {
  try {
    console.log('🔄 Starting document reprocessing...');
    const supabase = getSupabaseAdmin();

    // Get all documents
    const { data: documents, error: fetchError } = await supabase
      .from('documents')
      .select('*')
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('Error fetching documents:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 });
    }

    console.log(`📊 Found ${documents?.length || 0} documents to reprocess`);

    if (!documents || documents.length === 0) {
      return NextResponse.json({ message: 'No documents found to reprocess' });
    }

    let processedCount = 0;
    let errorCount = 0;

    for (const doc of documents) {
      try {
        console.log(`📄 Reprocessing document: ${doc.file_name}`);

        // Delete existing chunks
        const { error: deleteError } = await supabase
          .from('document_chunks')
          .delete()
          .eq('document_id', doc.id);

        if (deleteError) {
          console.error(`Failed to delete chunks for ${doc.file_name}:`, deleteError);
          errorCount++;
          continue;
        }

        // Process document again with updated processor
        // Create a dummy buffer since we're using placeholder text
        const dummyBuffer = Buffer.from('placeholder');
        const chunks = await processDocument(dummyBuffer, doc.file_type, doc.file_name);

        console.log(`✅ Created ${chunks.length} chunks for ${doc.file_name}`);

        // Store chunks with embeddings
        for (const chunk of chunks) {
          const embedding = await createEmbedding(chunk.content);
          
          const { error: insertError } = await supabase
            .from('document_chunks')
            .insert({
              document_id: doc.id,
              chunk_index: chunk.index,
              content: chunk.content,
              embedding
            });

          if (insertError) {
            console.error(`Failed to insert chunk:`, insertError);
          }
        }

        processedCount++;
        console.log(`✅ Successfully reprocessed ${doc.file_name}`);

      } catch (error) {
        console.error(`❌ Error reprocessing ${doc.file_name}:`, error);
        errorCount++;
      }
    }

    console.log(`🎉 Reprocessing complete! Processed: ${processedCount}, Errors: ${errorCount}`);

    return NextResponse.json({
      success: true,
      totalDocuments: documents.length,
      processedCount,
      errorCount,
      message: `Successfully reprocessed ${processedCount} out of ${documents.length} documents`
    });

  } catch (error) {
    console.error('Document reprocessing error:', error);
    return NextResponse.json(
      { error: 'Failed to reprocess documents' },
      { status: 500 }
    );
  }
}