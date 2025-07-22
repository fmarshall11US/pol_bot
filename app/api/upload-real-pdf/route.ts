import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { processDocument } from "@/lib/document-processor";
import { createEmbedding } from "@/lib/openai";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    console.log('📁 Processing file:', file.name, 'Type:', file.type, 'Size:', file.size);

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const supabase = getSupabaseAdmin();

    // Store document record
    const { data: document, error: docError } = await supabase
      .from('documents')
      .insert({
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
        metadata: {
          upload_type: 'real_pdf_extraction',
          extraction_method: 'pdf-parse'
        }
      })
      .select()
      .single();

    if (docError || !document) {
      console.error('Document creation error:', docError);
      return NextResponse.json({ error: "Failed to create document record" }, { status: 500 });
    }

    // Process document with real text extraction
    console.log('📄 Extracting text from PDF...');
    const chunks = await processDocument(buffer, file.type, file.name);
    
    console.log(`✂️ Created ${chunks.length} chunks from document`);

    // Generate embeddings for each chunk
    const chunkRecords = [];
    for (const chunk of chunks) {
      console.log(`🧮 Generating embedding for chunk ${chunk.index + 1}/${chunks.length}`);
      const embedding = await createEmbedding(chunk.content);
      
      chunkRecords.push({
        document_id: document.id,
        chunk_index: chunk.index,
        content: chunk.content,
        embedding,
        metadata: {
          char_count: chunk.content.length,
          extraction_method: 'pdf-parse'
        }
      });
    }

    // Store all chunks
    const { error: chunksError } = await supabase
      .from('document_chunks')
      .insert(chunkRecords);

    if (chunksError) {
      console.error('Chunks insertion error:', chunksError);
      // Clean up document record
      await supabase.from('documents').delete().eq('id', document.id);
      return NextResponse.json({ error: "Failed to store document chunks" }, { status: 500 });
    }

    console.log('✅ Document processed successfully with real text extraction');

    return NextResponse.json({
      success: true,
      document: {
        id: document.id,
        name: document.file_name,
        chunks: chunks.length,
        extraction_method: 'pdf-parse',
        totalCharacters: chunks.reduce((sum, chunk) => sum + chunk.content.length, 0)
      }
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: "Failed to process document" },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs';