"use client";

import { useState } from "react";
import { Bug, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface DebugResult {
  debug: {
    question: string;
    totalOverrides: number;
    rpcResults?: number;
    manualResults?: Array<{
      id: string;
      original_question: string;
      corrected_answer: string;
      similarity: number;
      confidence_threshold: number;
      would_trigger: boolean;
    }>;
    bestMatch?: any;
    functionExists: boolean;
    rpcError?: string;
    embedDimensions?: number;
    message?: string;
  };
}

export default function DebugOverridesPage() {
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState<DebugResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleDebug = async () => {
    if (!question.trim()) return;

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/debug-overrides", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: question.trim() }),
      });

      if (!res.ok) {
        throw new Error("Failed to debug overrides");
      }

      const data = await res.json();
      setResult(data);
    } catch (err) {
      setError("Failed to debug overrides. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Debug Expert Overrides
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Check why expert overrides might not be working
          </p>
        </div>

        {/* Debug Input */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bug className="h-5 w-5" />
              Test Override Matching
            </CardTitle>
            <CardDescription>
              Enter a question to see if any overrides would match
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Enter your question to debug..."
                className="flex-1"
                disabled={loading}
              />
              <Button onClick={handleDebug} disabled={loading || !question.trim()}>
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Error */}
        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <p className="text-red-600">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Debug Results */}
        {result && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Debug Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Total Overrides</p>
                    <p className="text-2xl font-bold">{result.debug.totalOverrides}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Function Exists</p>
                    <Badge variant={result.debug.functionExists ? "default" : "destructive"}>
                      {result.debug.functionExists ? "Yes" : "No"}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">RPC Results</p>
                    <p className="text-2xl font-bold">{result.debug.rpcResults || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Embedding Dims</p>
                    <p className="text-2xl font-bold">{result.debug.embedDimensions || 'N/A'}</p>
                  </div>
                </div>

                {result.debug.rpcError && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
                    <p className="text-red-800 font-medium">RPC Error:</p>
                    <p className="text-red-700 text-sm">{result.debug.rpcError}</p>
                  </div>
                )}

                {result.debug.message && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                    <p className="text-yellow-800">{result.debug.message}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Manual Results */}
            {result.debug.manualResults && result.debug.manualResults.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Similarity Analysis</CardTitle>
                  <CardDescription>
                    How similar your question is to existing overrides
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {result.debug.manualResults.map((match, index) => (
                      <div key={match.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <p className="font-medium">{match.original_question}</p>
                            <p className="text-sm text-gray-600 mt-1">{match.corrected_answer}</p>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <Badge variant={match.would_trigger ? "default" : "secondary"}>
                              {(match.similarity * 100).toFixed(1)}% match
                            </Badge>
                            <Badge variant={match.would_trigger ? "default" : "outline"}>
                              {match.would_trigger ? "Would Trigger" : "Won't Trigger"}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-xs text-gray-500">
                          Threshold: {(match.confidence_threshold * 100).toFixed(0)}% | 
                          Similarity: {(match.similarity * 100).toFixed(1)}%
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Back to Dashboard */}
        <div className="mt-8 text-center">
          <a href="/dashboard">
            <Button variant="outline">
              ← Back to Dashboard
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
}