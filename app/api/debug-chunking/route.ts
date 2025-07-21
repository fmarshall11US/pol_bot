import { NextResponse } from "next/server";
import { processDocument, splitTextIntoChunks } from "@/lib/document-processor";

export async function POST() {
  try {
    // Test sample insurance document
    const sampleText = `HOMEOWNER'S INSURANCE POLICY

COVERAGE A - DWELLING
We will pay for direct physical loss to the dwelling on the residence premises shown in the Declarations caused by a Covered Peril. Coverage includes structures attached to the dwelling.

COVERAGE B - OTHER STRUCTURES  
We will pay for direct physical loss to other structures on the residence premises set apart from the dwelling by clear space. This includes structures connected to the dwelling by only a fence, utility line, or similar connection.

COVERAGE C - PERSONAL PROPERTY
We will pay for direct physical loss to personal property owned or used by an insured while it is anywhere in the world. After a loss and at your request, we will pay for direct physical loss to personal property owned by others while the property is on the part of the residence premises occupied by an insured.

SECTION II - LIABILITY COVERAGES
COVERAGE E - PERSONAL LIABILITY
If a claim is made or a suit is brought against an insured for damages because of bodily injury or property damage caused by an occurrence to which this coverage applies, we will pay up to the limit of liability that applies.

COVERAGE F - MEDICAL PAYMENTS TO OTHERS
We will pay the necessary medical expenses that are incurred or medically ascertained within three years of the date of an accident causing bodily injury. Coverage applies only if the accident takes place in the coverage territory and is caused by the activities of an insured.`;

    // Test chunking with different parameters
    const testResults = {
      sampleText: {
        length: sampleText.length,
        sentences: sampleText.match(/[^.!?]+[.!?]+/g)?.length || 0,
        paragraphs: sampleText.split('\n\n').length
      },
      chunking: {} as Record<string, {
        chunkCount: number;
        avgChunkSize: number;
        chunks: Array<{
          index: number;
          length: number;
          preview: string;
        }>;
      }>,
      documentProcessing: {
        chunkCount: 0,
        chunks: [] as Array<{
          index: number;
          length: number;
          preview: string;
          firstWords: string;
        }>
      }
    };

    // Test different chunk sizes
    const chunkSizes = [500, 1000, 1500, 2000];
    
    for (const size of chunkSizes) {
      const chunks = splitTextIntoChunks(sampleText, size);
      testResults.chunking[`size_${size}`] = {
        chunkCount: chunks.length,
        avgChunkSize: chunks.reduce((sum, c) => sum + c.content.length, 0) / chunks.length,
        chunks: chunks.map(c => ({
          index: c.index,
          length: c.content.length,
          preview: c.content.substring(0, 100) + '...'
        }))
      };
    }

    // Test document processing with buffer
    const testBuffer = Buffer.from(sampleText);
    const processedChunks = await processDocument(testBuffer, 'application/pdf', 'test-chunking.pdf');
    
    testResults.documentProcessing = {
      chunkCount: processedChunks.length,
      chunks: processedChunks.map(c => ({
        index: c.index,
        length: c.content.length,
        preview: c.content.substring(0, 100) + '...',
        firstWords: c.content.split(' ').slice(0, 10).join(' ')
      }))
    };

    // Analyze potential issues
    const analysis = [];
    
    if (testResults.sampleText.sentences === 0) {
      analysis.push('❌ No sentences detected - regex pattern may not match text format');
    } else {
      analysis.push(`✅ Found ${testResults.sampleText.sentences} sentences`);
    }
    
    if (testResults.documentProcessing.chunkCount === 1) {
      analysis.push('⚠️ Document created only 1 chunk - may need smaller chunk size');
    } else {
      analysis.push(`✅ Document split into ${testResults.documentProcessing.chunkCount} chunks`);
    }
    
    const avgChunkSize = testResults.chunking.size_1000?.avgChunkSize || 0;
    if (avgChunkSize > 1500) {
      analysis.push('⚠️ Chunks are very large - may affect embedding quality');
    } else {
      analysis.push(`✅ Average chunk size: ${Math.round(avgChunkSize)} characters`);
    }

    return NextResponse.json({
      ...testResults,
      analysis,
      recommendation: analysis.some(a => a.includes('❌')) 
        ? 'Chunking has issues - consider adjusting chunk size or sentence detection'
        : 'Chunking appears to be working correctly'
    });

  } catch (error) {
    console.error("Chunking debug error:", error);
    return NextResponse.json({
      error: "Failed to debug chunking",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}