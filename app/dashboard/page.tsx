"use client";

import { useState, useEffect } from "react";
import { FileText, MessageSquare, Upload, Calendar, ExternalLink, Plus, Search, Sparkles, Loader2, Brain, Settings, Wrench, RefreshCw, Shield, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface Document {
  id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  created_at: string;
  chunk_count?: number;
}

interface SearchRecommendation {
  document_id: string;
  file_name: string;
  policy_type: string;
  relevance_score: number;
  match_reason: string;
  matched_content: string;
  source: string;
}

export default function Dashboard() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const response = await fetch('/api/documents');
      if (response.ok) {
        const docs = await response.json();
        setDocuments(docs);
      }
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    } finally {
      setIsLoading(false);
    }
  };



  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileTypeIcon = (fileType: string) => {
    if (fileType === 'application/pdf') {
      return <FileText className="h-5 w-5 text-red-500" />;
    }
    return <FileText className="h-5 w-5 text-blue-500" />;
  };

  const getPolicyType = (fileName: string) => {
    const name = fileName.toLowerCase();
    if (name.includes('auto') || name.includes('car') || name.includes('vehicle')) {
      return 'Auto Policy';
    }
    if (name.includes('home') || name.includes('property')) {
      return 'Property Policy';
    }
    if (name.includes('cgl') || name.includes('general') || name.includes('liability')) {
      return 'General Liability';
    }
    return 'Insurance Policy';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Loading your policies...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Policy Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Manage and analyze your insurance policies
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <a href="/smart-qa">
              <Button size="lg" className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700">
                <Brain className="h-5 w-5" />
                🧠 Ask AI Questions
              </Button>
            </a>
            <div className="flex gap-2">
              <a href="/override-management">
                <Button variant="outline" className="flex items-center gap-2 text-purple-600 border-purple-600 hover:bg-purple-50">
                  <Shield className="h-4 w-4" />
                  Expert Overrides
                </Button>
              </a>
              <a href="/upload">
                <Button variant="outline" className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Upload Policy
                </Button>
              </a>
              <a href="/admin">
                <Button variant="ghost" size="sm" className="flex items-center gap-2 text-gray-600">
                  <Shield className="h-4 w-4" />
                  Admin
                </Button>
              </a>
            </div>
          </div>
        </div>

        {/* Ask AI Questions */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-blue-500" />
              Ask AI Questions
            </CardTitle>
            <CardDescription>
              Ask questions about your insurance policies and get AI-powered answers with expert overrides
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !isSearching && searchQuery.trim() && (window.location.href = `/smart-qa?q=${encodeURIComponent(searchQuery.trim())}`)}
                placeholder="e.g., 'What is an auto?', 'What does liability coverage include?', 'How do I file a claim?'..."
                className="flex-1"
              />
              <Button 
                onClick={() => searchQuery.trim() && (window.location.href = `/smart-qa?q=${encodeURIComponent(searchQuery.trim())}`)}
                disabled={!searchQuery.trim()}
                className="px-6 bg-blue-600 hover:bg-blue-700"
              >
                <Brain className="h-4 w-4 mr-2" />
                Ask AI
              </Button>
            </div>
            
            <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
              <p className="mb-2">💡 <strong>How it works:</strong></p>
              <ul className="space-y-1 ml-4">
                <li>• AI searches across all your uploaded policies</li>
                <li>• Expert overrides provide verified answers when available</li>
                <li>• Get both expert knowledge and AI analysis</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Policies</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{documents.length}</div>
              <p className="text-xs text-muted-foreground">
                Uploaded and processed
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ready for Q&A</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{documents.length}</div>
              <p className="text-xs text-muted-foreground">
                Policies processed
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Storage</CardTitle>
              <Upload className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatFileSize(documents.reduce((total, doc) => total + doc.file_size, 0))}
              </div>
              <p className="text-xs text-muted-foreground">
                Across all policies
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Documents List */}
        {documents.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <FileText className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No policies uploaded yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6 text-center max-w-md">
                Upload your first insurance policy to start asking questions and getting AI-powered insights.
              </p>
              <a href="/upload">
                <Button>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Your First Policy
                </Button>
              </a>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {documents.map((doc) => (
              <Card key={doc.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {getFileTypeIcon(doc.file_type)}
                      <div>
                        <CardTitle className="text-lg">{doc.file_name}</CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-1">
                          <Badge variant="outline">
                            {getPolicyType(doc.file_name)}
                          </Badge>
                          <span className="text-sm text-gray-500">
                            {formatFileSize(doc.file_size)}
                          </span>
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(doc.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <a href={`/qa/${doc.id}`}>
                        <Button variant="outline" size="sm">
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Ask Questions
                        </Button>
                      </a>
                      <a href={`/qa/${doc.id}`}>
                        <Button size="sm">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Open
                        </Button>
                      </a>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}