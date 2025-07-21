"use client";

import { useState } from "react";
import { Search, FileText, Brain, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface SearchResult {
  content: string;
  similarity: number;
  chunk_index: number;
  document_id: string;
}

export default function TestSearchPage() {
  const [query, setQuery] = useState("");
  const [documentId, setDocumentId] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const testVectorSearch = async () => {
    if (!query.trim()) return;
    
    setLoading(true);
    setError("");
    setResults([]);

    try {
      const response = await fetch("/api/test-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          query, 
          documentId: documentId.trim() || undefined 
        }),
      });

      if (!response.ok) {
        throw new Error("Search failed");
      }

      const data = await response.json();
      setResults(data.results || []);
    } catch (err) {
      setError("Failed to perform search");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getSimilarityColor = (similarity: number) => {
    if (similarity > 0.8) return "text-green-600";
    if (similarity > 0.6) return "text-yellow-600";
    return "text-red-600";
  };

  const getSimilarityLabel = (similarity: number) => {
    if (similarity > 0.8) return "High";
    if (similarity > 0.6) return "Medium";
    return "Low";
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Vector Search Testing
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Test how well the AI can find relevant content in your documents
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Test Search Query
            </CardTitle>
            <CardDescription>
              Enter a question or topic to search for in the vector database
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Search Query
              </label>
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g., What is the deductible amount?"
                className="mb-2"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">
                Document ID (optional)
              </label>
              <Input
                value={documentId}
                onChange={(e) => setDocumentId(e.target.value)}
                placeholder="Leave empty to search all documents"
              />
            </div>

            <Button 
              onClick={testVectorSearch} 
              disabled={loading || !query.trim()}
              className="w-full"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Test Vector Search
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="pt-6 flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
              <p className="text-red-600">{error}</p>
            </CardContent>
          </Card>
        )}

        {results.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Search Results ({results.length})
            </h2>
            
            {results.map((result, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">
                        Chunk #{result.chunk_index}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant="outline" 
                        className={getSimilarityColor(result.similarity)}
                      >
                        {getSimilarityLabel(result.similarity)} Match
                      </Badge>
                      <span className="text-sm font-mono">
                        {(result.similarity * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mb-2">
                    <Progress 
                      value={result.similarity * 100} 
                      className="h-2"
                    />
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {result.content}
                  </p>
                  {result.document_id && (
                    <p className="text-xs text-gray-500 mt-2">
                      Document: {result.document_id}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {results.length === 0 && !loading && !error && query && (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="pt-6">
              <p className="text-yellow-800 text-center">
                No results found. Try adjusting your search query or checking if documents are properly indexed.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}