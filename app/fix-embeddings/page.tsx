"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle, Loader2, Wrench } from "lucide-react";

export default function FixEmbeddingsPage() {
  const [isFixing, setIsFixing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFixEmbeddings = async () => {
    setIsFixing(true);
    setResult(null);
    setError(null);

    try {
      const response = await fetch('/api/fix-embeddings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
      } else {
        setError(data.error || 'Failed to fix embeddings');
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setIsFixing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Fix Embeddings
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Regenerate embeddings for all document chunks with correct dimensions
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              Embedding Repair Tool
            </CardTitle>
            <CardDescription>
              This will regenerate all embeddings in the database with the correct 1536 dimensions.
              This process may take a few minutes depending on the number of documents.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-yellow-800">
                  <AlertCircle className="h-4 w-4" />
                  <span className="font-medium">Important</span>
                </div>
                <p className="text-yellow-700 mt-1">
                  This will regenerate embeddings for all document chunks. The process cannot be undone.
                  Make sure you have sufficient OpenAI API credits as this will make embedding API calls.
                </p>
              </div>

              <Button 
                onClick={handleFixEmbeddings}
                disabled={isFixing}
                size="lg"
                className="w-full"
              >
                {isFixing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Fixing Embeddings...
                  </>
                ) : (
                  <>
                    <Wrench className="h-4 w-4 mr-2" />
                    Fix All Embeddings
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {result && (
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-800">
                <CheckCircle className="h-5 w-5" />
                Embeddings Fixed Successfully
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-green-700">
                <p><strong>Total Chunks:</strong> {result.totalChunks}</p>
                <p><strong>Successfully Fixed:</strong> {result.fixedCount}</p>
                <p><strong>Errors:</strong> {result.errorCount}</p>
                <p className="mt-3 font-medium">{result.message}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error */}
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-800">
                <AlertCircle className="h-5 w-5" />
                Error
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-red-700">{error}</p>
            </CardContent>
          </Card>
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