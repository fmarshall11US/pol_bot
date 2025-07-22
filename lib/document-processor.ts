import { extractTextWithTextract, isTextractConfigured } from './aws-textract';

export interface TextChunk {
  content: string;
  index: number;
}

export async function extractTextFromPDF(fileBuffer: Buffer, originalFileName?: string): Promise<string> {
  const fileSizeKB = Math.round(fileBuffer.length / 1024);
  
  // Try PDF.js extraction first (free and reliable)
  try {
    const { extractTextFromPDFNode } = await import('./pdf-extractor');
    console.log('🔍 Using PDF.js for text extraction...');
    const extractedText = await extractTextFromPDFNode(fileBuffer);
    
    if (extractedText && extractedText.trim().length > 0) {
      console.log('✅ Successfully extracted', extractedText.length, 'characters from PDF');
      return extractedText;
    }
  } catch (error) {
    console.log('⚠️ PDF.js extraction failed:', error);
  }
  
  // Use AWS Textract if configured
  const textractConfigured = isTextractConfigured();
  console.log('🔍 AWS Textract configured:', textractConfigured);
  
  if (textractConfigured) {
    try {
      console.log('🔍 Using AWS Textract for PDF extraction...');
      const extractedText = await extractTextWithTextract(fileBuffer);
      
      if (extractedText && extractedText.trim().length > 0) {
        console.log('✅ Successfully extracted', extractedText.length, 'characters from PDF');
        return extractedText;
      }
    } catch (error) {
      console.error('❌ Textract failed, falling back to placeholder:', error);
    }
  } else {
    console.log('⚠️ AWS Textract not configured, using placeholder text');
  }
  
  // Fallback to placeholder text if Textract fails or isn't configured
  const fileName = (originalFileName || 'document.pdf').toLowerCase();
  
  if (fileName.includes('auto') || fileName.includes('car') || fileName.includes('vehicle')) {
    return `PERSONAL AUTO POLICY

PART A - LIABILITY COVERAGE
We will pay damages for "bodily injury" or "property damage" for which any "insured" becomes legally responsible because of an auto accident. We will settle or defend, as we consider appropriate, any claim or suit asking for these damages.

PART B - MEDICAL PAYMENTS COVERAGE
We will pay reasonable expenses incurred for necessary medical and funeral services because of "bodily injury" caused by accident and sustained by an "insured."

PART C - UNINSURED MOTORISTS COVERAGE
We will pay compensatory damages which an "insured" is legally entitled to recover from the owner or operator of an "uninsured motor vehicle" because of "bodily injury" sustained by an "insured" and caused by an accident.

PART D - COVERAGE FOR DAMAGE TO YOUR AUTO
We will pay for direct and accidental loss to "your covered auto" or any "non-owned auto", including their equipment, minus any applicable deductible.

LIMITS OF LIABILITY
- Bodily Injury Liability: $250,000 each person / $500,000 each accident
- Property Damage Liability: $100,000 each accident
- Medical Payments: $5,000 each person
- Uninsured Motorist Bodily Injury: $250,000 each person / $500,000 each accident
- Comprehensive Deductible: $500
- Collision Deductible: $1,000

POLICY CHANGES
Changes to Your Policy
This policy contains all the agreements between you and us. Its terms may not be changed or waived except by endorsement issued by us. If a change requires a premium adjustment, we will adjust the premium as of the effective date of change.

Notification Requirements
You must tell us within 60 days when you acquire an additional or replacement auto. We will provide coverage for the additional or replacement auto only if you notify us within this time period. If you fail to notify us within 60 days, coverage for the additional or replacement auto will not be provided.

EXCLUSIONS
We do not provide Liability Coverage for any "insured":
1. Who intentionally causes "bodily injury" or "property damage"
2. For "property damage" to property owned or being transported by that "insured"
3. For "bodily injury" to an employee of that "insured" during the course of employment
4. For that "insured's" liability arising out of the ownership or operation of a vehicle while it is being used as a public or livery conveyance
5. While employed or otherwise engaged in the "business" of selling, repairing, servicing, storing, or parking vehicles

DEFINITIONS
"Auto" means a land motor vehicle, trailer or semitrailer designed for travel on public roads.
"Bodily injury" means bodily harm, sickness or disease, including death that results.
"Property damage" means physical injury to, destruction of, or loss of use of tangible property.

[This is a sample Personal Auto Policy excerpt for a ${fileSizeKB}KB document. In production, actual policy text would be extracted here.]`;
  }
  
  // Default to CGL for other policy types
  return `COMMERCIAL GENERAL LIABILITY POLICY

SECTION I - COVERAGES
COVERAGE A - BODILY INJURY AND PROPERTY DAMAGE LIABILITY
We will pay those sums that the insured becomes legally obligated to pay as damages because of "bodily injury" or "property damage" to which this insurance applies. The amount we will pay for damages is limited as described in Section III - Limits of Insurance.

COVERAGE B - PERSONAL AND ADVERTISING INJURY LIABILITY  
We will pay those sums that the insured becomes legally obligated to pay as damages because of "personal and advertising injury" to which this insurance applies.

SECTION II - WHO IS AN INSURED
You are an insured. Your "volunteers" are also insureds, but only while acting within the scope of their duties as your "volunteers."

SECTION III - LIMITS OF INSURANCE
1. General Aggregate Limit: $2,000,000
2. Products-Completed Operations Aggregate Limit: $2,000,000  
3. Each Occurrence Limit: $1,000,000
4. Personal & Advertising Injury Limit: $1,000,000
5. Fire Damage Limit: $50,000
6. Medical Expense Limit: $5,000

SECTION IV - COMMERCIAL GENERAL LIABILITY CONDITIONS
1. Bankruptcy: Bankruptcy or insolvency of the insured or of the insured's estate will not relieve us of our obligations under this Coverage Part.
2. Duties In The Event Of Occurrence: You must see to it that we are notified as soon as practicable of an "occurrence" or an offense which may result in a claim.

SECTION V - DEFINITIONS
"Bodily injury" means bodily injury, sickness or disease sustained by a person, including death resulting from any of these at any time.

"Property damage" means physical injury to tangible property, including all resulting loss of use of that property.

EXCLUSIONS
This insurance does not apply to:
a. Expected or intended injury
b. Contractual liability  
c. Liquor liability
d. Workers' compensation
e. Employer's liability
f. Pollution
g. Aircraft, auto or watercraft
h. Mobile equipment
i. War
j. Professional liability
k. Damage to your product
l. Damage to your work
m. Damage to impaired property
n. Recall of products

[This is a sample CGL policy excerpt for a ${fileSizeKB}KB document. In production, actual policy text would be extracted here.]`;
}

