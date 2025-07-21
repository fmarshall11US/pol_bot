"use client";

import { useState } from "react";
import { Send, Brain, FileText, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Source {
  document: string;
  section: string;
  content: string;
  similarity: number;
  relevance: string;
}

interface QAResponse {
  answer: string;
  sources: Source[];
  confidence: string;
  searchResults: number;
  documentsSearched: number;
}

export default function SmartQAPage() {
  const [question, setQuestion] = useState("");
  const [response, setResponse] = useState<QAResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    setLoading(true);
    setError("");
    setResponse(null);

    try {
      const res = await fetch("/api/smart-qa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: question.trim() }),
      });

      if (!res.ok) {
        throw new Error("Failed to get answer");
      }

      const data = await res.json();
      setResponse(data);
    } catch (err) {
      setError("Failed to process your question. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high': return 'text-green-600 bg-green-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-orange-600 bg-orange-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getRelevanceColor = (relevance: string) => {
    switch (relevance) {
      case 'High': return 'bg-green-100 text-green-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Low': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Smart Insurance Q&A
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Ask any question about your insurance policies and get intelligent answers
          </p>
        </div>

        {/* Question Input */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Ask Your Question
            </CardTitle>
            <CardDescription>
              Ask natural questions like "What is my collision deductible?" or "How long do I have to report a claim?"
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex gap-2">
              <Input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="What would you like to know about your insurance policies?"
                className="flex-1"
                disabled={loading}
              />
              <Button type="submit" disabled={loading || !question.trim()}>
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Error Message */}
        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <p className="text-red-600">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Response */}
        {response && (
          <div className="space-y-6">
            {/* Answer */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5" />
                    Answer
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge className={getConfidenceColor(response.confidence)}>
                      {response.confidence} confidence
                    </Badge>
                    <Badge variant="outline">
                      {response.searchResults} results
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none">
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {response.answer}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Sources */}
            {response.sources.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Sources from Your Policies
                  </CardTitle>
                  <CardDescription>
                    Information used to answer your question
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {response.sources.map((source, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">
                              {source.document}
                            </span>
                            <span className="text-gray-500 text-sm">
                              {source.section}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant="outline" 
                              className={getRelevanceColor(source.relevance)}
                            >
                              {source.relevance}
                            </Badge>
                            <Badge variant="outline">
                              {source.similarity}% match
                            </Badge>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {source.content}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Search Stats */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-center gap-6 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Searched {response.documentsSearched} documents
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Found {response.searchResults} relevant sections
                  </div>
                  <div className="flex items-center gap-2">
                    <Brain className="h-4 w-4" />
                    {response.confidence} confidence answer
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Example Questions */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Try These Example Questions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {[
                "What is my collision deductible?",
                "How long do I have to report a claim?",
                "What are my liability limits?",
                "What is covered under medical payments?",
                "Are rental cars covered?",
                "What exclusions apply to my policy?"
              ].map((example, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="text-left h-auto p-3 justify-start"
                  onClick={() => setQuestion(example)}
                >
                  {example}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}