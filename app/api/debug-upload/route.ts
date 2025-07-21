import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { createEmbedding } from "@/lib/openai";
import { processDocument } from "@/lib/document-processor";

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Starting debug upload process...');

    // Test 1: Check environment variables
    const envCheck = {
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      hasOpenAIKey: !!process.env.OPENAI_API_KEY
    };
    console.log('1. Environment check:', envCheck);

    if (!envCheck.hasSupabaseUrl || !envCheck.hasSupabaseServiceKey || !envCheck.hasOpenAIKey) {
      return NextResponse.json({ 
        error: 'Missing environment variables', 
        envCheck 
      }, { status: 500 });
    }

    // Test 2: Test Supabase connection
    const supabase = getSupabaseAdmin();
    const { data: testQuery, error: testError } = await supabase
      .from('documents')
      .select('id')
      .limit(1);
    
    console.log('2. Supabase test:', { success: !testError, error: testError?.message });
    
    if (testError) {
      return NextResponse.json({ 
        error: 'Supabase connection failed', 
        details: testError.message 
      }, { status: 500 });
    }

    // Test 3: Test OpenAI embedding
    const testText = "Test document content for debugging";
    let embedding;
    try {
      embedding = await createEmbedding(testText);
      console.log('3. OpenAI embedding test:', { 
        success: true, 
        length: embedding.length,
        type: typeof embedding[0]
      });
    } catch (embeddingError) {
      console.error('3. OpenAI embedding failed:', embeddingError);
      return NextResponse.json({ 
        error: 'OpenAI embedding failed', 
        details: embeddingError instanceof Error ? embeddingError.message : 'Unknown error'
      }, { status: 500 });
    }

    // Test 4: Test document processing
    const testBuffer = Buffer.from("SAMPLE INSURANCE POLICY\n\nThis is a test policy document for debugging purposes.\n\nCOVERAGE LIMITS:\n- Bodily Injury: $250,000\n- Property Damage: $100,000\n- Deductible: $500");
    let chunks;
    try {
      chunks = await processDocument(testBuffer, 'application/pdf', 'test-debug.pdf');
      console.log('4. Document processing test:', { 
        success: true, 
        chunkCount: chunks.length,
        firstChunkLength: chunks[0]?.content?.length || 0
      });
    } catch (processingError) {
      console.error('4. Document processing failed:', processingError);
      return NextResponse.json({ 
        error: 'Document processing failed', 
        details: processingError instanceof Error ? processingError.message : 'Unknown error'
      }, { status: 500 });
    }

    // Test 5: Test database insertion
    const testDocId = 'test-debug-' + Date.now();
    try {
      const { error: docError } = await supabase
        .from('documents')
        .insert({
          id: testDocId,
          user_id: 'debug-test',
          file_name: 'debug-test.pdf',
          file_type: 'application/pdf',
          file_size: testBuffer.length,
          content: chunks.map(c => c.content).join('\n\n')
        });

      if (docError) throw docError;

      // Insert a test chunk with embedding
      const { error: chunkError } = await supabase
        .from('document_chunks')
        .insert({
          document_id: testDocId,
          chunk_index: 0,
          content: chunks[0].content,
          embedding
        });

      if (chunkError) throw chunkError;

      console.log('5. Database insertion test: SUCCESS');

      // Clean up test data
      await supabase.from('document_chunks').delete().eq('document_id', testDocId);
      await supabase.from('documents').delete().eq('id', testDocId);

    } catch (dbError) {
      console.error('5. Database insertion failed:', dbError);
      return NextResponse.json({ 
        error: 'Database insertion failed', 
        details: dbError instanceof Error ? dbError.message : 'Unknown error'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'All upload components working correctly',
      tests: {
        environment: 'PASS',
        supabase: 'PASS',
        openai: `PASS (${embedding.length} dimensions)`,
        documentProcessing: `PASS (${chunks.length} chunks)`,
        databaseInsertion: 'PASS'
      }
    });

  } catch (error) {
    console.error("Debug upload error:", error);
    return NextResponse.json({
      error: "Debug upload failed",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}