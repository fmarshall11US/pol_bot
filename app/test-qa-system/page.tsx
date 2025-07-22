'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

export default function TestQASystemPage() {
  const [loading, setLoading] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [documentId, setDocumentId] = useState<string>('');

  const runTest = async () => {
    setLoading(true);
    setTestResult(null);
    
    try {
      const response = await fetch('/api/test-qa-direct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId: documentId || null })
      });
      
      const data = await response.json();
      setTestResult(data);
    } catch (error) {
      console.error('Test error:', error);
      setTestResult({ error: 'Test failed' });
    } finally {
      setLoading(false);
    }
  };

  const getDiagnosisIcon = (value: boolean) => {
    return value ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />;
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Q&A System Test</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Test Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Document ID (optional)</label>
            <input
              type="text"
              className="w-full p-2 border rounded"
              placeholder="Leave empty to search all documents"
              value={documentId}
              onChange={(e) => setDocumentId(e.target.value)}
            />
          </div>
          
          <Button onClick={runTest} disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Running Test...
              </>
            ) : (
              'Run Q&A System Test'
            )}
          </Button>
        </CardContent>
      </Card>

      {testResult && (
        <>
          {testResult.error ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Test Failed</AlertTitle>
              <AlertDescription>{testResult.error}</AlertDescription>
            </Alert>
          ) : (
            <>
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Test Question & Answer</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="font-medium mb-1">Question:</p>
                      <p className="text-gray-700">{testResult.question}</p>
                    </div>
                    
                    <div>
                      <p className="font-medium mb-1">Expected Answer:</p>
                      <p className="text-green-700">{testResult.expectedAnswer}</p>
                    </div>
                    
                    <div>
                      <p className="font-medium mb-1">Actual Answer:</p>
                      <p className={testResult.diagnosis?.answerContainsExpectedInfo ? 'text-green-700' : 'text-red-700'}>
                        {testResult.actualAnswer || 'No answer generated'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>System Diagnosis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      {getDiagnosisIcon(testResult.diagnosis?.embeddingWorking)}
                      <span>Embedding Generation (1536 dimensions)</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {getDiagnosisIcon(testResult.diagnosis?.vectorSearchWorking)}
                      <span>Vector Search Function</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {getDiagnosisIcon(testResult.diagnosis?.contentExists)}
                      <span>Target Content Exists in Database</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {getDiagnosisIcon(testResult.diagnosis?.vectorSearchFindingContent)}
                      <span>Vector Search Finding Relevant Content</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {getDiagnosisIcon(testResult.diagnosis?.answerContainsExpectedInfo)}
                      <span>Answer Contains Expected Information</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Search Results Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <p className="text-sm text-gray-600">
                      Found {testResult.searchResults?.totalChunksFound || 0} chunks total,{' '}
                      {testResult.searchResults?.relevantChunksFound || 0} contain target content
                    </p>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Top Vector Search Results:</h4>
                      {testResult.searchResults?.topSimilarities?.map((result: any, idx: number) => (
                        <div key={idx} className="mb-2 p-2 bg-gray-50 rounded">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium">Similarity: {result.similarity.toFixed(3)}</span>
                            {result.hasTargetContent && (
                              <span className="text-green-600 text-sm">Contains target content</span>
                            )}
                          </div>
                          <p className="text-sm text-gray-700">{result.contentPreview}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Direct Keyword Search</CardTitle>
                </CardHeader>
                <CardContent>
                  {Object.entries(testResult.directSearchResults || {}).map(([keyword, data]: [string, any]) => (
                    <div key={keyword} className="mb-4">
                      <h4 className="font-medium mb-2">"{keyword}" - Found: {data.found}</h4>
                      {data.chunks?.map((chunk: any, idx: number) => (
                        <div key={idx} className="mb-2 p-2 bg-gray-50 rounded">
                          <span className="text-sm font-medium">Chunk {chunk.chunkIndex}:</span>
                          <p className="text-sm text-gray-700">{chunk.content}</p>
                        </div>
                      ))}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </>
          )}
        </>
      )}
    </div>
  );
}