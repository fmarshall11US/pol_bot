"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCw, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

interface ReprocessResult {
  success: boolean;
  totalDocuments: number;
  processedCount: number;
  errorCount: number;
  message: string;
}

export default function ReprocessDocumentsPage() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<ReprocessResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleReprocess = async () => {
    setIsProcessing(true);
    setResult(null);
    setError(null);

    try {
      const response = await fetch('/api/reprocess-documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
      } else {
        setError(data.error || 'Failed to reprocess documents');
      }
    } catch {
      setError('Network error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Reprocess Documents
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Re-extract and re-index all documents with updated policy content
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              Document Reprocessing
            </CardTitle>
            <CardDescription>
              This will re-extract text from all uploaded documents and regenerate embeddings.
              Use this after updating the document processor to include new content.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-blue-800">
                  <AlertCircle className="h-4 w-4" />
                  <span className="font-medium">What this does</span>
                </div>
                <ul className="text-blue-700 mt-2 space-y-1 text-sm list-disc list-inside">
                  <li>Re-extracts text from all documents</li>
                  <li>Includes updated policy content (60-day notification, etc.)</li>
                  <li>Regenerates all embeddings with correct dimensions</li>
                  <li>Replaces existing document chunks</li>
                </ul>
              </div>

              <Button 
                onClick={handleReprocess}
                disabled={isProcessing}
                size="lg"
                className="w-full"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Reprocessing Documents...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reprocess All Documents
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
                Reprocessing Complete
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-green-700">
                <p><strong>Total Documents:</strong> {result.totalDocuments}</p>
                <p><strong>Successfully Processed:</strong> {result.processedCount}</p>
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

        {/* Next Steps */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Next Steps</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              After reprocessing, test the Q&A system with questions like:
            </p>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-blue-600">•</span>
                <span>"What happens if I acquire a replacement auto?"</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600">•</span>
                <span>"How long do I have to notify about a new car?"</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600">•</span>
                <span>"What are the notification requirements for policy changes?"</span>
              </li>
            </ul>
          </CardContent>
        </Card>

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