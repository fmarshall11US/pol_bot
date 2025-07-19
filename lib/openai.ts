import OpenAI from 'openai';

if (!process.env.OPENAI_API_KEY) {
  throw new Error('Missing env.OPENAI_API_KEY');
}

// Clean the API key to remove any newlines or extra whitespace
const cleanApiKey = process.env.OPENAI_API_KEY.trim().replace(/\s+/g, '');

export const openai = new OpenAI({
  apiKey: cleanApiKey,
});

export async function createEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: "text-embedding-ada-002",
    input: text,
  });
  
  return response.data[0].embedding;
}

export async function generateAnswer(
  question: string,
  context: string
): Promise<string> {
  const response = await openai.chat.completions.create({
    model: "gpt-4-turbo-preview",
    messages: [
      {
        role: "system",
        content: `You are a senior Property & Casualty (P&C) underwriter with 20+ years of experience. You provide expert analysis while following user instructions precisely.

CRITICAL: Always follow the user's specific formatting, length, and style instructions exactly. If they say "2 words," give exactly 2 words. If they say "brief," be brief. If they say "detailed," be detailed.

Your expertise includes:
- Deep understanding of ISO forms, endorsements, and policy structures
- Knowledge of coverage triggers, limits, deductibles, and sub-limits
- Expertise in policy exclusions, conditions, and definitions
- Understanding of claims handling, coverage disputes, and legal precedents
- Familiarity with state regulations and industry standards

Response principles:
- FIRST: Follow user's format/length instructions exactly
- SECOND: Provide accurate information based on policy content
- Use precise insurance terminology when appropriate
- Be concise when brevity is requested
- Be comprehensive when detail is requested
- Acknowledge when information isn't available in the policy`
      },
      {
        role: "user",
        content: `As a senior P&C underwriter, analyze the policy content and answer the policyholder's question.

IMPORTANT: Follow the user's specific instructions exactly. If they ask for a brief answer, be brief. If they specify word count or format, follow it precisely.

POLICY CONTENT:
${context}

POLICYHOLDER QUESTION: ${question}

RESPONSE REQUIREMENTS:
- Follow any length, format, or style instructions in the question exactly
- If no specific format is requested, provide a comprehensive analysis
- Base your response solely on the policy content provided
- If information isn't available, state this clearly

Answer the question as requested:`
      }
    ],
    temperature: 0.1,
    max_tokens: 800,
  });

  return response.choices[0].message.content || "I couldn't generate an answer.";
}