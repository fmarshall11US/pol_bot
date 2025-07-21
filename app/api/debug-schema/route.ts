import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    const results = {
      pgvectorExtension: null,
      tablesExist: {},
      vectorColumn: null,
      searchFunction: null,
      errors: []
    };

    // Check if pgvector extension is installed
    try {
      const { data: extensions, error: extError } = await supabase
        .from('pg_extension')
        .select('extname')
        .eq('extname', 'vector');
      
      results.pgvectorExtension = {
        installed: !extError && extensions && extensions.length > 0,
        error: extError?.message
      };
    } catch (err) {
      results.errors.push('Failed to check pgvector extension');
    }

    // Check if required tables exist
    const tables = ['documents', 'document_chunks', 'questions', 'feedback'];
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(0);
        
        results.tablesExist[table] = {
          exists: !error,
          error: error?.message
        };
      } catch (err) {
        results.tablesExist[table] = {
          exists: false,
          error: `Failed to query table: ${err}`
        };
      }
    }

    // Check if vector column exists with correct type
    try {
      const { data: columnInfo, error: colError } = await supabase
        .rpc('exec', {
          sql: `
            SELECT column_name, data_type, character_maximum_length
            FROM information_schema.columns 
            WHERE table_name = 'document_chunks' 
            AND column_name = 'embedding';
          `
        });
      
      results.vectorColumn = {
        exists: !colError && columnInfo && columnInfo.length > 0,
        details: columnInfo,
        error: colError?.message
      };
    } catch (err) {
      // Alternative check using a direct query
      try {
        const { data, error } = await supabase
          .from('document_chunks')
          .select('embedding')
          .limit(1);
        
        results.vectorColumn = {
          exists: !error,
          error: error?.message,
          note: 'Basic column existence check'
        };
      } catch (err2) {
        results.vectorColumn = {
          exists: false,
          error: `Column check failed: ${err2}`
        };
      }
    }

    // Check if search function exists
    try {
      const { data: searchResult, error: searchError } = await supabase
        .rpc('search_document_chunks', {
          query_embedding: Array(1536).fill(0.1),
          match_count: 1,
          document_id_filter: null
        });
      
      results.searchFunction = {
        exists: !searchError,
        error: searchError?.message,
        testResult: searchResult?.length || 0
      };
    } catch (err) {
      results.searchFunction = {
        exists: false,
        error: `Function test failed: ${err}`
      };
    }

    // Generate diagnosis
    const diagnosis = [];
    
    if (!results.pgvectorExtension?.installed) {
      diagnosis.push('❌ pgvector extension not installed - run: CREATE EXTENSION vector;');
    } else {
      diagnosis.push('✅ pgvector extension installed');
    }

    if (!results.tablesExist.documents?.exists) {
      diagnosis.push('❌ documents table missing');
    }
    
    if (!results.tablesExist.document_chunks?.exists) {
      diagnosis.push('❌ document_chunks table missing');
    }
    
    if (!results.vectorColumn?.exists) {
      diagnosis.push('❌ embedding vector column missing or wrong type');
    }
    
    if (!results.searchFunction?.exists) {
      diagnosis.push('❌ search_document_chunks function missing');
    }

    if (diagnosis.filter(d => d.includes('❌')).length === 0) {
      diagnosis.push('✅ All database components look good');
    }

    return NextResponse.json({
      ...results,
      diagnosis,
      recommendation: diagnosis.some(d => d.includes('❌')) 
        ? 'Database schema needs to be set up. Run the schema.sql files in your Supabase SQL editor.'
        : 'Database schema is properly configured.'
    });

  } catch (error) {
    console.error("Schema debug error:", error);
    return NextResponse.json({
      error: "Failed to debug schema",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}