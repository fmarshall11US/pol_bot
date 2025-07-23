"use client";

import { Brain, Database, FileText, Search, Zap, Shield, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              About Our AI Search System
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              How we transform your insurance policies into intelligent, searchable knowledge
            </p>
          </div>
          <a href="/dashboard">
            <Button variant="outline" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </a>
        </div>

        {/* Overview */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-blue-500" />
              System Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Our AI-powered insurance policy search system uses advanced vector embeddings and semantic search 
              to understand your questions in natural language and find relevant information across all your 
              uploaded policies. Here&apos;s how it works behind the scenes:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <FileText className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <h3 className="font-semibold text-sm">Document Processing</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  PDFs are parsed and split into searchable chunks
                </p>
              </div>
              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <Database className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <h3 className="font-semibold text-sm">Vector Embeddings</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  Text is converted to 1536-dimensional vectors
                </p>
              </div>
              <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <Search className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <h3 className="font-semibold text-sm">Semantic Search</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  Questions find relevant content by meaning, not keywords
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Technical Process */}
        <div className="space-y-6">
          {/* Step 1: Document Processing */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-red-500" />
                Step 1: Document Processing
              </CardTitle>
              <CardDescription>
                How we extract and prepare your policy documents for AI analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="mt-1">PDF</Badge>
                  <div>
                    <h4 className="font-medium">PDF Text Extraction</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Using pdf-parse library, we extract raw text from your insurance policy PDFs, 
                      preserving structure and formatting where possible.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="mt-1">CHUNK</Badge>
                  <div>
                    <h4 className="font-medium">Text Chunking</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Documents are split into overlapping 1000-character chunks to ensure context 
                      is preserved while keeping segments manageable for AI processing.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="mt-1">CLEAN</Badge>
                  <div>
                    <h4 className="font-medium">Content Cleaning</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Text is cleaned to remove artifacts, normalize whitespace, and ensure 
                      consistent formatting for optimal embedding generation.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Step 2: Vector Embeddings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-green-600" />
                Step 2: Vector Embeddings Generation
              </CardTitle>
              <CardDescription>
                Converting text into mathematical representations that capture meaning
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="mt-1 bg-green-50 text-green-700">OpenAI</Badge>
                  <div>
                    <h4 className="font-medium">text-embedding-ada-002 Model</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Each text chunk is processed through OpenAI&apos;s advanced embedding model, 
                      creating a 1536-dimensional vector that captures semantic meaning.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="mt-1 bg-blue-50 text-blue-700">pgvector</Badge>
                  <div>
                    <h4 className="font-medium">Vector Storage</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Vectors are stored in Supabase PostgreSQL using the pgvector extension, 
                      enabling efficient similarity search operations.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="mt-1 bg-purple-50 text-purple-700">COSINE</Badge>
                  <div>
                    <h4 className="font-medium">Similarity Calculation</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Cosine similarity is used to measure how closely related different pieces 
                      of content are, with scores from 0 (unrelated) to 1 (identical).
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Step 3: Question Processing */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5 text-blue-600" />
                Step 3: Question Processing & Search
              </CardTitle>
              <CardDescription>
                How your natural language questions find relevant policy information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="mt-1">EMBED</Badge>
                  <div>
                    <h4 className="font-medium">Question Embedding</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Your question is converted into the same 1536-dimensional vector space 
                      using the identical OpenAI embedding model.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="mt-1">SEARCH</Badge>
                  <div>
                    <h4 className="font-medium">Vector Similarity Search</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      The system searches across all document chunks to find the most 
                      semantically similar content, typically returning the top 15 matches.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="mt-1">THRESHOLD</Badge>
                  <div>
                    <h4 className="font-medium">Relevance Filtering</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Results are filtered using a configurable similarity threshold (default 0.3) 
                      to ensure only relevant content is used for answer generation.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Step 4: Answer Generation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-600" />
                Step 4: Intelligent Answer Generation
              </CardTitle>
              <CardDescription>
                Combining retrieved information with AI reasoning to provide comprehensive answers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="mt-1 bg-yellow-50 text-yellow-700">CONTEXT</Badge>
                  <div>
                    <h4 className="font-medium">Context Assembly</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      The top 5 most relevant chunks are combined into a comprehensive context, 
                      maintaining document source information and section references.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="mt-1 bg-blue-50 text-blue-700">GPT-4</Badge>
                  <div>
                    <h4 className="font-medium">Expert Persona Prompt</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      A specialized prompt positions the AI as a senior P&C insurance underwriter 
                      with 20+ years of experience, ensuring authoritative and accurate responses.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="mt-1 bg-green-50 text-green-700">CONFIDENCE</Badge>
                  <div>
                    <h4 className="font-medium">Confidence Scoring</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Answers are tagged with confidence levels (high/medium/low) based on the 
                      similarity scores of the source material used.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Expert Override System */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-purple-600" />
                Expert Override System
              </CardTitle>
              <CardDescription>
                Human expert knowledge that takes precedence over AI-generated answers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="mt-1 bg-purple-50 text-purple-700">PRIORITY</Badge>
                  <div>
                    <h4 className="font-medium">Expert-First Approach</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Before generating AI responses, the system first checks for expert-verified 
                      answers to similar questions (85% similarity threshold by default).
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="mt-1 bg-indigo-50 text-indigo-700">LEARNING</Badge>
                  <div>
                    <h4 className="font-medium">Continuous Improvement</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      When experts provide corrections, these become permanent knowledge that 
                      automatically applies to future similar questions.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="mt-1 bg-gray-50 text-gray-700">CONTEXT</Badge>
                  <div>
                    <h4 className="font-medium">Combined Intelligence</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Expert answers are shown prominently, while AI-generated context 
                      provides additional supporting information from your policies.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Technical Specifications */}
          <Card>
            <CardHeader>
              <CardTitle>Technical Specifications</CardTitle>
              <CardDescription>
                Key technical details about our implementation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium text-sm">Embedding Model</h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400">OpenAI text-embedding-ada-002</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">Vector Dimensions</h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400">1536 dimensions per vector</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">Chunk Size</h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400">1000 characters with overlap</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">Database</h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Supabase PostgreSQL with pgvector</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium text-sm">Answer Generation</h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400">OpenAI GPT-4</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">Search Results</h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Top 15 matches, filtered by threshold</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">Context Chunks</h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Top 5 most relevant for answers</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">Similarity Metric</h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Cosine similarity</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}