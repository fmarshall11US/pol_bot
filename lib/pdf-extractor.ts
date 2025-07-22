// For Node.js environment (server-side)
export async function extractTextFromPDFNode(buffer: Buffer): Promise<string> {
  try {
    // Dynamic import to avoid build issues
    const pdfParse = await import('pdf-parse');
    const data = await pdfParse.default(buffer);
    
    console.log(`📄 Extracted ${data.numpages} pages, ${data.text.length} characters`);
    
    // Clean up the text - remove excessive whitespace
    const cleanedText = data.text
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/\n{3,}/g, '\n\n') // Replace multiple newlines with double newline
      .trim();
    
    return cleanedText;
  } catch (error) {
    console.error('PDF extraction error:', error);
    throw new Error('Failed to extract text from PDF');
  }
}