export async function extractTextFromImage(fileBuffer: Buffer): Promise<string> {
  // For now, we'll return a placeholder
  // In a real implementation, you'd use OCR (like Tesseract or Cloud Vision API)
  const fileSizeKB = Math.round(fileBuffer.length / 1024);
  return `Image document (${fileSizeKB}KB). OCR text extraction will be implemented in production.`;
}

export function splitTextIntoChunks(text: string, maxChunkSize: number = 1000): TextChunk[] {
  const chunks: TextChunk[] = [];
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
  
  let currentChunk = '';
  let chunkIndex = 0;
  
  for (const sentence of sentences) {
    if (currentChunk.length + sentence.length > maxChunkSize && currentChunk.length > 0) {
      chunks.push({
        content: currentChunk.trim(),
        index: chunkIndex++
      });
      currentChunk = '';
    }
    currentChunk += sentence + ' ';
  }
  
  if (currentChunk.trim().length > 0) {
    chunks.push({
      content: currentChunk.trim(),
      index: chunkIndex
    });
  }
  
  return chunks;
}

export async function processDocument(fileBuffer: Buffer, fileType: string, originalFileName?: string): Promise<TextChunk[]> {
  let text = '';
  
  if (fileType === 'application/pdf') {
    text = await extractTextFromPDF(fileBuffer, originalFileName);
  } else if (fileType.startsWith('image/')) {
    text = await extractTextFromImage(fileBuffer);
  } else {
    throw new Error(`Unsupported file type: ${fileType}`);
  }
  
  return splitTextIntoChunks(text);
}