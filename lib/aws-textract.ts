import { TextractClient, DetectDocumentTextCommand } from "@aws-sdk/client-textract";

// Initialize AWS Textract client
const textractClient = new TextractClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function extractTextWithTextract(fileBuffer: Buffer): Promise<string> {
  try {
    
    // Prepare the command
    const command = new DetectDocumentTextCommand({
      Document: {
        Bytes: fileBuffer,
      },
    });

    // Call Textract
    const response = await textractClient.send(command);
    
    // Extract text from the response
    const extractedText = response.Blocks
      ?.filter(block => block.BlockType === 'LINE')
      .map(block => block.Text)
      .filter(text => text && text.trim().length > 0)
      .join('\n') || '';

    console.log('✅ Textract extraction successful, extracted', extractedText.length, 'characters');
    return extractedText;
    
  } catch (error) {
    console.error('❌ Textract extraction failed:', error);
    throw new Error(`Failed to extract text with Textract: ${error}`);
  }
}

export function isTextractConfigured(): boolean {
  return !!textractClient;
}