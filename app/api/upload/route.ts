import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getSupabaseAdmin } from "@/lib/supabase";
import { createEmbedding } from "@/lib/openai";
import { processDocument } from "@/lib/document-processor";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ["application/pdf", "image/png", "image/jpeg", "image/jpg"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only PDF and images are allowed." },
        { status: 400 }
      );
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 10MB." },
        { status: 400 }
      );
    }

    // Generate unique document ID
    const documentId = crypto.randomUUID();
    
    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // For Vercel serverless, we'll process the file directly from memory
    // Process document from buffer instead of file path
    const chunks = await processDocument(buffer, file.type, file.name);
    
    // Get Supabase admin client
    const supabase = getSupabaseAdmin();
    
    // Store document metadata
    const { error: docError } = await supabase
      .from('documents')
      .insert({
        id: documentId,
        user_id: 'anonymous', // In a real app, get this from auth
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
        content: chunks.map(c => c.content).join('\n\n')
      });

    if (docError) throw docError;

    // Generate embeddings and store chunks
    for (const chunk of chunks) {
      const embedding = await createEmbedding(chunk.content);
      
      const { error: chunkError } = await supabase
        .from('document_chunks')
        .insert({
          document_id: documentId,
          chunk_index: chunk.index,
          content: chunk.content,
          embedding
        });

      if (chunkError) throw chunkError;
    }

    // No cleanup needed - file was processed in memory

    return NextResponse.json({
      success: true,
      documentId,
      fileName: file.name,
      chunksProcessed: chunks.length,
      message: "Document uploaded and processed successfully"
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to process document" },
      { status: 500 }
    );
  }
}