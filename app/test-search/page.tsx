"use client";

import { useState } from "react";
import { Search, FileText, Brain, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
// Removed Progress import - using custom progress bar

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
  const [debugInfo, setDebugInfo] = useState<{
    documents?: { count: number; list: { name: string; id: string }[] };
    chunks?: { count: number; hasEmbeddings: number };
    searchFunction?: { exists: boolean; error?: string };
  } | null>(null);

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
      console.log('Search response:', data);
    } catch (err) {
      setError("Failed to perform search");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const runDatabaseDebug = async () => {
    try {
      const response = await fetch('/api/debug-db');
      const data = await response.json();
      setDebugInfo(data);
      console.log('Database debug:', data);
    } catch (err) {
      console.error('Debug failed:', err);
      setError('Failed to run database debug');
    }
  };

  const testEmbedding = async () => {
    try {
      const response = await fetch('/api/debug-embedding', { method: 'POST' });
      const data = await response.json();
      console.log('Embedding test:', data);
      alert(`Embedding test: ${data.diagnosis?.correctLength ? '✅ Correct length' : '❌ Wrong length'} (${data.embedding?.length} dimensions)`);
    } catch (err) {
      console.error('Embedding test failed:', err);
      setError('Failed to test embedding');
    }
  };

  const testUpload = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/debug-upload', { method: 'POST' });
      const data = await response.json();
      console.log('Upload test:', data);
      if (data.success) {
        alert('✅ Upload system working correctly!');
      } else {
        setError(`Upload test failed: ${data.error}`);
      }
    } catch (err) {
      console.error('Upload test failed:', err);
      setError('Failed to test upload system');
    } finally {
      setLoading(false);
    }
  };

  const testSchema = async () => {
    try {
      const response = await fetch('/api/debug-schema');
      const data = await response.json();
      console.log('Schema test:', data);
      const issues = data.diagnosis?.filter((d: string) => d.includes('❌')).length || 0;
      if (issues === 0) {
        alert('✅ Database schema is properly configured!');
      } else {
        alert(`❌ Found ${issues} database issues. Check console for details.`);
      }
    } catch (err) {
      console.error('Schema test failed:', err);
      setError('Failed to test database schema');
    }
  };

  const testChunking = async () => {
    try {
      const response = await fetch('/api/debug-chunking', { method: 'POST' });
      const data = await response.json();
      console.log('Chunking test:', data);
      const issues = data.analysis?.filter((a: string) => a.includes('❌')).length || 0;
      if (issues === 0) {
        alert(`✅ Chunking working correctly! Creates ${data.documentProcessing?.chunkCount || 0} chunks.`);
      } else {
        alert(`❌ Found ${issues} chunking issues. Check console for details.`);
      }
    } catch (err) {
      console.error('Chunking test failed:', err);
      setError('Failed to test chunking');
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

            <div className="space-y-2">
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
              <div className="grid grid-cols-3 gap-2">
                <Button 
                  onClick={runDatabaseDebug} 
                  variant="outline"
                  disabled={loading}
                  size="sm"
                >
                  Debug DB
                </Button>
                <Button 
                  onClick={testEmbedding} 
                  variant="outline"
                  disabled={loading}
                  size="sm"
                >
                  Test Embed
                </Button>
                <Button 
                  onClick={testUpload} 
                  variant="outline"
                  disabled={loading}
                  size="sm"
                >
                  Test Upload
                </Button>
                <Button 
                  onClick={testSchema} 
                  variant="outline"
                  disabled={loading}
                  size="sm"
                >
                  Test Schema
                </Button>
                <Button 
                  onClick={testChunking} 
                  variant="outline"
                  disabled={loading}
                  size="sm"
                >
                  Test Chunks
                </Button>
              </div>
            </div>
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
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${result.similarity * 100}%` }}
                      />
                    </div>
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

        {debugInfo && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Database Debug Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-sm">
                <div>
                  <strong>Documents:</strong> {debugInfo.documents?.count || 0} found
                  {debugInfo.documents?.list && debugInfo.documents.list.length > 0 && (
                    <ul className="ml-4 mt-2">
                      {debugInfo.documents.list.map((doc: { name: string; id: string }, idx: number) => (
                        <li key={idx} className="text-xs">
                          {doc.name} (ID: {doc.id})
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                
                <div>
                  <strong>Document Chunks:</strong> {debugInfo.chunks?.count || 0} total, {debugInfo.chunks?.hasEmbeddings || 0} with embeddings
                </div>
                
                <div>
                  <strong>Search Function:</strong> {debugInfo.searchFunction?.exists ? '✅ Working' : '❌ Error'}
                  {debugInfo.searchFunction?.error && (
                    <p className="text-red-600 text-xs mt-1">{debugInfo.searchFunction.error}</p>
                  )}
                </div>
                
                <div className="mt-4 p-3 bg-gray-100 rounded text-xs">
                  <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}