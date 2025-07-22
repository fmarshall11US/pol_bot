'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Loader2, Search, RefreshCw, CheckCircle, XCircle } from 'lucide-react';

interface Document {
  id: string;
  file_name: string;
}

interface SearchTest {
  query: string;
  results: any[];
  hasTargetContent: boolean;
  bestSimilarity: number;
}

export default function DiagnoseSearchPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<any>(null);
  const [reprocessResult, setReprocessResult] = useState<any>(null);
  const [testQuery, setTestQuery] = useState('what happens if you acquire a replacement auto');

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const response = await fetch('/api/documents');
      const data = await response.json();
      setDocuments(data.documents || []);
      if (data.documents?.length > 0) {
        setSelectedDoc(data.documents[0].id);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
    }
  };

  const runDiagnostics = async () => {
    if (!selectedDoc) return;
    
    setLoading(true);
    setSearchResults(null);
    
    try {
      const response = await fetch(`/api/debug-search-content?documentId=${selectedDoc}`);
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      console.error('Error running diagnostics:', error);
    } finally {
      setLoading(false);
    }
  };

  const reprocessDocument = async () => {
    if (!selectedDoc) return;
    
    setLoading(true);
    setReprocessResult(null);
    
    try {
      const response = await fetch('/api/reprocess-documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId: selectedDoc })
      });
      const data = await response.json();
      setReprocessResult(data);
      
      // Run diagnostics again after reprocessing
      if (data.success) {
        setTimeout(runDiagnostics, 1000);
      }
    } catch (error) {
      console.error('Error reprocessing:', error);
    } finally {
      setLoading(false);
    }
  };

  const testSearch = async () => {
    if (!selectedDoc || !testQuery) return;
    
    setLoading(true);
    
    try {
      const response = await fetch('/api/test-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: testQuery,
          documentId: selectedDoc 
        })
      });
      const data = await response.json();
      console.log('Test search results:', data);
      alert(`Found ${data.results?.length || 0} results. Best similarity: ${data.stats?.averageSimilarity || 0}`);
    } catch (error) {
      console.error('Error testing search:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <h1 className="text-3xl font-bold mb-6">Search Diagnostics</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Document Selection</CardTitle>
        </CardHeader>
        <CardContent>
          <select
            className="w-full p-2 border rounded"
            value={selectedDoc}
            onChange={(e) => setSelectedDoc(e.target.value)}
          >
            <option value="">Select a document...</option>
            {documents.map(doc => (
              <option key={doc.id} value={doc.id}>
                {doc.file_name}
              </option>
            ))}
          </select>
          
          <div className="flex gap-4 mt-4">
            <Button onClick={runDiagnostics} disabled={loading || !selectedDoc}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
              Run Diagnostics
            </Button>
            
            <Button onClick={reprocessDocument} disabled={loading || !selectedDoc} variant="outline">
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              Reprocess Document
            </Button>
          </div>
          
          <div className="flex gap-2 mt-4">
            <Input
              value={testQuery}
              onChange={(e) => setTestQuery(e.target.value)}
              placeholder="Test query..."
              className="flex-1"
            />
            <Button onClick={testSearch} disabled={loading || !selectedDoc || !testQuery}>
              Test
            </Button>
          </div>
        </CardContent>
      </Card>

      {reprocessResult && (
        <Alert className="mb-6">
          <AlertDescription>
            <strong>Reprocess Result:</strong><br/>
            {reprocessResult.success ? (
              <>
                ✅ Successfully reprocessed {reprocessResult.document?.name}<br/>
                Created {reprocessResult.chunksCreated} chunks<br/>
                {reprocessResult.hasTargetContent ? 
                  '✅ Target content ("60 days" + "replacement auto") found!' : 
                  '❌ Target content not found in chunks'}
              </>
            ) : (
              <>❌ Reprocessing failed: {reprocessResult.error}</>
            )}
          </AlertDescription>
        </Alert>
      )}

      {searchResults && (
        <>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Target Content Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-2">
                <strong>Expected content:</strong> "You must tell us within 60 days when you acquire an additional or replacement auto."
              </p>
              <p className="mb-4">
                {searchResults.targetContentAnalysis?.foundInKeywordSearch ? 
                  <span className="text-green-600">✅ Content found in keyword search</span> : 
                  <span className="text-red-600">❌ Content NOT found in keyword search</span>}
              </p>
              <p>
                <strong>Best matching similarity:</strong> {searchResults.targetContentAnalysis?.bestMatchingSimilarity?.toFixed(3) || 'N/A'}
              </p>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Keyword Search Results</CardTitle>
            </CardHeader>
            <CardContent>
              {Object.entries(searchResults.keywordSearchResults || {}).map(([keyword, data]: [string, any]) => (
                <div key={keyword} className="mb-4 p-4 border rounded">
                  <h3 className="font-bold mb-2">"{keyword}" - Found: {data.found}</h3>
                  {data.chunks?.map((chunk: any, idx: number) => (
                    <div key={idx} className="mb-2 p-2 bg-gray-50 rounded text-sm">
                      <strong>Chunk {chunk.chunkIndex}:</strong> {chunk.content}
                    </div>
                  ))}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Vector Search Results</CardTitle>
            </CardHeader>
            <CardContent>
              {searchResults.vectorSearchResults?.map((test: any, idx: number) => (
                <div key={idx} className="mb-4 p-4 border rounded">
                  <h3 className="font-bold mb-2">Query: "{test.query}"</h3>
                  {test.results?.slice(0, 3).map((result: any, ridx: number) => (
                    <div key={ridx} className="mb-2 p-2 bg-gray-50 rounded">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium">Similarity: {result.similarity.toFixed(3)}</span>
                        {result.hasTargetContent && (
                          <span className="text-green-600 text-sm flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" /> Has target content
                          </span>
                        )}
                      </div>
                      <p className="text-sm">{result.contentPreview}</p>
                    </div>
                  ))}
                </div>
              ))}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}